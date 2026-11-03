import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { generatedFiles, generateIndex, indexPath, repositoryRoot, run } from './generate-index';

let root: string;
async function put(path: string, content: string) {
  await mkdir(dirname(join(root, path)), { recursive: true });
  await writeFile(join(root, path), content);
}
function note(
  id: string,
  type = 'fact',
  topic = 'app-development',
  label = 'アプリ開発',
  links = '',
) {
  return `---\nid: ${id}\ntitle: ${id}\ntype: ${type}\ntopic: ${topic}\ntopic_label: ${label}\ntags: [Viewer, 検索]\nupdated: 2026-11-03\nsupport_streak: 0\nopposition_streak: 0\nrelated: []\nopposes: []\nevidence: []\nhistory: []\nsources: []\n---\n${links}Private body`;
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'viewer-index-'));
  await mkdir(join(root, 'indexes/topics'), { recursive: true });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe('knowledge index generation', () => {
  it('generates deterministic metadata only, topic metadata and standard Markdown links', async () => {
    await put('knowledge/facts/app-development/fact-one.md', note('fact-one', 'fact'));
    await put('knowledge/ideas/app-development/idea-one.md', note('idea-one', 'idea'));
    await put('daily/private.md', '# Do not index');
    await put('knowledge/facts/app-development/readme.txt', 'skip');
    const index = await generateIndex(root);
    expect(index).toEqual({
      documents: [
        expect.objectContaining({
          id: 'fact-one',
          path: 'knowledge/facts/app-development/fact-one.md',
          kind: 'fact',
          topicLabel: 'アプリ開発',
        }),
        expect.objectContaining({
          id: 'idea-one',
          path: 'knowledge/ideas/app-development/idea-one.md',
          kind: 'idea',
          topicLabel: 'アプリ開発',
        }),
      ],
      topics: [
        { key: 'app-development', label: 'アプリ開発', path: 'indexes/topics/app-development.md' },
      ],
    });
    expect(JSON.stringify(index)).not.toMatch(/Private body|body/i);
    const outputs = generatedFiles(index);
    expect(outputs.get('indexes/index.md')).toContain('[アプリ開発](topics/app-development.md)');
    expect(outputs.get('indexes/topics/app-development.md')).toContain(
      '[fact-one](../../knowledge/facts/app-development/fact-one.md)',
    );
    await run(root, false);
    const before = await stat(join(root, indexPath));
    expect(await run(root, true)).toBe(true);
    await run(root, false);
    expect((await stat(join(root, indexPath))).mtimeMs).toBe(before.mtimeMs);
    expect(await readFile(join(root, indexPath), 'utf8')).toBe(
      `${JSON.stringify(index, null, 2)}\n`,
    );
  });

  it('checks without mutating, regenerates changed metadata and removes stale generated topic files', async () => {
    const path = 'knowledge/facts/app-development/one.md';
    await put(path, note('one'));
    await put('indexes/topics/old-topic.md', '# stale');
    expect(await run(root, true)).toBe(false);
    await expect(readFile(join(root, indexPath))).rejects.toMatchObject({ code: 'ENOENT' });
    await run(root, false);
    await expect(readFile(join(root, 'indexes/topics/old-topic.md'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await rm(join(root, path));
    await put(
      'knowledge/facts/developer-tools/one.md',
      note('one', 'fact', 'developer-tools', '開発ツール'),
    );
    expect(await run(root, true)).toBe(false);
    await run(root, false);
    await expect(readFile(join(root, 'indexes/topics/app-development.md'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    await expect(readFile(join(root, 'indexes/topics/old-topic.md'))).rejects.toMatchObject({
      code: 'ENOENT',
    });
    expect(await run(root, true)).toBe(true);
  });

  it.each([
    ['wrong path type', 'knowledge/ideas/app-development/one.md', note('one')],
    ['wrong filename ID', 'knowledge/facts/app-development/wrong.md', note('one')],
  ])('rejects %s', async (_name, path, content) => {
    await put(path, content);
    await expect(generateIndex(root)).rejects.toThrow();
  });

  it('rejects duplicate IDs and missing references across notes', async () => {
    await put('knowledge/facts/app-development/one.md', note('one'));
    await put('knowledge/ideas/app-development/one.md', note('one', 'idea'));
    await expect(generateIndex(root)).rejects.toThrow('Duplicate knowledge ID');
    await rm(join(root, 'knowledge/ideas/app-development/one.md'));
    await put(
      'knowledge/facts/app-development/one.md',
      note('one').replace('related: []', 'related: [missing]'),
    );
    await expect(generateIndex(root)).rejects.toThrow('Unknown related knowledge ID');
  });

  it('rejects invalid YAML without overwriting the last good generation', async () => {
    await put('knowledge/facts/app-development/one.md', note('one'));
    await run(root, false);
    const previous = await readFile(join(root, indexPath));
    await put('knowledge/facts/app-development/one.md', '---\nid: [broken\n---\nText');
    await expect(run(root, false)).rejects.toThrow('Invalid Knowledge metadata');
    expect(await readFile(join(root, indexPath))).toEqual(previous);
  });

  it('rejects symlinks without following them', async ({ skip }) => {
    await mkdir(join(root, 'knowledge/facts'), { recursive: true });
    try {
      await symlink(join(root, 'indexes'), join(root, 'knowledge/facts/linked'), 'junction');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') {
        skip('Windows sandbox does not permit symlinks; Linux CI covers it.');
        return;
      }
      throw error;
    }
    await expect(generateIndex(root)).rejects.toThrow('Symlink is not allowed');
  });

  it('fails closed for obsolete knowledge folders and root/output symlinks', async ({ skip }) => {
    await mkdir(join(root, 'knowledge/01-facts'), { recursive: true });
    await put('knowledge/01-facts/old.md', '# hidden legacy note');
    await expect(generateIndex(root)).rejects.toThrow('Unsupported knowledge directory');
    await rm(join(root, 'knowledge'), { recursive: true });
    await mkdir(join(root, 'target'), { recursive: true });
    try {
      await symlink(join(root, 'target'), join(root, 'knowledge'), 'junction');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') {
        skip('Windows sandbox does not permit symlinks; Linux CI covers it.');
        return;
      }
      throw error;
    }
    await expect(generateIndex(root)).rejects.toThrow('Invalid knowledge directory');
    await rm(join(root, 'knowledge'));
    await mkdir(join(root, 'knowledge/facts'), { recursive: true });
    await writeFile(join(root, 'outside.json'), '{}');
    try {
      await symlink(join(root, 'outside.json'), join(root, 'indexes/library.json'), 'file');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EPERM') {
        skip('Windows sandbox does not permit file symlinks; Linux CI covers it.');
        return;
      }
      throw error;
    }
    await expect(run(root, false)).rejects.toThrow('Invalid generated output target');
  });

  it('runs standalone from another working directory and rejects unknown options', () => {
    const script = join(repositoryRoot, 'app/viewer/scripts/generate-index.ts');
    expect(() =>
      execFileSync(process.execPath, [script, '--unknown'], { cwd: root, stdio: 'pipe' }),
    ).toThrow();
  });
});
