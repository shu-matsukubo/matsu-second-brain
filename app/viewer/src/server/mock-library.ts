import type { Article, KnowledgeDocument, Library } from '../shared/library';

export const mockDocuments: KnowledgeDocument[] = [
  {
    path: 'indexes/index.md',
    kind: 'index',
    title: 'Knowledge Index',
    topic: '',
    tags: ['入口'],
    body: '## Topics\n\n- [アプリ開発](topics/アプリ開発.md)\n- [Cloudflare](topics/Cloudflare.md)',
  },
  {
    path: 'indexes/topics/アプリ開発.md',
    kind: 'index',
    title: 'アプリ開発',
    topic: 'アプリ開発',
    tags: [],
    body: '## Facts\n\n- [APIの分割取得](<../../knowledge/01-facts/アプリ開発/APIの分割取得.md>)\n\n## Principles\n\n- [安全な既定値](<../../knowledge/02-principles/アプリ開発/安全な既定値.md>)\n\n## Ideas\n\n- [Viewer改善案](<../../knowledge/03-ideas/アプリ開発/Viewer 改善案.md>)',
  },
  {
    path: 'indexes/topics/Cloudflare.md',
    kind: 'index',
    title: 'Cloudflare',
    topic: 'Cloudflare',
    tags: [],
    body: '## Facts\n\n- [Workers secret](<../../knowledge/01-facts/Cloudflare/Workers secret.md>)\n\n## Principles\n\n## Ideas',
  },
  {
    path: 'knowledge/01-facts/アプリ開発/APIの分割取得.md',
    kind: 'fact',
    title: 'APIの分割取得',
    topic: 'アプリ開発',
    tags: ['API', 'pagination'],
    updated: '2026-11-03',
    body: '分割取得では各ページが同じ snapshot を参照する。\n\n[アプリ開発 index](../../../indexes/topics/アプリ開発.md)',
  },
  {
    path: 'knowledge/02-principles/アプリ開発/安全な既定値.md',
    kind: 'principle',
    title: '安全な既定値',
    topic: 'アプリ開発',
    tags: ['安全性'],
    updated: '2026-11-03',
    body: '初期状態は安全で理解しやすい設定を選ぶ。\n\n[APIの分割取得](../../01-facts/アプリ開発/APIの分割取得.md)',
  },
  {
    path: 'knowledge/03-ideas/アプリ開発/Viewer 改善案.md',
    kind: 'idea',
    title: 'Viewer改善案',
    topic: 'アプリ開発',
    tags: ['検索', '案'],
    updated: '2026-11-03',
    body: '検索条件を組み合わせる案。\n\n相互リンク: [安全な既定値](../../02-principles/アプリ開発/安全な既定値.md)',
  },
  {
    path: 'knowledge/01-facts/Cloudflare/Workers secret.md',
    kind: 'fact',
    title: 'Workers secret',
    topic: 'Cloudflare',
    tags: ['Workers', 'secret'],
    updated: '2026-11-03',
    body: 'Worker secret はサーバー処理で使う値。\n\n[Cloudflare index](../../../indexes/topics/Cloudflare.md)',
  },
];

const snapshot = '0'.repeat(40);

export function getMockLibrary(): Library {
  return {
    snapshot,
    documents: mockDocuments.map(({ body: _body, ...metadata }) => metadata),
  };
}

export function getMockArticle(path: string, requestedSnapshot: string): Article {
  if (requestedSnapshot !== snapshot) throw new Error('snapshot_changed');
  const document = mockDocuments.find((doc) => doc.path === path);
  if (!document) throw new Error('document_not_found');
  return { path, snapshot, body: document.body };
}
