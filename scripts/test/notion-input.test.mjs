import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';
import { inputStore, inputDigest, hash, parseInputRecord } from '../lib/notion-input.mjs';
import { collectMessages } from '../collect-codex-inputs.mjs';

const cli = path.resolve('scripts/brain.mjs');
const snapshot = { page_id: '11111111-1111-4111-8111-111111111111', input_key: 'codex-message-1-0-9', source: 'codex', source_ref: 'chat-a/message-1', occurred_at: '2026-11-04T12:00:00+09:00', quote: 'S3を試したい。', summary: 'S3の試用希望。採用未定。', context: 'ユーザーが試用を希望した。' };
test('canonical Notion record preserves multiline quotes and file-like references without interpreting Markdown', () => {
  const { page_id, ...record } = { ...snapshot, quote: '# heading\n[a](file.md)\nline', source_ref: 'daily/2026/10/08-004412.md' };
  const text = `## 入力記録\n\n\x60\x60\x60json\n${JSON.stringify(record, null, 2)}\n\x60\x60\x60`;
  assert.deepEqual(parseInputRecord(page_id, text), { page_id, ...record });
});
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'notion-brain-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const dir of ['state', 'config', 'daily', 'app/viewer/scripts']) fs.mkdirSync(path.join(root, dir), { recursive: true });
  fs.writeFileSync(path.join(root, 'config/notion-input.json'), '{}');
  fs.writeFileSync(path.join(root, 'app/viewer/scripts/generate-index.ts'), 'process.exit(0)');
  return root;
}
const run = (root, command, input, env = {}, extra = []) => spawnSync(process.execPath, [cli, command, ...(input ? ['-'] : []), ...extra, '--root', root], { input: input ? JSON.stringify(input) : undefined, encoding: 'utf8', env: { ...process.env, ...env } });
function planFor(input = snapshot) {
  const source_id = `notion:${input.page_id}`, source_digest = inputDigest(input);
  const meta = { id: 's3-trial', title: 'S3の試用案', type: 'idea', topic: 'aws', topic_label: 'AWS', tags: [], updated: '2026-11-05', support_streak: 1, opposition_streak: 0, related: [], opposes: [], evidence: [{ source_id, input_digest: source_digest, origin: 'user', direction: 'support', background: input.context, counted: true, quote: input.quote, occurred_at: input.occurred_at, source_ref: input.source_ref, input_key: input.input_key }], history: [], sources: [] };
  const body = `# 内容\n\nS3を試したい。採用未定。\n\n## 関連リンク\n\n（なし）\n\n# 根拠・思考の履歴\n\n- ${input.occurred_at} | ${input.source_ref}\n\n${input.quote}\n`;
  return { version: 1, kind: 'input', source_id, source_digest, writes: [{ path: 'knowledge/ideas/aws/s3-trial.md', expected_digest: hash(''), content: `---\n${YAML.stringify(meta)}---\n${body}` }], daily_status_path: null };
}

test('Notion mode requires a remote queue check and does not consume archived daily', (t) => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, 'daily/old.md'), '---\nstatus: new\n---\nlegacy');
  assert.equal(JSON.parse(run(root, 'next').stdout).kind, 'input_fetch');
  assert.equal(JSON.parse(run(root, 'next', null, {}, ['--input-empty']).stdout).kind, 'review');
});

test('input snapshots reject unknown fields, mixed sources, competing inputs and premature completion', (t) => {
  const root = fixture(t), store = inputStore(root);
  assert.throws(() => store.stage({ ...snapshot, source: 'ai' }), /invalid input source/);
  assert.throws(() => store.stage({ ...snapshot, ignored: 'extra' }), /invalid input snapshot fields/);
  store.stage(snapshot);
  assert.throws(() => store.stage({ ...snapshot, quote: 'changed' }), /in flight/);
  assert.throws(() => store.ack({}), /after local apply/);
  assert.throws(() => store.verify({ ...snapshot, summary: 'decided to adopt' }), /changed during processing/);
});

