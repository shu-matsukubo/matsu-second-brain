import { afterEach, describe, expect, it, vi } from 'vitest';
import { GET as articleHandler } from '../routes/api/article';
import { GET as libraryHandler } from '../routes/api/library';

const { environment, getLibrary, getArticle } = vi.hoisted(() => ({
  environment: { VIEWER_DATA_SOURCE: 'github', MATSU_SECOND_BRAIN_READ_TOKEN: 'test-secret' },
  getLibrary: vi.fn(),
  getArticle: vi.fn(),
}));
vi.mock('void', () => ({ defineHandler: (handler: unknown) => handler }));
vi.mock('void/env', () => ({ env: environment }));
vi.mock('./library', () => ({ getLibrary, getArticle, SHA_PATTERN: /^[a-f0-9]{40}$/ }));

const snapshot = 'a'.repeat(40);
const path = 'knowledge/facts/app-development/test.md';
async function request(handler: unknown, query: Record<string, string | undefined> = {}) {
  return (handler as (context: unknown) => Promise<Response>)({
    req: { query: () => query },
    json: (value: unknown, status = 200, headers?: HeadersInit) =>
      Response.json(value, { status, headers }),
  });
}
afterEach(() => {
  vi.resetAllMocks();
  environment.VIEWER_DATA_SOURCE = 'github';
  environment.MATSU_SECOND_BRAIN_READ_TOKEN = 'test-secret';
});

describe('Viewer APIs', () => {
  it('returns metadata only from the library API and passes the token only to the server', async () => {
    getLibrary.mockResolvedValue({ snapshot, documents: [] });
    const response = await request(libraryHandler);
    expect(await response.json()).toEqual({ snapshot, documents: [] });
    expect(getLibrary).toHaveBeenCalledWith('test-secret');
    expect(getArticle).not.toHaveBeenCalled();
    expect(response.headers.get('Cache-Control')).toBe('no-store');
  });

  it.each([
    {},
    { path },
    { path, snapshot: 'main' },
    { path: 'daily/private.md', snapshot },
    { path: 'indexes/../daily/private.md', snapshot },
    { path: 'indexes/%2e%2e/daily/private.md', snapshot: 'invalid' },
  ])('rejects invalid article requests %j without accessing GitHub', async (query) => {
    const response = await request(articleHandler, query);
    expect(response.status).toBe(400);
    expect(getArticle).not.toHaveBeenCalled();
  });

  it('returns selected bodies and maps missing or stale articles to errors', async () => {
    getArticle.mockResolvedValueOnce({ path, snapshot, body: 'Text' });
    expect(await (await request(articleHandler, { path, snapshot })).json()).toEqual({
      path,
      snapshot,
      body: 'Text',
    });
    expect(getArticle).toHaveBeenCalledWith(path, snapshot, 'test-secret');
    getArticle.mockRejectedValueOnce(new Error('document_not_found'));
    expect((await request(articleHandler, { path, snapshot })).status).toBe(404);
    getArticle.mockRejectedValueOnce(new Error('snapshot_changed'));
    expect((await request(articleHandler, { path, snapshot })).status).toBe(409);
  });

  it('does not return secrets or provider error details', async () => {
    getLibrary.mockRejectedValue(new Error('test-secret provider detail'));
    getArticle.mockRejectedValue(new Error('test-secret provider detail'));
    for (const response of [
      await request(libraryHandler),
      await request(articleHandler, { path, snapshot }),
    ]) {
      expect(response.status).toBe(502);
      expect(await response.text()).not.toMatch(/test-secret|provider detail/);
    }
  });

  it('returns 503 for missing GitHub tokens without requesting data', async () => {
    environment.MATSU_SECOND_BRAIN_READ_TOKEN = '';
    expect((await request(libraryHandler)).status).toBe(503);
    expect((await request(articleHandler, { path, snapshot })).status).toBe(503);
    expect(getLibrary).not.toHaveBeenCalled();
    expect(getArticle).not.toHaveBeenCalled();
  });

  it('uses the same metadata-only and lazy-body contract in mock mode', async () => {
    environment.VIEWER_DATA_SOURCE = 'mock';
    const response = await request(libraryHandler);
    const library = (await response.json()) as {
      snapshot: string;
      documents: Array<{ path: string }>;
    };
    expect(JSON.stringify(library)).not.toContain('"body"');
    const article = await request(articleHandler, {
      path: library.documents[0].path,
      snapshot: library.snapshot,
    });
    expect(await article.json()).toHaveProperty('body');
    expect(getLibrary).not.toHaveBeenCalled();
    expect(getArticle).not.toHaveBeenCalled();
  });
});
