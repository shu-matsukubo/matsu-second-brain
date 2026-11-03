export type DocumentKind = 'index' | 'fact' | 'principle' | 'idea';

export interface KnowledgeDocument {
  path: string;
  kind: DocumentKind;
  title: string;
  topic: string;
  tags: string[];
  updated?: string;
  body: string;
}

export interface LibraryPage {
  snapshot: string;
  documents: KnowledgeDocument[];
  nextOffset: number | null;
  total: number;
}

export const PAGE_SIZE = 20;
