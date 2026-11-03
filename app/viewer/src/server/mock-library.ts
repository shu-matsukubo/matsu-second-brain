import type { Article, KnowledgeDocument, Library, TopicMetadata } from '../shared/library';

const topics: TopicMetadata[] = [
  { key: 'app-development', label: 'アプリ開発', path: 'indexes/topics/app-development.md' },
  { key: 'cloudflare', label: 'Cloudflare', path: 'indexes/topics/cloudflare.md' },
];
export const mockDocuments: KnowledgeDocument[] = [
  {
    id: 'api-pagination',
    path: 'knowledge/facts/app-development/api-pagination.md',
    kind: 'fact',
    title: 'APIの分割取得',
    topic: 'app-development',
    topicLabel: 'アプリ開発',
    tags: ['API', 'pagination'],
    updated: '2026-11-03',
    body: '分割取得では各ページが同じ snapshot を参照する。\n\n[アプリ開発](../../../indexes/topics/app-development.md)',
  },
  {
    id: 'safe-defaults',
    path: 'knowledge/principles/app-development/safe-defaults.md',
    kind: 'principle',
    title: '安全な既定値',
    topic: 'app-development',
    topicLabel: 'アプリ開発',
    tags: ['安全性'],
    updated: '2026-11-02',
    body: '初期状態は安全で理解しやすい設定を選ぶ。\n\n[APIの分割取得](../../facts/app-development/api-pagination.md)',
  },
  {
    id: 'viewer-improvements',
    path: 'knowledge/ideas/app-development/viewer-improvements.md',
    kind: 'idea',
    title: 'Viewer改善案',
    topic: 'app-development',
    topicLabel: 'アプリ開発',
    tags: ['検索', '案'],
    updated: '2026-11-01',
    body: '検索条件を組み合わせる案。\n\n[安全な既定値](../../principles/app-development/safe-defaults.md)',
  },
  {
    id: 'workers-secret',
    path: 'knowledge/facts/cloudflare/workers-secret.md',
    kind: 'fact',
    title: 'Workers secret',
    topic: 'cloudflare',
    topicLabel: 'Cloudflare',
    tags: ['Workers', 'secret'],
    updated: '2026-10-29',
    body: 'Worker secret はサーバー処理で使う値。',
  },
];
const snapshot = '0'.repeat(40);

export function getMockLibrary(): Library {
  return {
    snapshot,
    topics,
    documents: mockDocuments.map(({ body: _body, ...metadata }) => metadata),
  };
}
export function getMockArticle(path: string, requestedSnapshot: string): Article {
  if (requestedSnapshot !== snapshot) throw new Error('snapshot_changed');
  const document = mockDocuments.find((doc) => doc.path === path);
  if (!document) throw new Error('document_not_found');
  return { path, snapshot, body: document.body };
}
