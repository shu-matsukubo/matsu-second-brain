import { lstat, mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parse as parseYaml } from 'yaml';
import type { DocumentMetadata, ViewerIndex } from '../src/shared/library.ts';
import { isAllowedMarkdownPath, parseDocument } from '../src/shared/markdown.ts';

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const indexPath = 'indexes/library.json';
const topicDirectory = 'indexes/topics';
const typeDirectories = ['facts', 'principles', 'ideas'] as const;

async function walk(root: string, relativePath: string, files: string[]): Promise<void> {
  const entries = await readdir(join(root, relativePath), { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name, 'en'));
  for (const entry of entries) {
    const path = `${relativePath}/${entry.name}`;
    if (entry.isSymbolicLink()) throw new Error(`Symlink is not allowed: ${path}`);
    if (entry.isDirectory()) await walk(root, path, files);
    else if (entry.isFile() && path.endsWith('.md')) files.push(path);
  }
}

function mdLink(path: string, label: string): string {
  const escaped = path.replaceAll('%', '%25').replaceAll(' ', '%20');
  return `[${label.replaceAll('[', '\\[').replaceAll(']', '\\]')}](${escaped})`;
}

export async function generateIndex(root: string): Promise<ViewerIndex> {
  const files: string[] = [];
  let knowledgeInfo: Awaited<ReturnType<typeof lstat>> | undefined;
  try {
    knowledgeInfo = await lstat(join(root, 'knowledge'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  if (knowledgeInfo?.isSymbolicLink() || (knowledgeInfo && !knowledgeInfo.isDirectory()))
    throw new Error('Invalid knowledge directory');
  if (knowledgeInfo) {
    for (const entry of await readdir(join(root, 'knowledge'), { withFileTypes: true })) {
      if (entry.isSymbolicLink())
        throw new Error(`Symlink is not allowed: knowledge/${entry.name}`);
      if (
        !entry.isDirectory() ||
        !typeDirectories.includes(entry.name as (typeof typeDirectories)[number])
      )
        throw new Error(`Unsupported knowledge directory or file: ${entry.name}`);
    }
    for (const type of typeDirectories) {
      const directory = join(root, 'knowledge', type);
      try {
        const info = await lstat(directory);
        if (info.isSymbolicLink() || !info.isDirectory())
          throw new Error(`Invalid knowledge directory: ${type}`);
        await walk(root, `knowledge/${type}`, files);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    }
  }

  const byPath = new Map<string, DocumentMetadata>();
  const byId = new Map<string, DocumentMetadata>();
  const labels = new Map<string, string>();
  const references = new Map<string, { related: string[]; opposes: string[] }>();
  for (const path of files.sort((a, b) => a.localeCompare(b, 'en'))) {
    if (!isAllowedMarkdownPath(path)) throw new Error(`Invalid knowledge path: ${path}`);
    const document = parseDocument(path, await readFile(join(root, path), 'utf8'));
    if (!document) throw new Error(`Invalid Knowledge metadata or path: ${path}`);
    if (byId.has(document.id)) throw new Error(`Duplicate knowledge ID: ${document.id}`);
    const previousLabel = labels.get(document.topic);
    if (previousLabel && previousLabel !== document.topicLabel)
      throw new Error(`Conflicting topic label: ${document.topic}`);
    labels.set(document.topic, document.topicLabel);
    const { body: _body, ...metadata } = document;
    byPath.set(path, metadata);
    byId.set(document.id, metadata);
    references.set(document.id, await getReferences(root, path));
  }
  for (const document of byId.values()) {
    for (const related of [
      ...(references.get(document.id)?.related ?? []),
      ...(references.get(document.id)?.opposes ?? []),
    ]) {
      if (!byId.has(related))
        throw new Error(`Unknown related knowledge ID ${related} in ${document.path}`);
    }
  }

  const documents = [...byPath.values()];
  const topics = [...new Set(documents.map((document) => document.topic))]
    .sort((a, b) => a.localeCompare(b, 'en'))
    .map((key) => ({ key, label: labels.get(key) ?? key, path: `${topicDirectory}/${key}.md` }));
  return { documents, topics };
}

async function getReferences(
  root: string,
  path: string,
): Promise<{ related: string[]; opposes: string[] }> {
  const source = await readFile(join(root, path), 'utf8');
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const meta = frontmatter ? (parseYaml(frontmatter[1] ?? '') as Record<string, unknown>) : {};
  return {
    related: Array.isArray(meta.related) ? (meta.related as string[]) : [],
    opposes: Array.isArray(meta.opposes) ? (meta.opposes as string[]) : [],
  };
}

export function generatedFiles(index: ViewerIndex): Map<string, string> {
  const outputs = new Map<string, string>();
  for (const topic of index.topics) {
    const rows = (kind: DocumentMetadata['kind']) =>
      index.documents
        .filter((document) => document.topic === topic.key && document.kind === kind)
        .sort((a, b) => a.title.localeCompare(b.title, 'en') || a.id.localeCompare(b.id, 'en'))
        .map(
          (document) => `- ${mdLink(`../../${document.path}`, document.title)} (${document.id})`,
        );
    const sections = (
      [
        ['fact', '事実'],
        ['principle', '思想'],
        ['idea', 'アイディア'],
      ] as const
    ).map(([kind, label]) => `## ${label}\n\n${rows(kind).join('\n') || '（なし）'}`);
    outputs.set(topic.path, `# ${topic.label}\n\n${sections.join('\n\n')}\n`);
  }
  outputs.set(
    'indexes/index.md',
    `# Knowledge Index\n\n${index.topics.map((topic) => `- ${mdLink(`topics/${topic.key}.md`, topic.label)} (${topic.key})`).join('\n')}\n`,
  );
  outputs.set(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  return outputs;
}

async function atomicWrite(target: string, content: string): Promise<void> {
  const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
  try {
    await writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' });
    await rename(temporary, target);
  } finally {
    await unlink(temporary).catch(() => {});
  }
}

export async function run(root: string, check: boolean): Promise<boolean> {
  const index = await generateIndex(root);
  const outputs = generatedFiles(index);
  const indexDirectory = join(root, 'indexes');
  try {
    const info = await lstat(indexDirectory);
    if (info.isSymbolicLink() || !info.isDirectory()) throw new Error('Invalid indexes directory');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  const topicRoot = join(root, topicDirectory);
  const staleTopics: string[] = [];
  try {
    const info = await lstat(topicRoot);
    if (info.isSymbolicLink() || !info.isDirectory())
      throw new Error('Invalid topic index directory');
    const entries = await readdir(topicRoot, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isSymbolicLink())
        throw new Error(`Symlink is not allowed: ${topicDirectory}/${entry.name}`);
      if (entry.isFile() && entry.name.endsWith('.md')) {
        const path = `${topicDirectory}/${entry.name}`;
        if (!outputs.has(path)) staleTopics.push(path);
      }
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }

  let current = true;
  for (const path of staleTopics) {
    current = false;
    if (!check) await unlink(join(root, path));
  }
  for (const [path, content] of outputs) {
    let existing: string | undefined;
    try {
      const info = await lstat(join(root, path));
      if (info.isSymbolicLink() || !info.isFile())
        throw new Error(`Invalid generated output target: ${path}`);
      existing = await readFile(join(root, path), 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    if (existing?.replace(/\r\n/g, '\n') !== content) {
      current = false;
      if (!check) {
        const target = join(root, path);
        await mkdir(dirname(target), { recursive: true });
        await atomicWrite(target, content);
      }
    }
  }
  if (check && !current) console.error('Generated indexes are stale. Run npm run index:generate.');
  return current || !check;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.slice(2).some((arg: string) => arg !== '--check'))
      throw new Error('Usage: node app/viewer/scripts/generate-index.ts [--check]');
    if (!(await run(repositoryRoot, process.argv.includes('--check')))) process.exitCode = 1;
  } catch (error) {
    console.error('Index generation failed:', error);
    process.exitCode = 1;
  }
}
