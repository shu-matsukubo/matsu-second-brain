import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DocumentMetadata } from '../shared/library';
import { isAllowedMarkdownPath, parseDocument } from '../shared/markdown';
import { clearLibraryCache, getArticle, getLibrary } from './library';

const commitSha = 'a'.repeat(40),
  treeSha = 'b'.repeat(40),
  blobSha = 'c'.repeat(40);
const path = 'knowledge/facts/app-development/api-test.md';
const metadata: DocumentMetadata = {
  id: 'api-test',
  path,
  kind: 'fact',
  title: 'API title',
  topic: 'app-development',
  topicLabel: 'アプリ開発',
  tags: ['API'],
  updated: '2026-11-03',
};
const topics = [
  { key: 'app-development', label: 'アプリ開発', path: 'indexes/topics/app-development.md' },
];
const entry = { path, type: 'blob', mode: '100644', sha: blobSha };
const body = `---\nid: api-test\ntitle: API title\ntype: fact\ntopic: app-development\ntopic_label: アプリ開発\ntags: [API]\nupdated: 2026-11-03\nsupport_streak: 0\nopposition_streak: 0\nrelated: []\nopposes: []\nevidence: []\nhistory: []\nsources: []\n---\n# API title\n\n記事本文`;
const encoded = (source: string) => ({
  encoding: 'base64',
  content: Buffer.from(source).toString('base64'),
});

function mockGithub(
  options: {
    documents?: unknown[];
    topics?: unknown[];
    entries?: unknown[];
    truncated?: boolean;
    body?: string;
  } = {},
) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith('/commits/main'))
      return Response.json({ sha: commitSha, commit: { tree: { sha: treeSha } } });
    if (url.includes('/contents/indexes/library.json'))
      return Response.json(
        encoded(
          JSON.stringify({
            documents: options.documents ?? [metadata],
            topics: options.topics ?? topics,
          }),
        ),
      );
    if (url.includes('/git/trees/'))
      return Response.json({
        tree: options.entries ?? [entry],
        truncated: options.truncated ?? false,
      });
    if (url.includes('/git/blobs/')) return Response.json(encoded(options.body ?? body));
    throw new Error(`Unexpected URL: ${url}`);
  });
}
afterEach(() => {
  clearLibraryCache();
  vi.restoreAllMocks();
});

describe('Markdown metadata and path security', () => {
  it('uses the shared schema validator and separates metadata from the body', () => {
    expect(parseDocument(path, body)).toEqual({ ...metadata, body: '# API title\n\n記事本文' });
    expect(parseDocument('indexes/topics/app-development.md', '# Heading')).toBeNull();
    expect(parseDocument(path, 'No heading')).toBeNull();
    expect(parseDocument(path, body.replace('type: fact', 'type: nope'))).toBeNull();
  });
  it.each([
    'daily/secret.md',
    'feedback/a.md',
    'knowledge/../secret.md',
    'knowledge/facts/app-development/../secret.md',
    'knowledge/other/app-development/test.md',
    'knowledge/facts/test.md',
    'indexes//a.md',
    '/knowledge/facts/topic/id.md',
    'knowledge/facts/../id.md',
    'knowledge/facts/app-development/a.txt',
    'knowledge\\facts\\app-development\\id.md',
    'knowledge/facts/app-development/\u0000id.md',
  ])('rejects %s before network access', async (unsafePath) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    expect(isAllowedMarkdownPath(unsafePath)).toBe(false);
    expect(parseDocument(unsafePath, body)).toBeNull();
    await expect(getArticle(unsafePath, commitSha, 'test-token')).rejects.toThrow(
      'invalid_request',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('getLibrary', () => {
  it('reads metadata only from the committed library JSON and caches it', async () => {
    const fetchMock = mockGithub({ documents: [{ ...metadata, body: 'must not reach client' }] });
    const library = await getLibrary('test-token');
    expect(library).toEqual({ snapshot: commitSha, documents: [metadata], topics });
    expect(JSON.stringify(library)).not.toMatch(/body|token/);
    expect(await getLibrary('test-token')).toEqual(library);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(`?ref=${commitSha}`);
    expect(
      fetchMock.mock.calls.every(
        ([, init]) =>
          (init?.headers as Record<string, string>)?.Authorization === 'Bearer test-token',
      ),
    ).toBe(true);
  });
  it.each([
    { documents: [{ ...metadata, path: 'daily/private.md' }] },
    { documents: [{ ...metadata, id: 'other' }] },
    { topics: [{ ...topics[0], path: 'indexes/../../secret.md' }] },
  ])('rejects invalid or unsafe index entries', async (options) => {
    mockGithub(options);
    await expect(getLibrary('test-token')).rejects.toThrow('invalid_index');
  });
  it('projects away unexpected body fields from committed index data', async () => {
    mockGithub({ documents: [{ ...metadata, body: 'must not be returned' }] });
    const library = await getLibrary('test-token');
    expect(library.documents).toEqual([metadata]);
    expect(JSON.stringify(library)).not.toContain('must not be returned');
  });
  it('refreshes after cache expiry and hides upstream details', async () => {
    let now = 10_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const fetchMock = mockGithub();
    await getLibrary('test-token');
    now += 61_000;
    await getLibrary('test-token');
    expect(
      fetchMock.mock.calls.filter(([url]) => String(url).endsWith('/commits/main')),
    ).toHaveLength(2);
  });
  it.each([403, 404, 429, 500])('does not expose provider details for HTTP %s', async (status) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ message: 'secret detail' }, { status }),
    );
    await expect(getLibrary('test-token')).rejects.toThrow('github_upstream');
  });
});

