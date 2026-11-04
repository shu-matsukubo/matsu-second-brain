#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';
import { inputStore, validateInputBody, parseInputRecord } from './lib/notion-input.mjs';
import { validateKnowledge, validateReport, validateWorkflowState, validateOperationPlan } from './lib/schema.mjs';

const rootFlag = process.argv.indexOf('--root');
const root = path.resolve(rootFlag >= 0 ? process.argv[rootFlag + 1] : process.cwd());
const args = process.argv.slice(2).filter((_, i, a) => a[i - 1] !== '--root' && a[i] !== '--root');
const cmd = args[0] ?? 'help';
const inputs = inputStore(root);
const notionMode = fs.existsSync(path.join(root, 'config', 'notion-input.json'));
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const statePath = path.join(root, 'state', 'workflow.json');
const journalPath = path.join(root, 'state', 'journal.json');
const appliedDailyPath = path.join(root, 'state', 'applied-daily.json');
const read = (p) => fs.readFileSync(p, 'utf8');
const readJsonArgument = (p) => JSON.parse(p === '-' ? fs.readFileSync(0, 'utf8') : read(path.resolve(p)));
const walk = (dir, accept = () => true) => {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p, accept) : accept(p) ? [p] : [];
  }).sort();
};
const digest = (s) => sha(s);
const canonical = (value) => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b))) : item);
const normalizedPlan = (plan) => ({ ...plan, moves: plan.moves ?? [] });
const normalizedPlanDigest = (plan) => digest(canonical(normalizedPlan(plan)));
const yamlFromMarkdown = (text) => {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!m) return { meta: null, body: text, front: null };
  return { meta: YAML.parse(m[1]) ?? {}, body: text.slice(m[0].length), front: m[0] };
};
const reportRequestDigest = (meta, body = '') => digest(JSON.stringify({ request: meta?.request ?? '', body }));
const yamlToMarkdown = (meta, body, eol = '\n') => `---${eol}${YAML.stringify(meta).replace(/\n/g, eol).trimEnd()}${eol}---${eol}${body}`;
function isSafeRelative(relative) {
  return typeof relative === 'string' && !path.isAbsolute(relative) && !relative.includes('\\') && path.posix.normalize(relative) === relative && !relative.split('/').includes('..') && !relative.startsWith('./');
}
function hasSymlinkComponent(relative) {
  let current = root;
  for (const segment of relative.split('/')) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) return false;
    if (fs.lstatSync(current).isSymbolicLink()) return true;
  }
  return false;
}
function reportFiles() {
  return walk(path.join(root, 'report'), (p) => p.endsWith('.md') && !p.split(path.sep).includes('archive'));
}
function allReportFiles() { return walk(path.join(root, 'report'), (p) => p.endsWith('.md')); }
function knowledgePathFor(meta) {
  const folder = meta.type === 'fact' ? 'facts' : meta.type === 'principle' ? 'principles' : 'ideas';
  return `knowledge/${folder}/${meta.topic}/${meta.id}.md`;
}
function relativeMarkdownTargets(filePath, content) {
  const targets = [];
  for (const match of content.matchAll(/\]\(<?([^)>]+)>?\)/g)) {
    let target = match[1].trim();
    if (!target || /^(?:[a-z]+:|\/\/|#)/i.test(target)) continue;
    target = decodeURIComponent(target.split(/[?#]/, 1)[0]);
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(filePath), target));
    targets.push(resolved);
  }
  return targets;
}
function normalizeLinkTargets(content) { return content.replace(/\]\(<?[^)>]+>?\)/g, '](LINK)'); }
function bodySnapshotRecorded(meta, previousBody, previousPath) {
  return meta.history.some((entry) => entry?.previous_body === previousBody && entry?.previous_path === previousPath);
}
function knowledgeById() {
  const found = new Map();
  for (const file of walk(path.join(root, 'knowledge'), (p) => p.endsWith('.md'))) {
    const meta = yamlFromMarkdown(read(file)).meta;
    if (meta?.id) found.set(meta.id, { path: path.relative(root, file).replaceAll('\\', '/'), meta, body: yamlFromMarkdown(read(file)).body });
  }
  return found;
}
function validateMoves(plan, recovering = false) {
  const errors = [];
  const writeMap = new Map(plan.writes.map((w) => [w.path, w.content]));
  const moves = plan.moves ?? [];
  const movedFrom = new Set(moves.map((m) => m.from_path));
  const movedTo = new Set();
  for (const move of moves) {
    if (!isSafeRelative(move.from_path) || !isSafeRelative(move.to_path) || !move.from_path.startsWith('knowledge/') || !move.to_path.startsWith('knowledge/')) { errors.push(`move paths must be safe knowledge paths: ${move.from_path}`); continue; }
    if (movedFrom.size !== moves.length) errors.push(`move source paths must be unique`);
    if (move.from_path === move.to_path) errors.push(`move source and destination must differ: ${move.from_path}`);
    if (movedTo.has(move.to_path)) errors.push(`move destination paths must be unique: ${move.to_path}`);
    movedTo.add(move.to_path);
    if (!writeMap.has(move.to_path)) { errors.push(`move destination must have a planned write: ${move.to_path}`); continue; }
    const source = path.resolve(root, move.from_path), destination = path.resolve(root, move.to_path);
    const sourceExists = fs.existsSync(source), destinationExists = fs.existsSync(destination);
    if (hasSymlinkComponent(move.from_path) || hasSymlinkComponent(move.to_path)) { errors.push(`move path contains a symlink: ${move.from_path}`); continue; }
    if (!sourceExists && !(recovering && destinationExists)) { errors.push(`move source does not exist as a regular workspace file: ${move.from_path}`); continue; }
    if (destinationExists && !recovering) { errors.push(`move destination already exists: ${move.to_path}`); continue; }
    if (sourceExists && digest(read(source)) !== move.expected_digest) { errors.push(`move source digest precondition failed: ${move.from_path}`); continue; }
    if (!destinationExists && !sourceExists) { errors.push(`move has neither a source nor a destination after-image: ${move.id}`); continue; }
    if (destinationExists && digest(read(destination)) !== digest(writeMap.get(move.to_path))) { errors.push(`pending move destination does not match its journal after-image: ${move.to_path}`); continue; }
    const before = sourceExists ? yamlFromMarkdown(read(source)).meta : null;
    const after = yamlFromMarkdown(writeMap.get(move.to_path)).meta;
    const destinationMeta = destinationExists ? yamlFromMarkdown(read(destination)).meta : after;
    if ((before && before.id !== move.id) || after?.id !== move.id || destinationMeta?.id !== move.id) errors.push(`move must preserve the stable ID: ${move.from_path}`);
    if (knowledgePathFor(after ?? {}) !== move.to_path || (destinationMeta && knowledgePathFor(destinationMeta) !== move.to_path)) errors.push(`move destination must match new metadata type/topic/id: ${move.to_path}`);
    if (before && after) {
      for (const field of ['evidence', 'history', 'sources']) {
        const prior = before[field] ?? [], next = after[field] ?? [];
        if (next.length < prior.length || JSON.stringify(next.slice(0, prior.length)) !== JSON.stringify(prior)) errors.push(`moved knowledge ${field} must be append-only: ${move.id}`);
      }
      const priorBodyRaw = yamlFromMarkdown(read(source)).body;
      const priorBody = normalizeLinkTargets(priorBodyRaw.trim());
      const next = yamlFromMarkdown(writeMap.get(move.to_path));
      const nextBody = normalizeLinkTargets(next.body);
      if (priorBody && !nextBody.includes(priorBody) && !bodySnapshotRecorded(next.meta, priorBodyRaw, move.from_path)) errors.push(`moved knowledge body replacement requires previous_body/previous_path history: ${move.id}`);
    }
  }
  if (errors.length) return errors;
  for (const move of moves) {
    for (const file of walk(path.join(root, 'knowledge'), (p) => p.endsWith('.md'))) {
      const oldPath = path.relative(root, file).replaceAll('\\', '/');
      const plannedPath = moves.find((m) => m.from_path === oldPath)?.to_path ?? oldPath;
      const content = writeMap.get(plannedPath) ?? (movedFrom.has(oldPath) ? null : read(file));
      if (content === null) continue;
      const linksToOld = relativeMarkdownTargets(plannedPath, content).includes(move.from_path);
      if (!linksToOld) continue;
      if (!writeMap.has(plannedPath)) errors.push(`backlink to moved path requires a planned link update: ${plannedPath} -> ${move.from_path}`);
      else errors.push(`planned content still links to moved path: ${plannedPath} -> ${move.from_path}`);
    }
  }
  return errors;
}
function validateTransitions(plan) {
  const existing = knowledgeById();
  const planned = new Map();
  const plannedBodies = new Map();
  for (const w of plan.writes.filter((w) => w.path.startsWith('knowledge/'))) {
    const parsed = yamlFromMarkdown(w.content);
    const meta = parsed.meta;
    if (meta?.id) { planned.set(meta.id, meta); plannedBodies.set(meta.id, normalizeLinkTargets(parsed.body.trim())); }
  }
  const errors = [];
  for (const [id, meta] of planned) {
    const old = existing.get(id)?.meta;
    if (!old) {
      if (meta.type === 'principle' && !sourceHuman(plan.source_id) && meta.support_streak < 5) errors.push(`AI-origin knowledge cannot create principle ${id} without five human supports`);
      if (meta.type === 'principle') for (const [existingId, current] of existing) {
        if (current.meta.type === 'idea' && current.meta.topic === meta.topic && (current.meta.title === meta.title || normalizeLinkTargets(current.body.trim()) === plannedBodies.get(id))) errors.push(`new principle ${id} duplicates existing idea ${existingId}; preserve its stable ID and history`);
      }
      continue;
    }
    if (meta.type !== old.type) {
      const transition = meta.history.slice((old.history ?? []).length).find((entry) => entry.from === old.type && entry.to === meta.type);
      if (!transition) errors.push(`classification change for ${id} requires an appended ${old.type}-to-${meta.type} history entry`);
      if (old.type === 'idea' && meta.type === 'principle' && meta.support_streak < 5) errors.push(`promotion of ${id} requires five consecutive human supports`);
      else if (old.type === 'principle' && meta.type === 'idea' && meta.opposition_streak < 5) errors.push(`demotion of ${id} requires five consecutive human oppositions`);
      else if (!((old.type === 'idea' && meta.type === 'principle') || (old.type === 'principle' && meta.type === 'idea'))) errors.push(`unsupported classification change for ${id}: ${old.type} -> ${meta.type}`);
    }
    if (old.type === 'principle' && meta.opposition_streak >= 5 && meta.type !== 'idea') errors.push(`principle ${id} with five opposing inputs must be demoted`);
    if (old.type === 'principle' && meta.type === 'idea') {
      if (meta.opposition_streak < 5 || !meta.history.slice((old.history ?? []).length).some((entry) => entry.from === 'principle' && entry.to === 'idea')) errors.push(`demotion of ${id} requires five opposing inputs and a history entry`);
      for (const oppositeId of old.opposes ?? []) {
        const opposite = planned.get(oppositeId);
        if (!opposite || opposite.type !== 'idea') errors.push(`demoting ${id} requires its opposing idea ${oppositeId} to remain/become idea in the same plan`);
      }
    }
  }
  return errors;
}
function sourceDigestFor(file, kind) {
  if (kind === 'input') return inputs.next()?.digest;
  const raw = read(file);
  if (kind === 'report') {
    const { meta, body } = yamlFromMarkdown(raw);
    if (meta && typeof meta.request === 'string') return reportRequestDigest(meta, body);
    return digest(raw);
  }
  if (kind !== 'daily') return digest(raw);
  const { meta, body } = yamlFromMarkdown(raw);
  if (!meta || typeof meta.status !== 'string') return digest(raw);
  delete meta.status;
  return digest(`${YAML.stringify(meta)}\n${body}`);
}
function atomicWrite(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, content, 'utf8');
  fs.renameSync(temp, file);
}
function loadState() {
  if (!fs.existsSync(statePath)) return { version: 1, pending: null, idleFingerprint: null, acknowledgedInputs: {} };
  const value = JSON.parse(read(statePath));
  const v = validateWorkflowState(value);
  if (!v.valid) throw new Error(`invalid workflow state: ${v.errors.join('; ')}`);
  return value;
}
function inputFingerprint() {
  const inputs = {};
  const agentsFile = path.join(root, 'AGENTS.md');
  if (fs.existsSync(agentsFile)) inputs['AGENTS.md'] = digest(read(agentsFile));
  for (const p of walk(path.join(root, 'daily'), (x) => x.endsWith('.md'))) {
    const raw = read(p), parsed = yamlFromMarkdown(raw);
    if (!parsed.meta) { inputs[path.relative(root, p)] = digest(raw); continue; }
    const meta = { ...parsed.meta }; delete meta.status;
    inputs[path.relative(root, p)] = digest(`${YAML.stringify(meta)}\n${parsed.body}`);
  }
  for (const dir of ['knowledge-policy', '.agents/skills']) for (const p of walk(path.join(root, dir))) inputs[path.relative(root, p)] = digest(read(p));
  for (const p of walk(path.join(root, 'knowledge'), (x) => x.endsWith('.md'))) inputs[path.relative(root, p)] = digest(read(p));
  for (const p of reportFiles()) {
    const { meta, body } = yamlFromMarkdown(read(p));
    const relative = path.relative(root, p).replaceAll('\\', '/');
    if (meta && typeof meta.request === 'string') inputs[relative] = reportRequestDigest(meta, body);
    else inputs[relative] = digest(read(p));
  }
  return { inputs, fingerprint: digest(JSON.stringify(inputs)) };
}
function dailyItems() {
  return walk(path.join(root, 'daily'), (p) => p.endsWith('.md')).filter((p) => {
    const { meta } = yamlFromMarkdown(read(p)); return meta?.status === 'new';
  }).map((p) => {
    const { meta } = yamlFromMarkdown(read(p));
    const relative = path.relative(root, p).replaceAll('\\', '/');
    const metadataDate = meta?.created ?? meta?.created_at ?? meta?.timestamp ?? meta?.['登録日時'];
    let timestamp = typeof metadataDate === 'string' ? Date.parse(metadataDate.replace(' ', 'T')) : Number.NaN;
    let date = metadataDate;
    if (Number.isNaN(timestamp)) {
      const directoryDate = relative.match(/(?:^|\/)(\d{4})\/(\d{2})\/(\d{2})(?:[-/]|$)/);
      const time = path.posix.basename(relative).match(/^\d{2}[-_](\d{2})(\d{2})(\d{2})/)?.slice(1).join(':') ?? '00:00:00';
      if (directoryDate) {
        date = `${directoryDate[1]}-${directoryDate[2]}-${directoryDate[3]} ${time}`;
        timestamp = Date.parse(date.replace(' ', 'T'));
      }
    }
    return { path: relative, digest: sourceDigestFor(p, 'daily'), date: date ?? relative, timestamp, sortPath: relative };
  }).sort((a, b) => {
    const aHasDate = Number.isFinite(a.timestamp), bHasDate = Number.isFinite(b.timestamp);
    if (aHasDate && bHasDate && a.timestamp !== b.timestamp) return a.timestamp - b.timestamp;
    if (aHasDate !== bHasDate) return aHasDate ? -1 : 1;
    return a.sortPath.localeCompare(b.sortPath, 'en');
  }).map(({ sortPath: _sortPath, timestamp: _timestamp, ...item }) => item);
}
function reportItems() {
  const state = loadState();
  return reportFiles().filter((p) => {
    const { meta, body } = yamlFromMarkdown(read(p));
    const relative = path.relative(root, p).replaceAll('\\', '/');
    const currentDigest = reportRequestDigest(meta, body);
    const changedClosedRequest = ['completed', 'deferred', 'blocked'].includes(meta?.status) && state.acknowledgedInputs[relative] !== undefined && state.acknowledgedInputs[relative] !== currentDigest;
    return ['pending', 'in_progress'].includes(meta?.status) || changedClosedRequest;
  }).map((p) => {
    const { meta, body } = yamlFromMarkdown(read(p));
    const relative = path.relative(root, p).replaceAll('\\', '/');
    const currentDigest = reportRequestDigest(meta, body);
    const reopened = ['completed', 'deferred', 'blocked'].includes(meta.status) && state.acknowledgedInputs[relative] !== undefined && state.acknowledgedInputs[relative] !== currentDigest;
    return { path: relative, digest: sourceDigestFor(p, 'report'), date: meta.created ?? path.basename(p), status: meta.status, reopened };
  })
    .sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.path.localeCompare(b.path));
}
function sourceHuman(pathname) {
  if (pathname.startsWith('notion:')) return Boolean(inputs.source(pathname));
  const abs = path.resolve(root, pathname);
  if (!abs.startsWith(root + path.sep) || !fs.existsSync(abs) || hasSymlinkComponent(path.relative(root, abs).replaceAll('\\', '/'))) return false;
  const rel = path.relative(root, abs).replaceAll('\\', '/');
  if (/^daily\/[A-Za-z0-9._/-]+\.md$/.test(rel) && !rel.split('/').includes('..')) return true;
  if (/^report\/[A-Za-z0-9._/-]+\.md$/.test(rel) && !rel.split('/').includes('..')) return yamlFromMarkdown(read(abs)).meta?.origin === 'user';
  return false;
}
function validateKnowledgeSemantics(meta, filePath) {
  const result = validateKnowledge(meta);
  if (!result.valid) return result.errors;
  const seen = new Set(); let support = 0, oppose = 0;
  for (const e of meta.evidence) {
    if (seen.has(e.input_digest)) return [`duplicate evidence digest ${e.input_digest}`];
    seen.add(e.input_digest);
    if (e.counted) {
      if (!sourceHuman(e.source_id)) return [`counted evidence source is not a human input: ${e.source_id}`];
      if (e.source_id.startsWith('notion:')) {
        const receipt = inputs.source(e.source_id);
        if (receipt?.source_digest !== e.input_digest || receipt.input_key !== e.input_key) return [`counted Notion evidence does not match its receipt: ${e.source_id}`];
      } else if (!isSafeRelative(e.source_id) || !e.source_id.startsWith('daily/') && !e.source_id.startsWith('report/')) return [`counted evidence has an invalid source path: ${e.source_id}`];
      if (e.direction === 'support') { support++; oppose = 0; }
      if (e.direction === 'oppose') { oppose++; support = 0; }
    }
  }
  if (meta.support_streak !== support || meta.opposition_streak !== oppose) return [`streak counters do not match counted evidence (expected support=${support}, opposition=${oppose})`];
  if (meta.support_streak && meta.opposition_streak) return ['support and opposition streaks cannot both be non-zero'];
  return [];
}
function validateAll() {
  const failures = [];
  for (const p of walk(path.join(root, 'knowledge'), (x) => x.endsWith('.md'))) {
    const { meta } = yamlFromMarkdown(read(p));
    const errors = meta ? validateKnowledgeSemantics(meta, p) : ['missing YAML frontmatter'];
    if (meta && knowledgePathFor(meta) !== path.relative(root, p).replaceAll('\\', '/')) errors.push('file path must match type/topic/stable ID');
    if (errors.length) failures.push(`${path.relative(root, p)}: ${errors.join('; ')}`);
  }
  for (const p of reportFiles()) {
    const { meta } = yamlFromMarkdown(read(p));
    if (!meta) failures.push(`${path.relative(root, p)}: missing YAML frontmatter`);
    else { const r = validateReport(meta); if (!r.valid) failures.push(`${path.relative(root, p)}: ${r.errors.join('; ')}`); }
  }
  try { const s = loadState(); const v = validateWorkflowState(s); if (!v.valid) failures.push(`state: ${v.errors.join('; ')}`); } catch (e) { failures.push(e.message); }
  try { inputs.next(); inputs.ledger(); } catch (e) { failures.push(`input: ${e.message}`); }
  return failures;
}
function planFromJournal(journal) {
  const allowedKeys = new Set(['version', 'kind', 'source_id', 'source_digest', 'writes', 'moves', 'daily_status_path', 'plan_digest', 'operation_digest', 'nextWrite', 'nextMove', 'phase']);
  if (!journal || typeof journal !== 'object' || Array.isArray(journal)) throw new Error('invalid pending journal: must be an object');
  if (Object.keys(journal).some((key) => !allowedKeys.has(key))) throw new Error('invalid pending journal: unexpected field');
  if (!['input', 'daily', 'report', 'review'].includes(journal.kind)) throw new Error('invalid pending journal: missing or invalid kind');
  if (!Number.isInteger(journal.nextWrite) || !Number.isInteger(journal.nextMove)) throw new Error('invalid pending journal: invalid progress cursor');
  if (journal.phase !== undefined && journal.phase !== 'index-complete') throw new Error('invalid pending journal: invalid phase');
  const plan = {
    version: journal.version,
    kind: journal.kind,
    source_id: journal.source_id,
    source_digest: journal.source_digest,
    writes: journal.writes,
    daily_status_path: journal.daily_status_path
  };
  if (Object.hasOwn(journal, 'moves')) plan.moves = journal.moves;
  const validation = validateOperationPlan(plan);
  if (!validation.valid) throw new Error(`invalid pending journal plan: ${validation.errors.join('; ')}`);
  const normalized = normalizedPlan(plan);
  const normalizedValidation = validateOperationPlan(normalized);
  if (!normalizedValidation.valid) throw new Error(`invalid pending journal plan: ${normalizedValidation.errors.join('; ')}`);
  if (journal.nextWrite < 0 || journal.nextWrite > plan.writes.length || journal.nextMove < 0 || journal.nextMove > (plan.moves ?? []).length)
    throw new Error('invalid pending journal: progress cursor is out of range');
  if (typeof journal.operation_digest !== 'string' || !/^[a-f0-9]{64}$/.test(journal.operation_digest) || journal.operation_digest !== digest(canonical(plan)))
    throw new Error('invalid pending journal: original operation digest mismatch');
  if (journal.plan_digest !== normalizedPlanDigest(plan)) throw new Error('invalid pending journal: plan digest mismatch');
  return normalized;
}
function selectNext() {
  if (fs.existsSync(journalPath)) return { kind: 'resume', journal: path.relative(root, journalPath).replaceAll('\\', '/') };
  const input = inputs.next(); if (input) return input;
  if (notionMode && !args.includes('--input-empty')) return { kind: 'input_fetch', config: 'config/notion-input.json' };
  const daily = !notionMode && dailyItems()[0]; if (daily) return { kind: 'daily', ...daily };
  const reports = reportItems();
  const selected = reports.find((r) => r.reopened || !['deferred', 'blocked', 'completed'].includes(r.status));
  if (selected) return { kind: 'report', ...selected };
  const state = loadState(), current = inputFingerprint();
  if (state.idleFingerprint === current.fingerprint) return null;
  return { kind: 'review', fingerprint: current.fingerprint };
}
function fail(message) { console.error(message); process.exitCode = 1; }
function help() {
  console.log('Second Brain workflow CLI\n\nUsage: node scripts/brain.mjs <command> [JSON-file|-] [--root DIR]\n\nCommands:\n  next [--input-empty]           Resume input, request a Notion fetch, or select report/review\n  input-record FILE|-           Parse page_id/markdown into a canonical snapshot\n  input-stage FILE|-            Stage one verified Notion input\n  input-verify FILE|-           Compare the fetched input with the staged snapshot\n  apply FILE|-                  Apply a validated knowledge/report plan\n  resume                        Recover the exact saved journal\n  input-ack FILE|-              Clear the snapshot after verified Notion completion\n  validate                      Validate knowledge/report/state\n  report-add FILE               Add a report once by fingerprint\n  review-state [--input-empty]   Inspect review inputs\n  review-complete FINGERPRINT --input-empty\n                                Checkpoint after a successful empty Notion query');
}

