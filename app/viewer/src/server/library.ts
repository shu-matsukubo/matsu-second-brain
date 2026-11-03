import { parse as parseYaml } from 'yaml';
import {
  type DocumentKind,
  type KnowledgeDocument,
  type LibraryPage,
  PAGE_SIZE,
} from '../shared/library';

const OWNER = 'shu-matsukubo';
const REPOSITORY = 'matsu-second-brain';
const API = 'https://api.github.com';
const CACHE_TTL = 60_000;
const MAX_CONCURRENT_BLOBS = 4;
const SHA_PATTERN = /^[a-f0-9]{40}$/;

interface TreeEntry {
  path: string;
  mode: string;
  type: string;
  sha: string;
}

interface GithubTree {
  tree: TreeEntry[];
  truncated: boolean;
}
interface GithubCommit {
  sha: string;
  commit: { tree: { sha: string } };
}
interface CacheValue<T> {
  expiresAt: number;
  value: T;
}

const cache = new Map<string, CacheValue<unknown>>();
const inFlight = new Map<string, Promise<unknown>>();
const MAX_GITHUB_REQUESTS = 4;
let activeGithubRequests = 0;
const githubRequestQueue: Array<() => void> = [];

async function cached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key) as CacheValue<T> | undefined;
  if (hit && hit.expiresAt > Date.now()) return hit.value;
  const pending = inFlight.get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const request = loader()
    .then((value) => {
      cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL });
      if (cache.size > 200) {
        const oldest = cache.keys().next().value as string | undefined;
        if (oldest) cache.delete(oldest);
      }
      return value;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}

async function withGithubRequestSlot<T>(request: () => Promise<T>): Promise<T> {
  if (activeGithubRequests < MAX_GITHUB_REQUESTS) activeGithubRequests += 1;
  else await new Promise<void>((resolve) => githubRequestQueue.push(resolve));
  try {
    return await request();
  } finally {
    const next = githubRequestQueue.shift();
    if (next) next();
    else activeGithubRequests -= 1;
  }
}

async function githubJson<T>(url: string, token: string): Promise<T> {
  return withGithubRequestSlot(async () => {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'matsu-second-brain-knowledge-viewer',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error('github_upstream');
    return response.json() as Promise<T>;
  });
}

function isAllowedMarkdownPath(path: string): boolean {
  if (!path.endsWith('.md') || path.includes('\\') || path.startsWith('/')) return false;
  if (path.split('/').some((segment) => segment === '.' || segment === '..' || segment === ''))
    return false;
  if (path.startsWith('indexes/')) return true;
  const segments = path.split('/');
  return (
    segments[0] === 'knowledge' &&
    ['01-facts', '02-principles', '03-ideas'].includes(segments[1] ?? '') &&
    segments.length >= 4
  );
}

export function parseDocument(path: string, source: string): KnowledgeDocument | null {
  if (!isAllowedMarkdownPath(path)) return null;
  try {
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    const metadata = frontmatter
      ? (parseYaml(frontmatter[1] ?? '') as Record<string, unknown>)
      : {};
    const body = frontmatter ? source.slice(frontmatter[0].length) : source;
    const filename = path.split('/').at(-1)?.replace(/\.md$/i, '') ?? path;
    const title =
      typeof metadata.title === 'string' && metadata.title.trim()
        ? metadata.title.trim()
        : (body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? filename);
    let kind: DocumentKind;
    if (path === 'indexes/index.md') kind = 'index';
    else if (path.startsWith('indexes/')) kind = 'index';
    else if (path.startsWith('knowledge/01-facts/')) kind = 'fact';
    else if (path.startsWith('knowledge/02-principles/')) kind = 'principle';
    else if (path.startsWith('knowledge/03-ideas/')) kind = 'idea';
    else return null;
    const topic =
      typeof metadata.topic === 'string'
        ? metadata.topic
        : kind === 'index'
          ? path.startsWith('indexes/topics/')
            ? filename
            : ''
          : (path.split('/')[2] ?? '');
    const tags = Array.isArray(metadata.tags)
      ? metadata.tags.filter((tag): tag is string => typeof tag === 'string')
      : [];
    const updated = typeof metadata.updated === 'string' ? metadata.updated : undefined;
    return { path, kind, title, topic, tags, ...(updated ? { updated } : {}), body: body.trim() };
  } catch {
    return null;
  }
}

