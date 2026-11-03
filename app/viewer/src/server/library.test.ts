import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DocumentMetadata } from '../shared/library';
import { isAllowedMarkdownPath, parseDocument } from '../shared/markdown';
import { clearLibraryCache, getArticle, getLibrary } from './library';

const commitSha = 'a'.repeat(40);
const treeSha = 'b'.repeat(40);
const blobSha = 'c'.repeat(40);
const path = 'knowledge/01-facts/開発/API test.md';
const metadata: DocumentMetadata = {
  path,
  kind: 'fact',
  title: 'API title',
  topic: '開発',
  tags: ['API'],
};
const entry = { path, type: 'blob', mode: '100644', sha: blobSha };
const encoded = (source: string) => ({
  encoding: 'base64',
  content: Buffer.from(source).toString('base64'),
});

function mockGithub(
  options: { documents?: unknown[]; entries?: unknown[]; truncated?: boolean; body?: string } = {},
) {
  return vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith('/commits/main'))
      return Response.json({ sha: commitSha, commit: { tree: { sha: treeSha } } });
    if (url.includes('/contents/app/viewer/library-index.json'))
      return Response.json(encoded(JSON.stringify({ documents: options.documents ?? [metadata] })));
    if (url.includes('/git/trees/'))
      return Response.json({
        tree: options.entries ?? [entry],
        truncated: options.truncated ?? false,
      });
    if (url.includes('/git/blobs/'))
      return Response.json(
        encoded(options.body ?? '---\ntitle: API title\n---\n# API title\n\n記事本文'),
      );
    throw new Error(`Unexpected URL: ${url}`);
  });
}

afterEach(() => {
  clearLibraryCache();
  vi.restoreAllMocks();
});

describe('Markdown metadata and path security', () => {
  it('uses frontmatter, derives kind from path, and preserves the body separately', () => {
    expect(
      parseDocument(
        path,
        '---\ntitle: Test\ntopic: Custom\ntype: idea\ntags: [API, 42]\nupdated: 2026-11-03\n---\n# Body',
      ),
    ).toEqual({
      path,
      kind: 'fact',
      title: 'Test',
      topic: 'Custom',
      tags: ['API'],
      updated: '2026-11-03',
      body: '# Body',
    });
    expect(parseDocument('indexes/topics/開発.md', '# Heading')).toMatchObject({
      title: 'Heading',
      kind: 'index',
      topic: '開発',
    });
    expect(parseDocument(path, 'No heading')).toMatchObject({ title: 'API test', topic: '開発' });
    expect(parseDocument(path, '---\ntitle: [broken\n---\nBody')).toBeNull();
  });

  it.each([
    'daily/secret.md',
    'feedback/a.md',
    'knowledge/../secret.md',
    'knowledge/01-facts/開発/../secret.md',
    'knowledge/other/A/test.md',
    'knowledge/01-facts/a.md',
    'indexes//a.md',
    '/indexes/a.md',
    'indexes/./a.md',
    'indexes/a.txt',
    'indexes\\secret.md',
    'indexes/\u0000secret.md',
  ])('rejects %s before making any network request', async (unsafePath) => {
    const fetchMock = vi.spyOn(globalThis, 'fetch');
    expect(isAllowedMarkdownPath(unsafePath)).toBe(false);
    expect(parseDocument(unsafePath, 'body')).toBeNull();
    await expect(getArticle(unsafePath, commitSha, 'test-token')).rejects.toThrow(
      'invalid_request',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('getLibrary', () => {
  it('fetches only the committed JSON and caches it, without requesting any Markdown or tree', async () => {
    const fetchMock = mockGithub({ documents: [{ ...metadata, body: 'must not reach client' }] });
    const library = await getLibrary('test-token');
    expect(library).toEqual({ snapshot: commitSha, documents: [metadata] });
    expect(JSON.stringify(library)).not.toMatch(/body|token/);
    expect(await getLibrary('test-token')).toEqual(library);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[1]?.[0])).toContain(`?ref=${commitSha}`);
    expect(
      fetchMock.mock.calls.every(
        ([, init]) =>
          (init?.headers as Record<string, string> | undefined)?.Authorization ===
          'Bearer test-token',
      ),
    ).toBe(true);
  });

  it('does not silently omit unsafe index entries', async () => {
    mockGithub({ documents: [{ ...metadata, path: 'daily/private.md' }] });
    await expect(getLibrary('test-token')).rejects.toThrow('invalid_index');
  });

  it('refreshes the snapshot after the main-commit cache expires', async () => {
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

  it.each([403, 404, 429, 500])('does not expose provider details on HTTP %s', async (status) => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ message: 'secret detail' }, { status }),
    );
    await expect(getLibrary('test-token')).rejects.toThrow('github_upstream');
  });
});

describe('getArticle', () => {
  it('loads only the selected blob at the library snapshot, shares in-flight requests, and caches it', async () => {
    const other = { ...metadata, path: 'knowledge/02-principles/開発/other.md', kind: 'principle' };
    const fetchMock = mockGithub({
      documents: [metadata, other],
      entries: [entry, { ...entry, path: other.path }],
    });
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
    await getArticle(other.path, commitSha, 'test-token');
    expect(
      fetchMock.mock.calls.filter(([url]) => String(url).includes('/git/blobs/')),
    ).toHaveLength(1);
    expect(
      fetchMock.mock.calls.some(([url]) => String(url).includes(`/git/trees/${treeSha}`)),
    ).toBe(true);
  });

  it.each(['d'.repeat(40), 'e'.repeat(40)])(
    'rejects arbitrary or old snapshots %s',
    async (snapshot) => {
      const fetchMock = mockGithub();
      await expect(getArticle(path, snapshot, 'test-token')).rejects.toThrow('snapshot_changed');
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/\/commits\/main$/);
    },
  );

  it.each(['120000', '040000', '160000'])(
    'rejects symlinks, directories, and submodules (mode %s)',
    async (mode) => {
      const fetchMock = mockGithub({ entries: [{ ...entry, mode }] });
      await expect(getArticle(path, commitSha, 'test-token')).rejects.toThrow('document_not_found');
      expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/git/blobs/'))).toBe(false);
    },
  );

  it('rejects files missing from the index and truncated trees', async () => {
    const fetchMock = mockGithub({ truncated: true });
    await expect(getArticle('indexes/missing.md', commitSha, 'test-token')).rejects.toThrow(
      'document_not_found',
    );
    await expect(getArticle(path, commitSha, 'test-token')).rejects.toThrow('tree_too_large');
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/git/blobs/'))).toBe(false);
  });

  it('does not cache failed body requests', async () => {
    const fetchMock = mockGithub();
    fetchMock.mockImplementationOnce(async () =>
      Response.json({ sha: commitSha, commit: { tree: { sha: treeSha } } }),
    );
    await getLibrary('test-token');
    // A failed GitHub blob must be retried, while successful metadata remains cached.
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