// Serialize mutations across unattended runs; stale locks from dead processes are recoverable.
let mutationLock;
function acquireMutationLock() {
  if (!['apply', 'resume', 'input-stage', 'input-ack', 'report-add', 'review-complete'].includes(cmd)) return;
  const file = path.join(root, 'state', 'brain.lock');
  if (hasSymlinkComponent('state/brain.lock')) throw new Error('workflow lock path contains a symlink');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) {
    const owner = JSON.parse(read(file));
    if (!Number.isInteger(owner.pid) || owner.pid <= 0) throw new Error('invalid workflow lock');
    try { process.kill(owner.pid, 0); throw new Error('another workflow command is running'); }
    catch (error) { if (error.code !== 'ESRCH') throw error; }
    fs.unlinkSync(file);
  }
  const fd = fs.openSync(file, 'wx');
  try { fs.writeFileSync(fd, JSON.stringify({ pid: process.pid })); } finally { fs.closeSync(fd); }
  mutationLock = file;
}

try {
  acquireMutationLock();
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') help();
  else if (cmd === 'validate') {
    const failures = validateAll();
    if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; } else console.log('valid');
  } else if (cmd === 'input-record') {
    const value = readJsonArgument(args[1]);
    console.log(JSON.stringify(parseInputRecord(value.page_id, value.markdown)));
  } else if (cmd === 'input-stage' || cmd === 'input-verify' || cmd === 'input-ack') {
    if (!args[1]) throw new Error(`${cmd} requires a JSON file`);
    const value = readJsonArgument(args[1]);
    if (cmd !== 'input-verify' && fs.existsSync(journalPath)) throw new Error('resume the journal before staging or acknowledging an input');
    const method = cmd === 'input-stage' ? 'stage' : cmd === 'input-verify' ? 'verify' : 'ack';
    console.log(JSON.stringify(inputs[method](value)));
  } else if (cmd === 'next') console.log(JSON.stringify(selectNext()));
  else if (cmd === 'review-state') {
    const state = loadState(), cur = inputFingerprint();
    console.log(JSON.stringify({ changed: state.idleFingerprint !== cur.fingerprint, fingerprint: cur.fingerprint, next: selectNext() }, null, 2));
  } else if (cmd === 'review-complete') {
    const fingerprint = args[1];
    if (!fingerprint) throw new Error('review-complete requires the fingerprint returned by review-state');
    if (notionMode && !args.includes('--input-empty')) throw new Error('query the Notion pending view successfully before review-complete --input-empty');
    if (fs.existsSync(journalPath) || inputs.next() || (!notionMode && dailyItems().length) || reportItems().length) throw new Error('cannot checkpoint while journal, input, daily, or report work is pending');
    const current = inputFingerprint();
    if (fingerprint !== current.fingerprint) throw new Error('input fingerprint changed during review');
    const state = loadState();
    if (state.idleFingerprint === fingerprint) console.log('unchanged');
    else {
      state.idleFingerprint = fingerprint;
      state.acknowledgedInputs = current.inputs;
      atomicWrite(statePath, JSON.stringify(state, null, 2));
      console.log('checkpointed');
    }
  } else if (cmd === 'report-add') {
    const data = JSON.parse(read(path.resolve(args[1])));
    const checked = validateReport(data);
    if (!checked.valid) throw new Error(checked.errors.join('; '));
    const dir = path.join(root, 'report'); fs.mkdirSync(dir, { recursive: true });
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.id)) throw new Error('report ID must be a safe lowercase slug');
    const existing = allReportFiles().find((p) => yamlFromMarkdown(read(p)).meta?.fingerprint === data.fingerprint);
    if (existing) console.log(JSON.stringify({ added: false, path: path.relative(root, existing) }));
    else {
      const file = path.join(dir, `${data.id}.md`);
      if (fs.existsSync(file)) throw new Error(`report ID already exists: ${data.id}`);
      const meta = { ...data };
      const request = meta.request, outcome = meta.result;
      delete meta.request; delete meta.result;
      atomicWrite(file, yamlToMarkdown({ ...meta, request, result: outcome }, ''));
      console.log(JSON.stringify({ added: true, path: path.relative(root, file) }));
    }
  } else if (cmd === 'apply' || cmd === 'resume') {
    let plan, pendingJournal = null;
    if (cmd === 'resume') {
      if (args[1]) throw new Error('resume does not take a plan path; it reads state/journal.json');
      if (!fs.existsSync(journalPath)) throw new Error('no pending journal to resume');
      if (hasSymlinkComponent('state/journal.json')) throw new Error('pending journal path contains a symlink');
      pendingJournal = JSON.parse(read(journalPath));
      plan = planFromJournal(pendingJournal);
    } else {
      plan = readJsonArgument(args[1] ?? '');
      if (fs.existsSync(journalPath)) {
        if (hasSymlinkComponent('state/journal.json')) throw new Error('pending journal path contains a symlink');
        pendingJournal = JSON.parse(read(journalPath));
        const journalPlan = planFromJournal(pendingJournal);
        if (normalizedPlanDigest(journalPlan) !== normalizedPlanDigest(plan)) throw new Error('plan does not match the pending journal');
      }
    }
    const planValidation = validateOperationPlan(plan);
    if (!planValidation.valid) throw new Error(`invalid plan: ${planValidation.errors.join('; ')}`);
    const sourcePath = plan.kind === 'input' ? path.join(root, 'state', 'notion-input.json') : path.resolve(root, plan.source_id);
    if (plan.kind === 'input') {
      const current = inputs.next();
      if (!current || current.source_id !== plan.source_id || current.digest !== plan.source_digest) throw new Error('plan input must match the active Notion snapshot');
      if (current.kind === 'input_ack' && !pendingJournal) throw new Error('input already applied; only Notion completion is pending');
    } else if (!isSafeRelative(plan.source_id) || !sourcePath.startsWith(root + path.sep) || !fs.existsSync(sourcePath) || hasSymlinkComponent(plan.source_id)) throw new Error('plan source must be a safe existing in-root file');
    if (sourceDigestFor(sourcePath, plan.kind) !== plan.source_digest) throw new Error('source digest precondition failed');
    if (plan.kind === 'daily' && (!/^daily\/[A-Za-z0-9._/-]+\.md$/.test(plan.source_id) || !sourceHuman(plan.source_id))) throw new Error('daily source is not eligible');
    if (plan.kind === 'daily' && plan.daily_status_path !== plan.source_id) throw new Error('daily plans must update status on their source file');
    if (plan.kind === 'daily' && notionMode && !pendingJournal) throw new Error('daily is archived; use the Notion input queue');
    if (plan.kind !== 'daily' && plan.daily_status_path !== null) throw new Error('only daily plans may update daily status');
    const reportTargetOutput = plan.kind === 'report' ? plan.writes.find((w) => w.path === plan.source_id) : null;
    if (plan.kind === 'report') {
      const isResumingJournal = pendingJournal?.source_id === plan.source_id && pendingJournal?.source_digest === plan.source_digest;
      if (!plan.source_id.startsWith('report/') || plan.source_id.split('/').includes('archive') || (!reportItems().some((item) => item.path === plan.source_id) && !isResumingJournal)) throw new Error('report source is not an active or reopened request');
      if (!reportTargetOutput) throw new Error('report plans must update their source report status/result');
      const nextStatus = yamlFromMarkdown(reportTargetOutput.content).meta?.status;
      if (!['in_progress', 'completed', 'deferred', 'blocked'].includes(nextStatus)) throw new Error('report processing must record in_progress or a terminal status');
    }
    const operationDigest = pendingJournal?.operation_digest ?? digest(canonical(plan));
    if (plan.kind === 'daily' && !pendingJournal) {
      const dailyMeta = yamlFromMarkdown(read(sourcePath)).meta;
      if (dailyMeta?.status === 'processed') {
        const applied = fs.existsSync(appliedDailyPath) ? JSON.parse(read(appliedDailyPath)) : {};
        const entry = applied[plan.source_id];
        const afterImagesMatch = plan.writes.every((w) => fs.existsSync(path.resolve(root, w.path)) && digest(read(path.resolve(root, w.path))) === digest(w.content)) && (plan.moves ?? []).every((m) => !fs.existsSync(path.resolve(root, m.from_path)) && fs.existsSync(path.resolve(root, m.to_path))) && dailyMeta.status === 'processed';
        if (entry?.source_digest === plan.source_digest && entry.operation_digest === operationDigest && afterImagesMatch) { console.log('already applied'); process.exit(0); }
        throw new Error('daily source is already processed by another operation');
      }
      if (dailyMeta?.status !== 'new') throw new Error('daily source status must be new');
    }
    const plannedKnowledgeIds = new Set();
    const existingKnowledge = knowledgeById();
    for (const w of plan.writes) {
      if (!isSafeRelative(w.path) || !/^(knowledge|report)\/.+\.md$/.test(w.path) || w.path.split('/').includes('archive')) throw new Error(`write path is outside the knowledge/report operation scope: ${w.path}`);
      if (!w.path.startsWith('knowledge/') || !w.path.endsWith('.md')) continue;
      const parsed = yamlFromMarkdown(w.content);
      if (!parsed.meta) throw new Error(`planned knowledge write has no frontmatter: ${w.path}`);
      if (knowledgePathFor(parsed.meta) !== w.path) throw new Error(`knowledge path must match type/topic/stable ID: ${w.path}`);
      if (plannedKnowledgeIds.has(parsed.meta.id)) throw new Error(`knowledge ID appears more than once in plan: ${parsed.meta.id}`);
      plannedKnowledgeIds.add(parsed.meta.id);
      const oldKnowledge = existingKnowledge.get(parsed.meta.id);
      if (oldKnowledge && oldKnowledge.path !== w.path && !(plan.moves ?? []).some((move) => move.from_path === oldKnowledge.path && move.to_path === w.path && move.id === parsed.meta.id)) throw new Error(`knowledge path change requires a verified stable-ID move: ${parsed.meta.id}`);
      const errors = validateKnowledgeSemantics(parsed.meta, w.path);
      if (errors.length) throw new Error(`invalid planned knowledge ${w.path}: ${errors.join('; ')}`);
      const destination = path.resolve(root, w.path);
      const moveSource = (plan.moves ?? []).find((move) => move.to_path === w.path);
      const movedSource = moveSource ? path.resolve(root, moveSource.from_path) : null;
      const existingMeta = fs.existsSync(destination) ? yamlFromMarkdown(read(destination)).meta : movedSource && fs.existsSync(movedSource) ? yamlFromMarkdown(read(movedSource)).meta : null;
      const priorEvidence = existingMeta?.evidence ?? [];
      const additions = parsed.meta.evidence.slice(priorEvidence.length);
      if (plan.kind === 'input') {
        const snapshot = inputs.active();
        validateInputBody(parsed.body.replace(/\r\n/g, '\n').trimStart(), snapshot, w.path);
        for (const entry of additions) {
          if (entry.quote !== snapshot.quote || entry.occurred_at !== snapshot.occurred_at || entry.source_ref !== snapshot.source_ref || entry.input_key !== snapshot.input_key) throw new Error('input evidence must preserve quote, date, source reference and input key');
        }
        if (!existingMeta && additions.length === 0) throw new Error('new input knowledge requires source evidence');
      }
      for (const entry of additions) {
        const expectedOrigin = sourceHuman(plan.source_id) ? 'user' : 'ai';
        if (entry.source_id !== plan.source_id || entry.input_digest !== plan.source_digest || entry.origin !== expectedOrigin) throw new Error(`new evidence must reference this exact source and digest: ${w.path}`);
      }
    }
    for (const w of plan.writes.filter((item) => item.path.startsWith('report/'))) {
      const parsed = yamlFromMarkdown(w.content);
      if (!parsed.meta) throw new Error(`planned report write has no frontmatter: ${w.path}`);
      const checked = validateReport(parsed.meta);
      if (!checked.valid) throw new Error(`invalid planned report ${w.path}: ${checked.errors.join('; ')}`);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(parsed.meta.id) || w.path !== `report/${parsed.meta.id}.md`) throw new Error(`report path must match its safe stable ID: ${w.path}`);
      const target = path.resolve(root, w.path);
      const duplicate = allReportFiles().find((file) => file !== target && yamlFromMarkdown(read(file)).meta?.fingerprint === parsed.meta.fingerprint);
      if (duplicate) throw new Error(`report fingerprint already exists: ${parsed.meta.fingerprint}`);
      if (fs.existsSync(target)) {
        const before = yamlFromMarkdown(read(target));
        for (const key of ['id', 'fingerprint', 'origin', 'kind', 'request', 'created']) {
          if (parsed.meta[key] !== before.meta?.[key]) throw new Error(`report ${key} is immutable after creation: ${w.path}`);
        }
        if (parsed.body !== before.body) throw new Error(`report request/body is immutable after creation: ${w.path}`);
      }
    }
    if (plan.kind === 'report') {
      const sourceMeta = yamlFromMarkdown(read(sourcePath)).meta;
      if (sourceMeta?.origin === 'ai' && ['policy', 'skill'].includes(sourceMeta.kind)) {
        if (plan.writes.some((w) => w.path.startsWith('knowledge/')) || yamlFromMarkdown(reportTargetOutput.content).meta?.status !== 'deferred') throw new Error('AI-origin policy/skill reports can only be deferred; no policy or knowledge changes are authorized');
      }
    }
    const moveErrors = validateMoves(plan, Boolean(pendingJournal));
    if (moveErrors.length) throw new Error(moveErrors.join('; '));
    const transitionErrors = validateTransitions(plan);
    if (transitionErrors.length) throw new Error(transitionErrors.join('; '));
    const journal = pendingJournal ?? {
      version: plan.version,
      kind: plan.kind,
      source_id: plan.source_id,
      source_digest: plan.source_digest,
      writes: plan.writes,
      ...(Object.hasOwn(plan, 'moves') ? { moves: plan.moves } : {}),
      daily_status_path: plan.daily_status_path,
      plan_digest: normalizedPlanDigest(plan),
      operation_digest: digest(canonical(plan)),
      nextWrite: 0,
      nextMove: 0
    };
    if (journal.kind !== plan.kind) throw new Error('plan kind does not match the pending journal');
    if (journal.plan_digest !== normalizedPlanDigest(plan)) throw new Error('plan does not match the pending journal');
    if (!fs.existsSync(journalPath)) atomicWrite(journalPath, JSON.stringify(journal, null, 2));
    for (let writeIndex = 0; writeIndex < journal.writes.length; writeIndex++) {
      const w = journal.writes[writeIndex], target = path.resolve(root, w.path);
      if (!target.startsWith(root + path.sep)) throw new Error(`write escapes workspace: ${w.path}`);
      if (hasSymlinkComponent(w.path)) throw new Error(`write path contains a symlink: ${w.path}`);
      const existing = fs.existsSync(target) ? read(target) : '';
      if (digest(existing) === digest(w.content)) { journal.nextWrite = Math.max(journal.nextWrite, writeIndex + 1); continue; }
      if (digest(existing) !== w.expected_digest) throw new Error(`concurrent write conflict: ${w.path}`);
      if (existing && w.path.startsWith('knowledge/')) {
        const before = yamlFromMarkdown(existing), after = yamlFromMarkdown(w.content);
        if (!before.meta || !after.meta) throw new Error(`cannot safely replace knowledge without frontmatter: ${w.path}`);
        for (const field of ['evidence', 'history', 'sources']) {
          const prior = before.meta[field] ?? [], next = after.meta[field] ?? [];
          if (next.length < prior.length || JSON.stringify(next.slice(0, prior.length)) !== JSON.stringify(prior)) throw new Error(`knowledge ${field} must be append-only: ${w.path}`);
        }
        const oldBody = before.body;
        const retained = !oldBody.trim() || normalizeLinkTargets(after.body).includes(normalizeLinkTargets(oldBody.trim()));
        if (!retained && !bodySnapshotRecorded(after.meta, oldBody, w.path)) throw new Error(`knowledge body replacement requires previous_body/previous_path history: ${w.path}`);
      }
      atomicWrite(target, w.content);
      journal.nextWrite = writeIndex + 1;
      atomicWrite(journalPath, JSON.stringify(journal, null, 2));
      if (process.env.BRAIN_FAIL_AFTER_WRITE === String(writeIndex + 1)) throw new Error('injected failure after write');
    }
    for (let moveIndex = 0; moveIndex < (journal.moves ?? []).length; moveIndex++) {
      const move = journal.moves[moveIndex], source = path.resolve(root, move.from_path), destination = path.resolve(root, move.to_path);
      if (hasSymlinkComponent(move.from_path) || hasSymlinkComponent(move.to_path)) throw new Error(`move path contains a symlink: ${move.from_path}`);
      if (!fs.existsSync(destination)) throw new Error(`move destination is missing: ${move.to_path}`);
      const destMeta = yamlFromMarkdown(read(destination)).meta;
      if (destMeta?.id !== move.id || knowledgePathFor(destMeta) !== move.to_path) throw new Error(`move destination failed stable ID/type/topic validation: ${move.to_path}`);
      if (fs.existsSync(source)) {
        if (digest(read(source)) !== move.expected_digest) throw new Error(`move source changed concurrently: ${move.from_path}`);
        const oldMeta = yamlFromMarkdown(read(source)).meta;
        if (oldMeta?.id !== move.id) throw new Error(`move source stable ID mismatch: ${move.from_path}`);
        fs.rmSync(source);
      }
      journal.nextMove = moveIndex + 1;
      atomicWrite(journalPath, JSON.stringify(journal, null, 2));
      if (process.env.BRAIN_FAIL_AFTER_MOVE === String(moveIndex + 1)) throw new Error('injected failure after move');
    }
    if (plan.writes.some((w) => w.path.startsWith('knowledge/'))) {
      const indexScript = path.join(root, 'app', 'viewer', 'scripts', 'generate-index.ts');
      if (!fs.existsSync(indexScript)) throw new Error('knowledge writes require app/viewer/scripts/generate-index.ts before daily status can advance');
      const generated = spawnSync(process.execPath, [indexScript], { cwd: root, encoding: 'utf8' });
      if (generated.status !== 0) throw new Error(`index generation failed: ${generated.stderr || generated.stdout}`);
      journal.phase = 'index-complete';
      atomicWrite(journalPath, JSON.stringify(journal, null, 2));
    }
    if (plan.daily_status_path) {
      const dailyPath = path.resolve(root, plan.daily_status_path);
      if (!dailyPath.startsWith(root + path.sep) || !fs.existsSync(dailyPath)) throw new Error('invalid daily status path');
      const raw = read(dailyPath), { meta, body } = yamlFromMarkdown(raw);
      if (meta?.status !== 'new' && meta?.status !== 'processed') throw new Error('daily status must be new or already processed');
      if (meta.status === 'new') {
        const next = raw.replace(/^(---\r?\n[\s\S]*?^status:[ \t]*)new([ \t]*\r?\n)/m, '$1processed$2');
        if (next === raw) throw new Error('could not update daily status without changing other bytes');
        atomicWrite(dailyPath, next);
      }
    }
    if (plan.kind === 'daily') {
      if (process.env.BRAIN_FAIL_AFTER_STATUS === '1') throw new Error('injected failure after daily status');
      const applied = fs.existsSync(appliedDailyPath) ? JSON.parse(read(appliedDailyPath)) : {};
      applied[plan.source_id] = { source_digest: plan.source_digest, operation_digest: operationDigest };
      atomicWrite(appliedDailyPath, JSON.stringify(applied, null, 2));
    }
    if (plan.kind === 'input') {
      inputs.record(plan, operationDigest, plan.writes.filter((w) => w.path.startsWith('knowledge/')).map((w) => yamlFromMarkdown(w.content).meta.id));
      if (process.env.BRAIN_FAIL_AFTER_INPUT_RECEIPT === '1') throw new Error('injected failure after input receipt');
    }
    if (plan.kind === 'report') {
      const completed = yamlFromMarkdown(read(path.resolve(root, plan.source_id))).meta;
      if (['completed', 'deferred', 'blocked'].includes(completed?.status)) {
        const state = loadState();
        state.acknowledgedInputs[plan.source_id] = reportRequestDigest(completed, yamlFromMarkdown(read(path.resolve(root, plan.source_id))).body);
        atomicWrite(statePath, JSON.stringify(state, null, 2));
      }
      if (process.env.BRAIN_FAIL_AFTER_REPORT_ACK === '1') throw new Error('injected failure after report acknowledgement');
    }
    fs.rmSync(journalPath, { force: true });
    console.log('applied');
  } else throw new Error(`unknown command: ${cmd}`);
} catch (error) { fail(error.message); }
finally { if (mutationLock) fs.unlinkSync(mutationLock); }
