import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearLibraryCache, getLibraryPage, parseDocument } from './library';

const commitSha = 'a'.repeat(40);
const blobSha = 'b'.repeat(40);
const newerCommitSha = 'e'.repeat(40);

afterEach(() => {
  clearLibraryCache();
  vi.restoreAllMocks();
});

describe('parseDocument', () => {
  it('derives kind and metadata from allowed markdown paths', () => {
    const document = parseDocument(
      'knowledge/01-facts/AWS/認証.md',
      '---\ntitle: 認証\ntopic: AWS\ntags:\n  - token\nupdated: 2026-11-03\n---\n# 本文',
    );
    expect(document).toMatchObject({
      kind: 'fact',
      title: '認証',
      topic: 'AWS',
      tags: ['token'],
      body: '# 本文',
    });
  });

  it.each(['daily/secret.md', 'knowledge/../secret.md', 'knowledge/02-principles/A/no.txt'])(
    'rejects out-of-scope path %s',
    (path) => {
      expect(parseDocument(path, 'body')).toBeNull();
    },
  );

  it('does not treat malformed metadata as a fact', () => {
    expect(
      parseDocument('knowledge/01-facts/A/bad.md', '---\ntitle: [broken\n---\nBody'),
    ).toBeNull();
  });
});

describe('getLibraryPage', () => {
  it('pins pages to one snapshot, filters unsafe tree entries, and limits page size', async () => {
    const paths = Array.from({ length: 21 }, (_, index) => `knowledge/01-facts/A/${index}.md`);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/commits/main'))
        return Response.json({ sha: commitSha, commit: { tree: { sha: blobSha } } });
      if (url.includes('/git/trees/')) {
        return Response.json({
          tree: [
            ...paths.map((path, index) => ({
              path,
              type: 'blob',
              mode: '100644',
              sha: index.toString(16).padStart(40, '0'),
            })),
            { path: 'knowledge/01-facts/A/link.md', type: 'blob', mode: '120000', sha: blobSha },
            { path: 'daily/private.md', type: 'blob', mode: '100644', sha: blobSha },
            { path: 'knowledge/01-facts/A/not.md', type: 'tree', mode: '040000', sha: blobSha },
          ],
          truncated: false,
        });
      }
      if (url.includes('/git/blobs/'))
        return Response.json({ encoding: 'base64', content: btoa('---\ntitle: Safe\n---\nText') });
      throw new Error('unexpected URL');
    });

    const first = await getLibraryPage(0, null, 'dummy-test-token');
    expect(first).toMatchObject({ snapshot: commitSha, total: 21, nextOffset: 20 });
    expect(first.documents).toHaveLength(20);
    const second = await getLibraryPage(20, first.snapshot, 'dummy-test-token');
    expect(second).toMatchObject({ snapshot: commitSha, total: 21, nextOffset: null });
    expect(second.documents).toHaveLength(1);
    expect(fetchMock.mock.calls.some(([input]) => String(input).includes('/commits/main'))).toBe(
      true,
    );
    expect(
      fetchMock.mock.calls.filter(([input]) => String(input).includes('/commits/')),
    ).toHaveLength(1);
    expect(
      fetchMock.mock.calls
        .filter(([input]) => String(input).includes('/git/trees/'))
        .every(([input]) => String(input).includes(blobSha)),
    ).toBe(true);
    expect(
      fetchMock.mock.calls.filter(([input]) => String(input).includes('/git/blobs/')),
    ).toHaveLength(21);
    expect(
      fetchMock.mock.calls.every(([, init]) => {
        const headers = init?.headers as Record<string, string> | undefined;
        return headers?.Authorization === 'Bearer dummy-test-token';
      }),
    ).toBe(true);
  });

  it('returns a generic upstream error without exposing provider details', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(async () =>
      Response.json({ message: 'secret detail' }, { status: 500 }),
    );
    await expect(getLibraryPage(0, commitSha, 'dummy-test-token')).rejects.toThrow(
      'github_upstream',
    );
  });

  it.each(['c'.repeat(40), 'd'.repeat(40)])(
    'rejects a non-main snapshot without fetching that commit (%s)',
    async (requestedSnapshot) => {
      const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
        if (String(input).endsWith('/commits/main'))
          return Response.json({ sha: commitSha, commit: { tree: { sha: blobSha } } });
        throw new Error('unexpected URL');
      });

      await expect(getLibraryPage(0, requestedSnapshot, 'dummy-test-token')).rejects.toThrow(
        'snapshot_changed',
      );
      expect(fetchMock.mock.calls).toHaveLength(1);
      expect(String(fetchMock.mock.calls[0]?.[0])).toMatch(/\/commits\/main$/);
    },
  );

  it('rejects the previous main snapshot after the cached main commit expires', async () => {
    let now = 10_000;
    let mainRequestCount = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => now);
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      if (String(input).endsWith('/commits/main')) {
        mainRequestCount += 1;
        const sha = mainRequestCount === 1 ? commitSha : newerCommitSha;
        return Response.json({ sha, commit: { tree: { sha: blobSha } } });
      }
      if (String(input).includes('/git/trees/'))
        return Response.json({ tree: [], truncated: false });
      throw new Error('unexpected URL');
    });

    const firstPage = await getLibraryPage(0, null, 'dummy-test-token');
    expect(firstPage.snapshot).toBe(commitSha);
    now += 61_000;
    await expect(getLibraryPage(20, firstPage.snapshot, 'dummy-test-token')).rejects.toThrow(
      'snapshot_changed',
    );
    expect(mainRequestCount).toBe(2);
    expect(
      fetchMock.mock.calls.some(([input]) => String(input).includes(`/commits/${commitSha}`)),
    ).toBe(false);
  });

  it('parses a shared blob separately for each path while fetching its body once', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = String(input);
      if (url.endsWith('/commits/main'))
        return Response.json({ sha: commitSha, commit: { tree: { sha: blobSha } } });
      if (url.includes('/git/trees/'))
        return Response.json({
          tree: [
            {
              path: 'knowledge/01-facts/Cloudflare/shared.md',
              type: 'blob',
              mode: '100644',
              sha: 'c'.repeat(40),
            },
            {
              path: 'knowledge/02-principles/Cloudflare/shared.md',
              type: 'blob',
              mode: '100644',
              sha: 'c'.repeat(40),
            },
          ],
          truncated: false,
        });
      if (url.includes('/git/blobs/'))
        return Response.json({
          encoding: 'base64',
          content: btoa('---\ntitle: Shared\n---\nBody'),
        });
      throw new Error('unexpected URL');
    });

    const page = await getLibraryPage(0, commitSha, 'dummy-test-token');
    expect(page.documents.map(({ kind, topic }) => ({ kind, topic }))).toEqual([
      { kind: 'fact', topic: 'Cloudflare' },
      { kind: 'principle', topic: 'Cloudflare' },
    ]);
    expect(
      fetchMock.mock.calls.filter(([input]) => String(input).includes('/git/blobs/')),
    ).toHaveLength(1);
  });
});
