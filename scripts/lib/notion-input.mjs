import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
const fields = ['page_id', 'input_key', 'source', 'source_ref', 'occurred_at', 'quote', 'summary', 'context'];
export const hash = (text) => crypto.createHash('sha256').update(text).digest('hex');
export function normalizeInput(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some((key) => !fields.includes(key))) throw new Error('invalid input snapshot fields');
  for (const key of fields) if (typeof value[key] !== 'string' || (key !== 'context' && !value[key].trim())) throw new Error(`input ${key} must be a string${key === 'context' ? '' : ' with content'}`);
  if (!uuid.test(value.page_id)) throw new Error('input page_id must be a UUID');
  if (!['codex', 'chatgpt', 'legacy-daily'].includes(value.source)) throw new Error('invalid input source');
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*(?:Z|[+-]\d{2}:\d{2}))?$/.test(value.occurred_at) || !Number.isFinite(Date.parse(value.occurred_at))) throw new Error('input occurred_at must be an ISO date or timestamp with timezone');
  return Object.fromEntries(fields.map((key) => [key, key === 'page_id' ? value[key].toLowerCase() : value[key]]));
}
export const inputDigest = (value) => hash(JSON.stringify(normalizeInput(value)));
const evidenceDigest = (value) => hash(JSON.stringify([value.source, value.source_ref, value.occurred_at, value.quote]));
export function parseInputRecord(pageId, markdown) {
  const matches = [...markdown.matchAll(/(`{3,})json\n([\s\S]*?)\n\1/g)];
  if (matches.length !== 1) throw new Error('input page must have exactly one canonical JSON record');
  return normalizeInput({ ...JSON.parse(matches[0][2]), page_id: pageId });
}

// Notion remains the queue. Disk keeps only one in-flight snapshot and small receipts.
export function inputStore(root) {
  const activePath = path.join(root, 'state', 'notion-input.json');
  const ledgerPath = path.join(root, 'state', 'applied-input.json');
  const read = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
  function safe(file) {
    for (let current = file; current !== root; current = path.dirname(current)) {
      if (fs.existsSync(current) && fs.lstatSync(current).isSymbolicLink()) throw new Error('input state must not contain symlinks');
    }
  }
  function write(file, value) {
    safe(file); fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.${process.pid}.tmp`;
    fs.writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, { flag: 'wx' });
    fs.renameSync(tmp, file);
  }
  function active() { safe(activePath); return fs.existsSync(activePath) ? normalizeInput(read(activePath)) : null; }
  function ledger() {
    safe(ledgerPath);
    const value = fs.existsSync(ledgerPath) ? read(ledgerPath) : {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid input receipt ledger');
    for (const [id, entry] of Object.entries(value)) {
      if (!/^notion:[a-f0-9-]{36}$/.test(id) || !entry || !/^[a-f0-9]{64}$/.test(entry.source_digest) || !/^[a-f0-9]{64}$/.test(entry.evidence_digest) || typeof entry.input_key !== 'string' || !/^[a-f0-9]{64}$/.test(entry.operation_digest) || !Array.isArray(entry.knowledge_ids) || !Array.isArray(entry.paths)) throw new Error('invalid input receipt');
    }
    return value;
  }
  function next() {
    const current = active(); if (!current) return null;
    const id = `notion:${current.page_id}`, receipt = ledger()[id], digest = inputDigest(current);
    if (receipt && receipt.source_digest !== digest) throw new Error('applied input changed; create a new Notion input for a correction');
    return { kind: receipt ? 'input_ack' : 'input', source_id: id, digest, input: current, ...(receipt ? { receipt } : {}) };
  }
  function stage(value) {
    const input = normalizeInput(value), current = active();
    if (current) {
      if (inputDigest(current) !== inputDigest(input)) throw new Error('another input is in flight; resume it first');
      return next();
    }
    const receipts = ledger(), id = `notion:${input.page_id}`;
    if (receipts[id] && receipts[id].source_digest !== inputDigest(input)) throw new Error('applied input changed; create a new Notion input for a correction');
    const duplicate = Object.entries(receipts).find(([key, entry]) => key !== id && entry.input_key === input.input_key);
    if (duplicate) {
      if (duplicate[1].evidence_digest !== evidenceDigest(input)) throw new Error('input key collision: the same key has different original evidence');
      return { kind: 'input_duplicate', source_id: id, duplicate_of: duplicate[0], receipt: duplicate[1] };
    }
    write(activePath, input); return next();
  }
  function verify(value) {
    const current = active();
    if (!current || inputDigest(current) !== inputDigest(value)) throw new Error('Notion input changed during processing');
    return next();
  }
  function source(id) {
    const current = active();
    if (current && id === `notion:${current.page_id}`) return { source_digest: inputDigest(current), input_key: current.input_key, input: current };
    return ledger()[id] ?? null;
  }
  function record(plan, operationDigest, knowledgeIds) {
    const current = next();
    if (!current || current.source_id !== plan.source_id || current.digest !== plan.source_digest) throw new Error('input does not match the active snapshot');
    const entries = ledger(), before = entries[plan.source_id];
    if (before && before.operation_digest !== operationDigest) throw new Error('input was already applied by another operation');
    if (!before) {
      entries[plan.source_id] = { source_digest: plan.source_digest, input_key: current.input.input_key, evidence_digest: evidenceDigest(current.input), operation_digest: operationDigest, knowledge_ids: knowledgeIds, paths: plan.writes.map((w) => w.path) };
      write(ledgerPath, entries);
    }
  }
  function ack(proof) {
    const current = next();
    if (!current || current.kind !== 'input_ack' || proof.page_id !== current.input.page_id || proof.input_key !== current.input.input_key || proof.source_digest !== current.digest || proof.status !== '完了') throw new Error('input-ack requires a verified matching Notion completion after local apply');
    safe(activePath); fs.unlinkSync(activePath); return { acknowledged: current.source_id };
  }
  return { active, ledger, next, stage, verify, source, record, ack };
}

export function validateInputBody(body, snapshot, filePath) {
  const summaryStart = body.indexOf('# 内容\n');
  const linksStart = body.indexOf('## 関連リンク\n');
  const historyStart = body.indexOf('# 根拠・思考の履歴\n');
  if (summaryStart !== 0 || linksStart <= summaryStart || historyStart <= linksStart) throw new Error('input knowledge must use 内容 / 関連リンク / 根拠・思考の履歴 in this order');
  const links = body.slice(linksStart, historyStart);
  if (/https?:\/\//.test(links)) throw new Error('related links must be relative knowledge links; register external facts separately');
  for (const match of links.matchAll(/\]\(<?([^)>]+)>?\)/g)) {
    const target = match[1];
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(filePath), decodeURIComponent(target.split(/[?#]/, 1)[0])));
    if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(target) || !resolved.startsWith('knowledge/') || !resolved.endsWith('.md')) throw new Error('related links must be relative knowledge links; register external facts separately');
  }
  const history = body.slice(historyStart);
  if (!history.includes(snapshot.quote.replace(/\r\n/g, '\n')) || !history.includes(snapshot.occurred_at) || !history.includes(snapshot.source_ref)) throw new Error('knowledge history must preserve the input quote, original date and conversation reference');
}