test('crash after knowledge write resumes once, then only Notion acknowledgement remains', (t) => {
  const root = fixture(t), plan = planFor();
  inputStore(root).stage(snapshot);
  const failed = run(root, 'apply', plan, { BRAIN_FAIL_AFTER_WRITE: '1' });
  assert.equal(failed.status, 1, failed.stderr);
  assert.equal(JSON.parse(run(root, 'next').stdout).kind, 'resume');
  const resumed = run(root, 'resume'); assert.equal(resumed.status, 0, resumed.stderr);
  const next = JSON.parse(run(root, 'next').stdout); assert.equal(next.kind, 'input_ack');
  assert.equal(run(root, 'apply', plan).status, 1);
  assert.equal(run(root, 'validate').status, 0);
  const note = fs.readFileSync(path.join(root, plan.writes[0].path), 'utf8');
  assert.equal(YAML.parse(note.split('---')[1]).evidence.length, 1);
  const ack = run(root, 'input-ack', { page_id: snapshot.page_id, input_key: snapshot.input_key, source_digest: next.digest, status: '完了' });
  assert.equal(ack.status, 0, ack.stderr);
  assert.equal(JSON.parse(run(root, 'next').stdout).kind, 'input_fetch');
  const duplicate = inputStore(root).stage({ ...snapshot, page_id: '22222222-2222-4222-8222-222222222222' });
  assert.equal(duplicate.kind, 'input_duplicate');
  assert.deepEqual(duplicate.receipt.knowledge_ids, ['s3-trial']);
  assert.throws(() => inputStore(root).stage({ ...snapshot, page_id: '22222222-2222-4222-8222-222222222222', quote: 'different user decision' }), /key collision/);
  assert.equal(fs.readFileSync(path.join(root, plan.writes[0].path), 'utf8'), note);
});

test('receipt crash cannot acknowledge before journal recovery', (t) => {
  const root = fixture(t); inputStore(root).stage(snapshot);
  assert.equal(run(root, 'apply', planFor(), { BRAIN_FAIL_AFTER_INPUT_RECEIPT: '1' }).status, 1);
  assert.match(run(root, 'input-ack', {}).stderr, /resume the journal/);
  const result = run(root, 'resume'); assert.equal(result.status, 0, result.stderr);
  assert.equal(JSON.parse(run(root, 'next').stdout).kind, 'input_ack');
});

test('missing original history and external related links are rejected before writes', (t) => {
  const root = fixture(t); inputStore(root).stage(snapshot);
  const plan = planFor();
  plan.writes[0].content = plan.writes[0].content.replace('（なし）', '[official](https://example.com)');
  assert.match(run(root, 'apply', plan).stderr, /relative knowledge links/);
  plan.writes[0].content = planFor().writes[0].content.replace(/# 根拠・思考の履歴[\s\S]*/, '# 根拠・思考の履歴\n\nAI summary only');
  assert.match(run(root, 'apply', plan).stderr, /preserve the input quote/);
  assert.equal(fs.existsSync(path.join(root, 'knowledge')), false);
});

test('Codex collection honors JST boundaries, original timestamps and user provenance', async (t) => {
  const root = fixture(t), dir = path.join(root, 'sessions'); fs.mkdirSync(dir);
  const user = (timestamp, text, provenance = 'user', original = timestamp) => ({ timestamp, type: 'response_item', payload: { type: 'message', role: 'user', id: hash(text), content: [{ type: 'input_text', text }], internal_chat_message_metadata_passthrough: { create_time: Date.parse(original) / 1000, content_item_kinds: [provenance === 'user' ? 'user.text' : 'agents_md.instructions'], content_item_metadata: [{ provenance: { type: provenance } }] } } });
  const rows = [{ type: 'session_meta', payload: { id: 'main', source: 'vscode', thread_source: 'user' } }, user('2026-11-03T14:59:59Z', 'before'), user('2026-11-03T15:00:00Z', 'try S3'), user('2026-11-04T14:59:59Z', 'do not adopt'), user('2026-11-04T15:00:00Z', 'after'), user('2026-11-04T10:00:00Z', 'system text', 'agents_md'), user('2026-11-04T10:00:00Z', 'old replay', 'user', '2026-11-01T10:00:00Z')];
  fs.writeFileSync(path.join(dir, 'main.jsonl'), rows.map(JSON.stringify).join('\n'));
  fs.writeFileSync(path.join(dir, 'guardian.jsonl'), [{ type: 'session_meta', payload: { id: 'guardian', source: { subagent: 'guardian' } } }, user('2026-11-04T10:00:00Z', 'internal')].map(JSON.stringify).join('\n'));
  fs.writeFileSync(path.join(dir, 'exec.jsonl'), [{ type: 'session_meta', payload: { id: 'adapter', source: 'exec', thread_source: 'user' } }, user('2026-11-04T10:00:00Z', 'automated CLI prompt')].map(JSON.stringify).join('\n'));
  const result = await collectMessages(dir, '2026-11-04');
  assert.deepEqual(result.messages.map((m) => m.quote), ['try S3', 'do not adopt']);
  assert.deepEqual(result.errors, []);
});