describe('getArticle', () => {
  it('loads a selected body at the same snapshot, shares inflight work and caches it', async () => {
    const fetchMock = mockGithub();
    await getLibrary('test-token');
    const before = fetchMock.mock.calls.length;
    const [first, second] = await Promise.all([
      getArticle(path, commitSha, 'test-token'),
      getArticle(path, commitSha, 'test-token'),
    ]);
    expect(first).toEqual({ path, snapshot: commitSha, body: '# API title\n\n記事本文' });
    expect(first).toEqual(second);
    expect(fetchMock.mock.calls.length - before).toBe(2);
    expect(await getArticle(path, commitSha, 'test-token')).toEqual(first);
    expect(
      fetchMock.mock.calls.filter(([url]) => String(url).includes('/git/blobs/')),
    ).toHaveLength(1);
  });
  it('rejects stale snapshots, symlinks, unindexed files and truncated trees', async () => {
    const old = 'd'.repeat(40);
    const fetchMock = mockGithub();
    await expect(getArticle(path, old, 'test-token')).rejects.toThrow('snapshot_changed');
    await expect(
      getArticle('knowledge/facts/app-development/missing.md', commitSha, 'test-token'),
    ).rejects.toThrow('document_not_found');
    fetchMock.mockClear();
    clearLibraryCache();
    mockGithub({ entries: [{ ...entry, mode: '120000' }] });
    await expect(getArticle(path, commitSha, 'test-token')).rejects.toThrow('document_not_found');
    clearLibraryCache();
    mockGithub({ truncated: true });
    await expect(getArticle(path, commitSha, 'test-token')).rejects.toThrow('tree_too_large');
  });
  it('does not cache failed body requests', async () => {
    const fetchMock = mockGithub();
    await getLibrary('test-token');
    const original = fetchMock.getMockImplementation();
    let fail = true;
    fetchMock.mockImplementation(async (...args) => {
      if (String(args[0]).includes('/git/blobs/') && fail) {
        fail = false;
        return new Response('unavailable', { status: 500 });
      }
      if (!original) throw new Error('Missing mock');
      return original(...args);
    });
    await expect(getArticle(path, commitSha, 'test-token')).rejects.toThrow('github_upstream');
    expect((await getArticle(path, commitSha, 'test-token')).body).toContain('記事本文');
  });
});
