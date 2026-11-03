import { parse as parseYaml } from 'yaml';
import { validateKnowledge } from '../../../../scripts/lib/schema.mjs';
import type { DocumentKind, KnowledgeDocument } from './library.ts';

const TYPE_DIRECTORIES: Record<DocumentKind, string> = {
  fact: 'facts',
  principle: 'principles',
  idea: 'ideas',
};

export function isAllowedMarkdownPath(path: string): boolean {
  // biome-ignore lint/suspicious/noControlCharactersInRegex: Reject control characters in user-supplied paths.
  if (!path.endsWith('.md') || /[\\\x00-\x1f\x7f]/.test(path) || path.startsWith('/')) return false;
  const segments = path.split('/');
  if (segments.some((segment) => segment === '.' || segment === '..' || segment === ''))
    return false;
  return (
    segments.length === 4 &&
    segments[0] === 'knowledge' &&
    ['facts', 'principles', 'ideas'].includes(segments[1] ?? '') &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(segments[2] ?? '')
  );
}

export function parseDocument(path: string, source: string): KnowledgeDocument | null {
  if (!isAllowedMarkdownPath(path)) return null;
  try {
    const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!frontmatter) return null;
    const metadata: unknown = parseYaml(frontmatter[1] ?? '');
    const validation = validateKnowledge(metadata);
    if (!validation.valid || !metadata || typeof metadata !== 'object') return null;
    const fields = metadata as Record<string, unknown>;
    const type = fields.type as DocumentKind;
    const parts = path.split('/');
    if (
      parts[1] !== TYPE_DIRECTORIES[type] ||
      parts[2] !== fields.topic ||
      parts.at(-1) !== `${fields.id}.md`
    )
      return null;
    return {
      id: fields.id as string,
      path,
      kind: type,
      title: fields.title as string,
      topic: fields.topic as string,
      topicLabel: fields.topic_label as string,
      tags: fields.tags as string[],
      updated: fields.updated as string,
      body: source.slice(frontmatter[0].length).trim(),
    };
  } catch {
    return null;
  }
}
