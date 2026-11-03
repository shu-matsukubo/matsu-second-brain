import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateIndex, indexPath, repositoryRoot, run } from './generate-index';

let root: string;
const note = 'knowledge/01-facts/開発/API test.md';
async function put(path: string, content: string) {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), content);
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'viewer-index-'));
  await mkdir(join(root, 'app/viewer'), { recursive: true });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('Viewer index generation', () => {
  it('uses existing metadata and fallback rules, sorts paths, and excludes bodies and other files', async () => {
    await put(
      note,
      '---\ntitle: API title\ntags: [API, 123, 検索]\nupdated: 2026-11-03\n---\nPrivate body',
    );
    await put('indexes/topics/開発.md', '# Development\n\nIndex body');
    await put('knowledge/02-principles/開発/fallback.md', 'No heading');
    await put('daily/private.md', '# Private');
    await put('knowledge/other/private.md', '# Private');
    await put('indexes/ignored.txt', 'Private');
    const index = await generateIndex(root);
    expect(index.documents.map((doc) => doc.path)).toEqual([
      'indexes/topics/開発.md',
      note,
      'knowledge/02-principles/開発/fallback.md',
    ]);
    expect(index.documents[0]).toMatchObject({
      title: 'Development',
      topic: '開発',
      kind: 'index',
    });
    expect(index.documents[1]).toEqual({
      path: note,
      title: 'API title',
      kind: 'fact',
      topic: '開発',
      tags: ['API', '検索'],
      updated: '2026-11-03',
    });
    expect(index.documents[2]?.title).toBe('fallback');
    expect(JSON.stringify(index)).not.toMatch(/body|Private/);
    await run(root, false);
    const before = await stat(join(root, indexPath));
    expect(await run(root, true)).toBe(true);
    expect(await run(root, false)).toBe(true);
    expect((await stat(join(root, indexPath))).mtimeMs).toBe(before.mtimeMs);
    expect(await readFile(join(root, indexPath), 'utf8')).toBe(
      `${JSON.stringify(index, null, 2)}\n`,
    );
  });

  it('detects additions, metadata edits, and deletions without modifying the index in check mode', async () => {
    expect(await run(root, true)).toBe(false);
    await expect(stat(join(root, indexPath))).rejects.toMatchObject({ code: 'ENOENT' });
    await run(root, false);
    for (const change of [
      () => put(note, '---\ntitle: Original\ntags: [old]\n---\nText'),
      () => put(note, '---\ntitle: Changed\ntopic: Other\ntags: [new]\n---\nText'),
      () => rm(join(root, note)),
    ]) {
      await change();
      const original = await readFile(join(root, indexPath));
      const originalStat = await stat(join(root, indexPath));
      expect(await run(root, true)).toBe(false);
      expect(await readFile(join(root, indexPath))).toEqual(original);
      expect((await stat(join(root, indexPath))).mtimeMs).toBe(originalStat.mtimeMs);
      await run(root, false);
      expect(await run(root, true)).toBe(true);
    }
    expect((await generateIndex(root)).documents).toEqual([]);
  });

  it('fails on invalid YAML without replacing the last good index', async () => {
    await run(root, false);
    const previous = await readFile(join(root, indexPath));
    await put(note, '---\ntitle: [broken\n---\nText');
    await expect(run(root, false)).rejects.toThrow('Cannot index knowledge');
    await expect(run(root, true)).rejects.toThrow('Cannot index knowledge');
    expect(await readFile(join(root, indexPath))).toEqual(previous);
  });

  it('ignores directory symlinks instead of indexing their targets', async ({ skip }) => {
    await put('daily/private.md', '# Private');
    await mkdir(join(root, 'indexes'));
    try {
      await symlink(join(root, 'daily'), join(root, 'indexes/linked'), 'junction');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') {
        skip('This Windows sandbox does not permit creating symlinks; CI runs this on Linux.');
        return;
      }
      throw error;
    }
    expect((await generateIndex(root)).documents).toEqual([]);
  });

  it('runs the standalone Node CLI from a different working directory and rejects unknown options', () => {
    const script = join(repositoryRoot, 'app/viewer/scripts/generate-index.ts');
    expect(() => execFileSync(process.execPath, [script, '--check'], { cwd: root })).not.toThrow();
    expect(() =>
      execFileSync(process.execPath, [script, '--unknown'], { cwd: root, stdio: 'pipe' }),
    ).toThrow();
  });
});
