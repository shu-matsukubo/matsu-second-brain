import type { Article, DocumentMetadata, Library, ViewerIndex } from '../shared/library';
import { isAllowedMarkdownPath, parseDocument } from '../shared/markdown';

const REPOSITORY_API = 'https://api.github.com/repos/shu-matsukubo/matsu-second-brain';
const INDEX_PATH = 'app/viewer/library-index.json';
const CACHE_TTL = 60_000;
export const SHA_PATTERN = /^[a-f0-9]{40}$/;

interface TreeEntry {
  path: string;
  mode: string;
  type: string;
  sha: string;
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
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
      }
      return value;
    })
    .finally(() => inFlight.delete(key));
  inFlight.set(key, request);
  return request;
}

async function githubJson<T>(path: string, token: string): Promise<T> {
  if (activeGithubRequests < MAX_GITHUB_REQUESTS) activeGithubRequests += 1;
  else await new Promise<void>((resolve) => githubRequestQueue.push(resolve));
  try {
    const response = await fetch(`${REPOSITORY_API}${path}`, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'User-Agent': 'matsu-second-brain-knowledge-viewer',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error('github_upstream');
    return (await response.json()) as T;
  } finally {
    const next = githubRequestQueue.shift();
    if (next) next();
    else activeGithubRequests -= 1;
  }
}

function decodeContent(result: { content: string; encoding: string }): string {
  if (result.encoding !== 'base64' || typeof result.content !== 'string')
    throw new Error('github_upstream');
  return new TextDecoder().decode(
    Uint8Array.from(atob(result.content.replace(/\s/g, '')), (char) => char.charCodeAt(0)),
  );
}

async function getLatestMainCommit(token: string): Promise<GithubCommit> {
  return cached('main-commit', async () => {
    const commit = await githubJson<GithubCommit>('/commits/main', token);
    if (!SHA_PATTERN.test(commit.sha) || !SHA_PATTERN.test(commit.commit.tree.sha))
      throw new Error('github_upstream');
    return commit;
  });
}

function readIndex(source: string): ViewerIndex {
  const index = JSON.parse(source) as ViewerIndex;
  if (!Array.isArray(index.documents)) throw new Error('invalid_index');
  const seen = new Set<string>();
  const documents = index.documents.map((doc): DocumentMetadata => {
    if (
      typeof doc.path !== 'string' ||
      !isAllowedMarkdownPath(doc.path) ||
      seen.has(doc.path) ||
      !['index', 'fact', 'principle', 'idea'].includes(doc.kind) ||
      typeof doc.title !== 'string' ||
      typeof doc.topic !== 'string' ||
      !Array.isArray(doc.tags) ||
      !doc.tags.every((tag) => typeof tag === 'string') ||
      (doc.updated !== undefined && typeof doc.updated !== 'string')
    )
      throw new Error('invalid_index');
    seen.add(doc.path);
    // Explicit projection prevents an accidentally committed body from reaching the client.
    return {
      path: doc.path,
      kind: doc.kind,
      title: doc.title,
      topic: doc.topic,
      tags: doc.tags,
      ...(doc.updated ? { updated: doc.updated } : {}),
    };
  });
  return { documents };
}

async function getLibraryAtCommit(commit: GithubCommit, token: string): Promise<Library> {
  return cached(`index:${commit.sha}`, async () => {
    const result = await githubJson<{ content: string; encoding: string }>(
      `/contents/${INDEX_PATH}?ref=${commit.sha}`,
      token,
    );
    return { snapshot: commit.sha, ...readIndex(decodeContent(result)) };
  });
}

export async function getLibrary(token: string): Promise<Library> {
  return getLibraryAtCommit(await getLatestMainCommit(token), token);
}

export async function getArticle(path: string, snapshot: string, token: string): Promise<Article> {
  if (!isAllowedMarkdownPath(path) || !SHA_PATTERN.test(snapshot))
    throw new Error('invalid_request');
  const commit = await getLatestMainCommit(token);
  // A caller cannot use this API to read arbitrary historical commits.
  if (snapshot !== commit.sha) throw new Error('snapshot_changed');
  const library = await getLibraryAtCommit(commit, token);
  if (!library.documents.some((doc) => doc.path === path)) throw new Error('document_not_found');
  return cached(`article:${snapshot}:${path}`, async () => {
    const tree = await cached(`tree:${commit.commit.tree.sha}`, () =>
      githubJson<{ tree: TreeEntry[]; truncated: boolean }>(
        `/git/trees/${commit.commit.tree.sha}?recursive=1`,
        token,
      ),
    );
    if (tree.truncated) throw new Error('tree_too_large');
    const entry = tree.tree.find(
      (item) => item.path === path && item.type === 'blob' && item.mode === '100644',
    );
    if (!entry || !SHA_PATTERN.test(entry.sha)) throw new Error('document_not_found');
    const source = await cached(`blob:${entry.sha}`, async () =>
      decodeContent(
        await githubJson<{ content: string; encoding: string }>(`/git/blobs/${entry.sha}`, token),
      ),
    );
    const document = parseDocument(path, source);
    if (!document) throw new Error('invalid_document');
    return { path, snapshot, body: document.body };
  });
}

export function clearLibraryCache(): void {
  cache.clear();
  inFlight.clear();
}
