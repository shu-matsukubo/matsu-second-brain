import { parse as parseYaml } from 'yaml';
import type { DocumentKind, KnowledgeDocument } from './library.ts';

export function isAllowedMarkdownPath(path: string): boolean {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Reject control characters in user-supplied paths.
  if (!path.endsWith('.md') || /[\\\x00-\x1f\x7f]/.test(path) || path.startsWith('/')) return false;
  const segments = path.split('/');
  if (segments.some((segment) => segment === '.' || segment === '..' || segment === ''))
    return false;
  if (path.startsWith('indexes/')) return true;
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
    const metadata: unknown = frontmatter ? parseYaml(frontmatter[1] ?? '') : {};
    if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
    const fields = metadata as Record<string, unknown>;
    const body = frontmatter ? source.slice(frontmatter[0].length) : source;
    const filename = path.split('/').at(-1)?.replace(/\.md$/i, '') ?? path;
    const title =
      typeof fields.title === 'string' && fields.title.trim()
        ? fields.title.trim()
        : (body.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? filename);
    const kind: DocumentKind = path.startsWith('indexes/')
      ? 'index'
      : path.startsWith('knowledge/01-facts/')
        ? 'fact'
        : path.startsWith('knowledge/02-principles/')
          ? 'principle'
          : 'idea';
    const topic =
      typeof fields.topic === 'string'
        ? fields.topic
        : kind === 'index'
          ? path.startsWith('indexes/topics/')
            ? filename
            : ''
          : (path.split('/')[2] ?? '');
    const tags = Array.isArray(fields.tags)
      ? fields.tags.filter((tag): tag is string => typeof tag === 'string')
      : [];
    const updated = typeof fields.updated === 'string' ? fields.updated : undefined;
    return { path, kind, title, topic, tags, ...(updated ? { updated } : {}), body: body.trim() };
  } catch {
    return null;
  }
}
