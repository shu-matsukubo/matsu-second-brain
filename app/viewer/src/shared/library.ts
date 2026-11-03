export type DocumentKind = 'index' | 'fact' | 'principle' | 'idea';

export interface DocumentMetadata {
  path: string;
  kind: DocumentKind;
  title: string;
  topic: string;
  tags: string[];
  updated?: string;
}

export interface KnowledgeDocument extends DocumentMetadata {
  body: string;
}

export interface ViewerIndex {
  documents: DocumentMetadata[];
}

export interface Library extends ViewerIndex {
  snapshot: string;
}

export interface Article {
  path: string;
  snapshot: string;
  body: string;
}
