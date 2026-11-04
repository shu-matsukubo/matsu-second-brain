export type KnowledgeType = 'fact' | 'principle' | 'idea';
export type EvidenceDirection = 'support' | 'oppose' | 'unrelated' | 'none';
export interface EvidenceEntry {
  direction: EvidenceDirection;
  background: string;
  source_id: string;
  origin: 'user' | 'ai';
  input_digest: string;
  counted?: boolean;
  quote?: string;
  occurred_at?: string;
  source_ref?: string;
  input_key?: string;
}
export interface KnowledgeMetadata {
  id: string; title: string; type: KnowledgeType; topic: string; topic_label: string;
  tags: string[]; updated: string; support_streak: number; opposition_streak: number;
  related: string[]; opposes: string[]; evidence: EvidenceEntry[]; history: Array<Record<string, unknown>>;
  sources: Array<Record<string, unknown>>;
}
export interface ValidationResult { valid: boolean; errors: string[] }
export interface OperationPlan {
  version: 1; kind: 'input'|'daily'|'report'|'review'; source_id: string; source_digest: string;
  writes: Array<{ path: string; content: string; expected_digest: string }>;
  moves?: Array<{ from_path: string; to_path: string; id: string; expected_digest: string }>;
  daily_status_path: string|null;
}
export function validateKnowledge(value: unknown): ValidationResult;
export function validateReport(value: unknown): ValidationResult;
export function validateWorkflowState(value: unknown): ValidationResult;
export function validateOperationPlan(value: unknown): ValidationResult;
export const knowledgeTypes: readonly KnowledgeType[];
export const reportStatuses: readonly ('pending'|'in_progress'|'completed'|'deferred'|'blocked')[];
export const reportKinds: readonly ('knowledge'|'policy'|'skill'|'failure'|'other')[];