async function mapLimited<T, R>(
  items: T[],
  limit: number,
  mapper: (item: T) => Promise<R>,
): Promise<R[]> {
  const output = new Array<R>(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      const item = items[index];
      if (item === undefined) break;
      output[index] = await mapper(item);
    }
  });
  await Promise.all(workers);
  return output;
}

async function getTree(snapshot: string, token: string): Promise<GithubTree> {
  return cached(`tree:${snapshot}`, () =>
    githubJson<GithubTree>(
      `${API}/repos/${OWNER}/${REPOSITORY}/git/trees/${snapshot}?recursive=1`,
      token,
    ),
  );
}

async function getLatestMainCommit(token: string): Promise<GithubCommit> {
  return cached('main-commit', async () => {
    const commit = await githubJson<GithubCommit>(
      `${API}/repos/${OWNER}/${REPOSITORY}/commits/main`,
      token,
    );
    if (!SHA_PATTERN.test(commit.sha) || !SHA_PATTERN.test(commit.commit.tree.sha))
      throw new Error('github_upstream');
    return commit;
  });
}

export async function getLatestSnapshot(token: string): Promise<string> {
  return (await getLatestMainCommit(token)).sha;
}

export async function getLibraryPage(
  offset: number,
  requestedSnapshot: string | null,
  token: string,
): Promise<LibraryPage> {
  const commit = await getLatestMainCommit(token);
  const snapshot = requestedSnapshot ?? commit.sha;
  if (!SHA_PATTERN.test(snapshot)) throw new Error('invalid_snapshot');
  if (snapshot !== commit.sha) throw new Error('snapshot_changed');
  return cached(`page:${snapshot}:${offset}`, () =>
    buildLibraryPage(offset, snapshot, commit.commit.tree.sha, token),
  );
}

async function buildLibraryPage(
  offset: number,
  snapshot: string,
  treeSha: string,
  token: string,
): Promise<LibraryPage> {
  const tree = await getTree(treeSha, token);
  if (tree.truncated) throw new Error('tree_too_large');
  const entries = tree.tree
    .filter(
      (entry) =>
        entry.type === 'blob' &&
        entry.mode === '100644' &&
        SHA_PATTERN.test(entry.sha) &&
        isAllowedMarkdownPath(entry.path),
    )
    .sort((a, b) => a.path.localeCompare(b.path, 'en'));
  const pageEntries = entries.slice(offset, offset + PAGE_SIZE);
  const documents = (
    await mapLimited(pageEntries, MAX_CONCURRENT_BLOBS, async (entry) => {
      const source = await cached(`blob:${entry.sha}`, async () => {
        const result = await githubJson<{ content: string; encoding: string }>(
          `${API}/repos/${OWNER}/${REPOSITORY}/git/blobs/${entry.sha}`,
          token,
        );
        if (result.encoding !== 'base64') throw new Error('github_upstream');
        return new TextDecoder().decode(
          Uint8Array.from(atob(result.content.replace(/\s/g, '')), (char) => char.charCodeAt(0)),
        );
      });
      return parseDocument(entry.path, source);
    })
  ).filter((document): document is KnowledgeDocument => document !== null);
  return {
    snapshot,
    documents,
    nextOffset: offset + PAGE_SIZE < entries.length ? offset + PAGE_SIZE : null,
    total: entries.length,
  };
}

export function clearLibraryCache(): void {
  cache.clear();
  inFlight.clear();
}
