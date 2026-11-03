export type DocumentKind = 'fact' | 'principle' | 'idea';

export interface DocumentMetadata {
  id: string;
  path: string;
  kind: DocumentKind;
  title: string;
  topic: string;
  topicLabel: string;
  tags: string[];
  updated: string;
}

export interface TopicMetadata {
  key: string;
  label: string;
  path: string;
}

export interface KnowledgeDocument extends DocumentMetadata {
  body: string;
}

export interface ViewerIndex {
  documents: DocumentMetadata[];
  topics: TopicMetadata[];
}

export interface Library extends ViewerIndex {
  snapshot: string;
}

export interface Article {
  path: string;
  snapshot: string;
  body: string;
}
