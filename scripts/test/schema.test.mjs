import test from 'node:test';
import assert from 'node:assert/strict';
import { validateKnowledge, validateReport, validateWorkflowState, validateOperationPlan } from '../lib/schema.mjs';

const knowledge = () => ({ id: 'k-1', title: 'A', type: 'idea', topic: 'topic-key', topic_label: 'Topic', tags: [], updated: '2026-11-03', support_streak: 0, opposition_streak: 0, related: [], opposes: [], evidence: [], history: [], sources: [] });
test('knowledge accepts required metadata and rejects counted AI evidence', () => {
  assert.equal(validateKnowledge(knowledge()).valid, true);
  const bad = knowledge(); bad.evidence.push({ direction: 'support', background: 'x', source_id: 'r.md', origin: 'ai', input_digest: 'd', counted: true });
  const result = validateKnowledge(bad);
  assert.equal(result.valid, false);
  assert.match(result.errors.join(' '), /AI evidence cannot count/);
});
test('report, state, and operation plan validators enforce their contracts', () => {
  assert.equal(validateReport({ id: 'r1', fingerprint: 'f', origin: 'user', kind: 'knowledge', status: 'pending', request: 'change', result: '', created: '2026-11-03', updated: '2026-11-03' }).valid, true);
  assert.equal(validateWorkflowState({ version: 1, pending: null, idleFingerprint: null, acknowledgedInputs: {} }).valid, true);
  const plan = { version: 1, kind: 'daily', source_id: 'daily/x.md', source_digest: 'a'.repeat(64), writes: [], daily_status_path: 'daily/x.md' };
  assert.equal(validateOperationPlan(plan).valid, true);
  const extended = validateOperationPlan({ ...plan, note: 'extra' });
  assert.equal(extended.valid, false);
  assert.match(extended.errors.join(' '), /unknown operation plan field: note/);
});
