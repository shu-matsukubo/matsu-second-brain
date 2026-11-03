import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';

const cli = path.resolve('scripts/brain.mjs');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'daily', '2026'), { recursive: true });
  fs.mkdirSync(path.join(root, 'state'), { recursive: true });
  fs.mkdirSync(path.join(root, 'report'), { recursive: true });
  return root;
}
function dailyFile(root) {
  const file = path.join(root, 'daily', '2026', 'entry.md');
  const value = '---\r\ncreated: 2026-01-01\r\nstatus: new\r\ntitle: Keep bytes\r\n---\r\nbody\r\n';
  fs.writeFileSync(file, value);
  const meta = { created: '2026-01-01', title: 'Keep bytes' };
  const sourceDigest = sha(`${YAML.stringify(meta)}\nbody\r\n`);
  return { file, value, relative: 'daily/2026/entry.md', sourceDigest };
}
function invoke(root, command, env = {}, extra = []) {
  return spawnSync(process.execPath, [cli, command, ...extra, '--root', root], { encoding: 'utf8', env: { ...process.env, ...env } });
}
function makePlan(source, writePath = 'report/result.md') {
  const content = `---\n${YAML.stringify({ id: 'result', fingerprint: 'result-fingerprint', origin: 'ai', kind: 'failure', status: 'pending', request: 'workflow result', result: 'outcome', created: '2026-01-01', updated: '2026-01-01' })}---\n`;
  return { version: 1, kind: 'daily', source_id: source.relative, source_digest: source.sourceDigest, writes: [{ path: writePath, content, expected_digest: sha('') }], daily_status_path: source.relative };
}
test('apply rejects unknown plan fields without mutating journal, state, daily, knowledge, or report files', (t) => {
  const root = fixture(t), source = dailyFile(root), planPath = path.join(root, 'plan.json');
  const plan = { ...makePlan(source), note: 'extra' };
  fs.writeFileSync(planPath, JSON.stringify(plan));
  const result = invoke(root, 'apply', {}, [planPath]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /unknown operation plan field: note/);
  assert.equal(fs.readFileSync(source.file, 'utf8'), source.value);
  assert.deepEqual(fs.readdirSync(path.join(root, 'state')), []);
  assert.equal(fs.existsSync(path.join(root, 'knowledge')), false);
  assert.deepEqual(fs.readdirSync(path.join(root, 'report')), []);
});
test('resume restores a daily operation from its journal after the plan file is removed', (t) => {
  const root = fixture(t), source = dailyFile(root), planPath = path.join(root, 'plan.json');
  const indexScript = path.join(root, 'app', 'viewer', 'scripts', 'generate-index.ts');
  fs.mkdirSync(path.dirname(indexScript), { recursive: true }); fs.writeFileSync(indexScript, 'process.exit(0);');
  const metadata = {
    id: 'daily-idea', title: 'Keep one human support', type: 'idea', topic: 'workflow', topic_label: 'Workflow', tags: [], updated: '2026-01-01',
    support_streak: 1, opposition_streak: 0, related: [], opposes: [],
    evidence: [{ direction: 'support', background: 'One human input supports this idea.', source_id: source.relative, origin: 'user', input_digest: source.sourceDigest, counted: true }],
    history: [], sources: []
  };
  const content = `---\n${YAML.stringify(metadata)}---\n# Keep one human support\n`;
  const plan = makePlan(source, 'knowledge/ideas/workflow/daily-idea.md');
  plan.writes = [{ path: 'knowledge/ideas/workflow/daily-idea.md', content, expected_digest: sha('') }];
  fs.writeFileSync(planPath, JSON.stringify(plan));
  const failed = invoke(root, 'apply', { BRAIN_FAIL_AFTER_WRITE: '1' }, [planPath]);
  assert.equal(failed.status, 1);
  assert.equal(fs.existsSync(path.join(root, 'state', 'journal.json')), true);
  const journal = JSON.parse(fs.readFileSync(path.join(root, 'state', 'journal.json'), 'utf8'));
  assert.equal(journal.kind, 'daily');
  assert.equal(typeof journal.plan_digest, 'string');
  fs.unlinkSync(planPath);
  assert.equal(JSON.parse(invoke(root, 'next').stdout).kind, 'resume');
  const retried = invoke(root, 'resume');
  assert.equal(retried.status, 0, retried.stderr);
  assert.equal(fs.readFileSync(source.file, 'utf8'), source.value.replace('status: new', 'status: processed'));
  const committed = YAML.parse(fs.readFileSync(path.join(root, 'knowledge', 'ideas', 'workflow', 'daily-idea.md'), 'utf8').split('---')[1]);
  assert.equal(committed.support_streak, 1);
  assert.equal(committed.evidence.length, 1);
  assert.equal(fs.existsSync(path.join(root, 'state', 'journal.json')), false);
  fs.writeFileSync(planPath, JSON.stringify(plan));
  assert.match(invoke(root, 'apply', {}, [planPath]).stdout, /already applied/);
  const alteredPath = path.join(root, 'altered-plan.json');
  fs.writeFileSync(alteredPath, JSON.stringify(makePlan(source, 'report/second.md')));
  assert.match(invoke(root, 'apply', {}, [alteredPath]).stderr, /already processed by another operation/);
});
test('apply rejects a concurrent write and refuses writes outside knowledge/report', (t) => {
  const root = fixture(t), source = dailyFile(root), planPath = path.join(root, 'plan.json');
  fs.writeFileSync(planPath, JSON.stringify(makePlan(source)));
  invoke(root, 'apply', { BRAIN_FAIL_AFTER_WRITE: '1' }, [planPath]);
  const humanEdit = makePlan(source).writes[0].content.replace('result: outcome', 'result: human edit');
  fs.writeFileSync(path.join(root, 'report', 'result.md'), humanEdit);
  const retry = invoke(root, 'apply', {}, [planPath]);
  assert.equal(retry.status, 1);
  assert.match(retry.stderr, /concurrent write conflict/);
  assert.match(fs.readFileSync(source.file, 'utf8'), /status: new/);
  const unsafeRoot = fixture(t), unsafeSource = dailyFile(unsafeRoot), unsafePath = path.join(unsafeRoot, 'unsafe-plan.json');
  fs.writeFileSync(unsafePath, JSON.stringify(makePlan(unsafeSource, 'daily/changed.md')));
  assert.match(invoke(unsafeRoot, 'apply', {}, [unsafePath]).stderr, /outside the knowledge\/report/);
});
test('a crash after daily status advancement resumes from the journal without replaying another plan', (t) => {
  const root = fixture(t), source = dailyFile(root), planPath = path.join(root, 'plan.json');
  fs.writeFileSync(planPath, JSON.stringify(makePlan(source)));
  const interrupted = invoke(root, 'apply', { BRAIN_FAIL_AFTER_STATUS: '1' }, [planPath]);
  assert.equal(interrupted.status, 1);
  assert.match(fs.readFileSync(source.file, 'utf8'), /status: processed/);
  assert.equal(fs.existsSync(path.join(root, 'state', 'journal.json')), true);
  const resumed = invoke(root, 'apply', {}, [planPath]);
  assert.equal(resumed.status, 0, resumed.stderr);
  assert.equal(fs.existsSync(path.join(root, 'state', 'journal.json')), false);
  const alternatePath = path.join(root, 'alternate-plan.json');
  fs.writeFileSync(alternatePath, JSON.stringify(makePlan(source, 'report/alternate.md')));
  assert.match(invoke(root, 'apply', {}, [alternatePath]).stderr, /already processed by another operation/);
});
test('resume rejects an absent, corrupted, or kind-mismatched journal', (t) => {
  const root = fixture(t), source = dailyFile(root), planPath = path.join(root, 'plan.json');
  assert.match(invoke(root, 'resume').stderr, /no pending journal to resume/);
  const plan = makePlan(source);
  fs.writeFileSync(planPath, JSON.stringify(plan));
  assert.equal(invoke(root, 'apply', { BRAIN_FAIL_AFTER_WRITE: '1' }, [planPath]).status, 1);

  const wrongKindPlan = { ...plan, kind: 'report' };
  const wrongKindPath = path.join(root, 'wrong-kind.json');
  fs.writeFileSync(wrongKindPath, JSON.stringify(wrongKindPlan));
  assert.match(invoke(root, 'apply', {}, [wrongKindPath]).stderr, /does not match the pending journal/);

  const journalPath = path.join(root, 'state', 'journal.json');
  const journal = JSON.parse(fs.readFileSync(journalPath, 'utf8'));
  journal.kind = 'unsupported';
  fs.writeFileSync(journalPath, JSON.stringify(journal));
  assert.match(invoke(root, 'resume').stderr, /missing or invalid kind/);
  assert.match(invoke(root, 'apply', {}, [planPath]).stderr, /missing or invalid kind/);
  assert.equal(fs.existsSync(path.join(root, 'state', 'journal.json')), true);

  const equivalentRoot = fixture(t), equivalentSource = dailyFile(equivalentRoot), originalPlan = makePlan(equivalentSource);
  const originalPath = path.join(equivalentRoot, 'original.json');
  fs.writeFileSync(originalPath, JSON.stringify(originalPlan));
  assert.equal(invoke(equivalentRoot, 'apply', { BRAIN_FAIL_AFTER_WRITE: '1' }, [originalPath]).status, 1);
  const equivalentPlan = {
    daily_status_path: originalPlan.daily_status_path,
    writes: originalPlan.writes,
    source_digest: originalPlan.source_digest,
    version: originalPlan.version,
    source_id: originalPlan.source_id,
    kind: originalPlan.kind,
    moves: []
  };
  const equivalentPath = path.join(equivalentRoot, 'equivalent.json');
  fs.writeFileSync(equivalentPath, JSON.stringify(equivalentPlan));
  assert.equal(invoke(equivalentRoot, 'apply', {}, [equivalentPath]).stdout.trim(), 'applied');
  assert.equal(invoke(equivalentRoot, 'apply', {}, [originalPath]).stdout.trim(), 'already applied');
});
test('report-add deduplicates stable fingerprints and validates safe IDs', (t) => {
  const root = fixture(t), input = path.join(root, 'report.json');
  const base = { id: 'report-a', fingerprint: 'sha-id', origin: 'user', kind: 'knowledge', status: 'pending', request: 'human ask', result: '', created: '2026-01-01', updated: '2026-01-01' };
  fs.writeFileSync(input, JSON.stringify(base));
  assert.equal(invoke(root, 'report-add', {}, [input]).status, 0);
  assert.equal(JSON.parse(invoke(root, 'report-add', {}, [input]).stdout).added, false);
  assert.match(fs.readFileSync(path.join(root, 'report', 'report-a.md'), 'utf8'), /request: human ask/);
});
test('next sorts Japanese registration dates across month boundaries', (t) => {
  const root = fixture(t);
  const add = (relative, registered) => {
    const file = path.join(root, relative); fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, `---\nstatus: new\n登録日時: ${registered}\n---\nbody\n`);
  };
  add('daily/2026/10/01-010000.md', '2026-10-01 01:00:00');
  add('daily/2026/09/28-013303.md', '2026-09-28 01:33:03');
  add('daily/2026/09/29-040611.md', '2026-09-29 04:06:11');
  assert.equal(JSON.parse(invoke(root, 'next').stdout).path, 'daily/2026/09/28-013303.md');
});
test('next fallback reads HHmmss after the day from a dated path', (t) => {
  const root = fixture(t);
  const file = path.join(root, 'daily', '2026', '09', '28-013303.md');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, '---\nstatus: new\n---\nbody\n');
  const next = JSON.parse(invoke(root, 'next').stdout);
  assert.equal(next.path, 'daily/2026/09/28-013303.md');
  assert.equal(next.date, '2026-09-28 01:33:03');
});
test('five supporting inputs promote an idea through a verified stable-ID move', (t) => {
  const root = fixture(t), source = dailyFile(root);
  const oldPath = 'knowledge/ideas/workflow/k-1.md', newPath = 'knowledge/principles/workflow/k-1.md';
  const oldFile = path.join(root, oldPath); fs.mkdirSync(path.dirname(oldFile), { recursive: true });
  const evidence = Array.from({ length: 4 }, (_, i) => {
    const oldSource = `daily/2026/old-${i}.md`;
    fs.writeFileSync(path.join(root, oldSource), `Human input ${i}`);
    return { direction: 'support', background: `prior support ${i}`, source_id: oldSource, origin: 'user', input_digest: String(i + 1).repeat(64), counted: true };
  });
  const oldMeta = { id: 'k-1', title: 'Keep recurring jobs simple', type: 'idea', topic: 'workflow', topic_label: 'Workflow', tags: [], updated: '2026-01-01', support_streak: 4, opposition_streak: 0, related: [], opposes: [], evidence, history: [], sources: [] };
  const oldContent = `---\n${YAML.stringify(oldMeta)}---\n# Keep recurring jobs simple\n\nKeep this background.\n`;
  fs.writeFileSync(oldFile, oldContent);
  const currentEvidence = { direction: 'support', background: 'current human support', source_id: source.relative, origin: 'user', input_digest: source.sourceDigest, counted: true };
  const nextMeta = { ...oldMeta, type: 'principle', updated: '2026-11-03', support_streak: 5, evidence: [...evidence, currentEvidence], history: [{ from: 'idea', to: 'principle', at: '2026-11-03', reason: 'five consecutive human supports' }] };
  const content = `---\n${YAML.stringify(nextMeta)}---\n# Keep recurring jobs simple\n\nKeep this background.\n`;
  const indexScript = path.join(root, 'app', 'viewer', 'scripts', 'generate-index.ts');
  fs.mkdirSync(path.dirname(indexScript), { recursive: true }); fs.writeFileSync(indexScript, 'process.exit(2);');
  const plan = makePlan(source, newPath);
  plan.writes = [{ path: newPath, content, expected_digest: sha('') }];
  plan.moves = [{ from_path: oldPath, to_path: newPath, id: 'k-1', expected_digest: sha(oldContent) }];
  const planPath = path.join(root, 'plan.json'); fs.writeFileSync(planPath, JSON.stringify(plan));
  const destinationFailure = invoke(root, 'apply', { BRAIN_FAIL_AFTER_WRITE: '1' }, [planPath]);
  assert.equal(destinationFailure.status, 1);
  assert.equal(fs.existsSync(oldFile), true);
  assert.equal(fs.existsSync(path.join(root, newPath)), true);
  const indexFailure = invoke(root, 'apply', {}, [planPath]);
  assert.equal(indexFailure.status, 1);
  assert.match(indexFailure.stderr, /index generation failed/);
  assert.equal(fs.existsSync(oldFile), false);
  assert.match(fs.readFileSync(source.file, 'utf8'), /status: new/);
  fs.writeFileSync(indexScript, 'process.exit(0);');
  const result = invoke(root, 'apply', {}, [planPath]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(fs.readFileSync(source.file, 'utf8'), /status: processed/);
});
test('five opposing inputs demote both the principle and its counter-idea, preserving links and evidence', (t) => {
  const root = fixture(t), source = dailyFile(root);
  const principlePath = 'knowledge/principles/workflow/p-1.md', ideaPath = 'knowledge/ideas/workflow/i-1.md';
  const principleAbs = path.join(root, principlePath), ideaAbs = path.join(root, ideaPath);
  fs.mkdirSync(path.dirname(principleAbs), { recursive: true }); fs.mkdirSync(path.dirname(ideaAbs), { recursive: true });
  const oldSources = [];
  for (let i = 0; i < 4; i++) {
    const rel = `daily/2026/prior-${i}.md`; fs.writeFileSync(path.join(root, rel), `prior ${i}`); oldSources.push(rel);
  }
  const history = [];
  const makeEntries = (direction) => oldSources.map((sourceId, i) => ({ direction, background: `prior ${direction} ${i}`, source_id: sourceId, origin: 'user', input_digest: String(i + 1).repeat(64), counted: true }));
  const pEvidence = makeEntries('oppose'), iEvidence = makeEntries('support');
  const pMeta = { id: 'p-1', title: 'Current principle', type: 'principle', topic: 'workflow', topic_label: 'Workflow', tags: [], updated: '2026-01-01', support_streak: 0, opposition_streak: 4, related: [], opposes: ['i-1'], evidence: pEvidence, history, sources: [] };
  const iMeta = { ...pMeta, id: 'i-1', title: 'Counter idea', type: 'idea', support_streak: 4, opposition_streak: 0, related: [], opposes: ['p-1'], evidence: iEvidence };
  const oldP = `---\n${YAML.stringify(pMeta)}---\n# Current principle\n\nSee [counter](../../ideas/workflow/i-1.md).\n`;
  const oldI = `---\n${YAML.stringify(iMeta)}---\n# Counter idea\n\nSee [principle](../../principles/workflow/p-1.md).\n`;
  fs.writeFileSync(principleAbs, oldP); fs.writeFileSync(ideaAbs, oldI);
  const currentP = { direction: 'oppose', background: 'current disagreement', source_id: source.relative, origin: 'user', input_digest: source.sourceDigest, counted: true };
  const currentI = { direction: 'support', background: 'current counter-support', source_id: source.relative, origin: 'user', input_digest: source.sourceDigest, counted: true };
  const nextP = { ...pMeta, type: 'idea', updated: '2026-11-03', opposition_streak: 5, evidence: [...pEvidence, currentP], history: [{ from: 'principle', to: 'idea', at: '2026-11-03', reason: 'five consecutive opposing inputs' }] };
  const nextI = { ...iMeta, updated: '2026-11-03', support_streak: 5, evidence: [...iEvidence, currentI] };
  const newPPath = 'knowledge/ideas/workflow/p-1.md';
  const newP = `---\n${YAML.stringify(nextP)}---\n# Current principle\n\nSee [counter](i-1.md).\n`;
  const newI = `---\n${YAML.stringify(nextI)}---\n# Counter idea\n\nSee [principle](p-1.md).\n`;
  const indexScript = path.join(root, 'app', 'viewer', 'scripts', 'generate-index.ts'); fs.mkdirSync(path.dirname(indexScript), { recursive: true }); fs.writeFileSync(indexScript, 'process.exit(0);');
  const plan = makePlan(source, newPPath);
  plan.writes = [
    { path: newPPath, content: newP, expected_digest: sha('') },
    { path: ideaPath, content: newI, expected_digest: sha(oldI) }
  ];
  plan.moves = [{ from_path: principlePath, to_path: newPPath, id: 'p-1', expected_digest: sha(oldP) }];
  const planPath = path.join(root, 'plan.json'); fs.writeFileSync(planPath, JSON.stringify(plan));
  const result = invoke(root, 'apply', {}, [planPath]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.existsSync(principleAbs), false);
  assert.equal(YAML.parse(fs.readFileSync(path.join(root, newPPath), 'utf8').split('---')[1]).type, 'idea');
  assert.equal(YAML.parse(fs.readFileSync(ideaAbs, 'utf8').split('---')[1]).type, 'idea');
  assert.match(fs.readFileSync(ideaAbs, 'utf8'), /\]\(p-1\.md\)/);
});
test('review checkpoint is quiet on self status/result updates and wakes on human report request edits', (t) => {
  const root = fixture(t);
  const reportPath = path.join(root, 'report', 'ai-note.md');
  const report = { id: 'ai-note', fingerprint: 'stable-fingerprint', origin: 'ai', kind: 'knowledge', status: 'pending', request: 'AI suggestion', result: '', created: '2026-01-01', updated: '2026-01-01' };
  report.status = 'completed';
  fs.writeFileSync(reportPath, `---\n${YAML.stringify(report)}---\n`);
  const first = JSON.parse(invoke(root, 'review-state').stdout);
  assert.equal(first.changed, true);
  assert.match(invoke(root, 'review-complete', {}, [first.fingerprint]).stdout, /checkpointed/);
  const stable = JSON.parse(invoke(root, 'review-state').stdout);
  assert.equal(stable.changed, false);
  report.status = 'completed'; report.result = 'Done'; report.updated = '2026-11-03';
  fs.writeFileSync(reportPath, `---\n${YAML.stringify(report)}---\n`);
  assert.equal(JSON.parse(invoke(root, 'review-state').stdout).changed, false);
  report.request = 'Human amended the requested change';
  fs.writeFileSync(reportPath, `---\n${YAML.stringify(report)}---\n`);
  assert.equal(JSON.parse(invoke(root, 'review-state').stdout).changed, true);
});
test('a changed closed user report reopens as the priority target and is acknowledged after response', (t) => {
  const root = fixture(t), reportPath = path.join(root, 'report', 'user-request.md');
  const report = { id: 'user-request', fingerprint: 'user-request-fp', origin: 'user', kind: 'knowledge', status: 'deferred', request: 'first request', result: 'waiting', created: '2026-01-01', updated: '2026-01-01' };
  const writeReport = () => fs.writeFileSync(reportPath, `---\n${YAML.stringify(report)}---\nHuman context.\n`);
  writeReport();
  const initial = JSON.parse(invoke(root, 'review-state').stdout);
  assert.match(invoke(root, 'review-complete', {}, [initial.fingerprint]).stdout, /checkpointed/);
  report.request = 'Updated human request'; writeReport();
  const next = JSON.parse(invoke(root, 'next').stdout);
  assert.equal(next.kind, 'report'); assert.equal(next.reopened, true);
  const sourceBody = 'Human context.\n';
  const sourceDigest = sha(JSON.stringify({ request: report.request, body: sourceBody }));
  const oldContent = fs.readFileSync(reportPath, 'utf8');
  report.status = 'completed'; report.result = 'handled'; report.updated = '2026-11-03';
  const content = `---\n${YAML.stringify(report)}---\n${sourceBody}`;
  const plan = { version: 1, kind: 'report', source_id: 'report/user-request.md', source_digest: sourceDigest, writes: [{ path: 'report/user-request.md', content, expected_digest: sha(oldContent) }], daily_status_path: null };
  const planPath = path.join(root, 'plan.json'); fs.writeFileSync(planPath, JSON.stringify(plan));
  const interrupted = invoke(root, 'apply', { BRAIN_FAIL_AFTER_REPORT_ACK: '1' }, [planPath]);
  assert.equal(interrupted.status, 1);
  assert.equal(fs.existsSync(path.join(root, 'state', 'journal.json')), true);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'state', 'journal.json'), 'utf8')).kind, 'report');
  fs.unlinkSync(planPath);
  assert.equal(JSON.parse(invoke(root, 'next').stdout).kind, 'resume');
  const applied = invoke(root, 'resume');
  assert.equal(applied.status, 0, applied.stderr);
  assert.equal(JSON.parse(invoke(root, 'next').stdout).kind, 'review');
  const stranded = { ...report, id: 'stranded', fingerprint: 'stranded-fp', status: 'in_progress', request: 'continue after interruption' };
  fs.writeFileSync(path.join(root, 'report', 'stranded.md'), `---\n${YAML.stringify(stranded)}---\n`);
  const resumed = JSON.parse(invoke(root, 'next').stdout);
  assert.equal(resumed.kind, 'report'); assert.equal(resumed.path, 'report/stranded.md');
});
test('AI report cannot promote an unsupported or duplicated idea under a new stable ID', (t) => {
  const root = fixture(t);
  const ideaPath = 'knowledge/ideas/workflow/existing-idea.md';
  const ideaFile = path.join(root, ideaPath); fs.mkdirSync(path.dirname(ideaFile), { recursive: true });
  const metadata = { id: 'existing-idea', title: 'Only independent procedures should be Skills', type: 'idea', topic: 'workflow', topic_label: 'Workflow', tags: [], updated: '2026-01-01', support_streak: 0, opposition_streak: 0, related: [], opposes: [], evidence: [], history: [], sources: [] };
  const body = '# Only independent procedures should be Skills\n\nUse this existing idea.\n';
  const existingContent = `---\n${YAML.stringify(metadata)}---\n${body}`; fs.writeFileSync(ideaFile, existingContent);
  const report = { id: 'ai-idea-report', fingerprint: 'ai-idea-fp', origin: 'ai', kind: 'knowledge', status: 'pending', request: 'Promote the Skill idea', result: '', created: '2026-01-01', updated: '2026-01-01' };
  const sourceContent = `---\n${YAML.stringify(report)}---\n`;
  const reportPath = path.join(root, 'report', 'ai-idea-report.md'); fs.writeFileSync(reportPath, sourceContent);
  report.status = 'completed'; report.result = 'done'; report.updated = '2026-11-03';
  const outputReport = `---\n${YAML.stringify(report)}---\n`;
  const principleMeta = { ...metadata, id: 'new-principle-id', type: 'principle' };
  const principleContent = `---\n${YAML.stringify(principleMeta)}---\n${body}`;
  const plan = { version: 1, kind: 'report', source_id: 'report/ai-idea-report.md', source_digest: sha(JSON.stringify({ request: 'Promote the Skill idea', body: '' })), writes: [
    { path: 'knowledge/principles/workflow/new-principle-id.md', content: principleContent, expected_digest: sha('') },
    { path: 'report/ai-idea-report.md', content: outputReport, expected_digest: sha(sourceContent) }
  ], daily_status_path: null };
  const planPath = path.join(root, 'plan.json'); fs.writeFileSync(planPath, JSON.stringify(plan));
  const result = invoke(root, 'apply', {}, [planPath]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /without five human supports/);
  assert.match(result.stderr, /duplicates existing idea/);
  assert.equal(fs.existsSync(path.join(root, 'knowledge/principles/workflow/new-principle-id.md')), false);
  assert.match(fs.readFileSync(reportPath, 'utf8'), /status: pending/);
});
