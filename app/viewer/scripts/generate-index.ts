import { readdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { DocumentMetadata, ViewerIndex } from '../src/shared/library.ts';
import { isAllowedMarkdownPath, parseDocument } from '../src/shared/markdown.ts';

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const indexPath = 'app/viewer/library-index.json';

export async function generateIndex(root: string): Promise<ViewerIndex> {
  const documents: DocumentMetadata[] = [];
  async function walk(relativePath: string) {
    const entries = await readdir(join(root, relativePath), { withFileTypes: true });
    for (const entry of entries) {
      const path = `${relativePath}/${entry.name}`;
      // Never follow symlinks or include files the article API cannot serve.
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && isAllowedMarkdownPath(path)) {
        const document = parseDocument(path, await readFile(join(root, path), 'utf8'));
        if (!document) throw new Error(`Invalid Markdown metadata: ${path}`);
        const { body: _body, ...metadata } = document;
        documents.push(metadata);
      }
    }
  }
  for (const directory of ['knowledge', 'indexes']) {
    try {
      // readdir does not reject a directory symlink, so inspect roots separately.
      const entries = await readdir(root, { withFileTypes: true });
      const entry = entries.find((item) => item.name === directory);
      if (entry?.isSymbolicLink()) throw new Error(`Symlink directory: ${directory}`);
      if (entry) await walk(directory);
    } catch (error) {
      throw new Error(`Cannot index ${directory}`, { cause: error });
    }
  }
  documents.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return { documents };
}

export async function run(root: string, check: boolean): Promise<boolean> {
  const output = `${JSON.stringify(await generateIndex(root), null, 2)}\n`;
  const target = join(root, indexPath);
  let existing: string | undefined;
  try {
    existing = await readFile(target, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  // Accommodate Git's CRLF checkout on Windows; generation is always LF.
  if (existing?.replace(/\r\n/g, '\n') === output) return true;
  if (check) {
    console.error(
      `${indexPath} is missing or stale. Run node app/viewer/scripts/generate-index.ts`,
    );
    return false;
  }
  await writeFile(target, output, 'utf8');
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.slice(2).some((arg: string) => arg !== '--check'))
      throw new Error('Usage: node app/viewer/scripts/generate-index.ts [--check]');
    if (!(await run(repositoryRoot, process.argv.includes('--check')))) process.exitCode = 1;
  } catch (error) {
    console.error('Viewer index generation failed:', error);
    process.exitCode = 1;
  }
}
