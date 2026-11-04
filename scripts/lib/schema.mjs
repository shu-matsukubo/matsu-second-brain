const TYPES = new Set(['fact', 'principle', 'idea']);
const DIRECTIONS = new Set(['support', 'oppose', 'unrelated', 'none']);
const REPORT_STATUSES = new Set(['pending', 'in_progress', 'completed', 'deferred', 'blocked']);
const REPORT_KINDS = new Set(['knowledge', 'policy', 'skill', 'failure', 'other']);
const ORIGINS = new Set(['user', 'ai']);
const isIsoDate = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2}))?$/.test(v) && !Number.isNaN(Date.parse(v));
const isRecord = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const strings = (v) => Array.isArray(v) && v.every((x) => typeof x === 'string');
const errorsFor = (value, requirements) => {
  const errors = [];
  if (!isRecord(value)) return ['must be an object'];
  for (const [key, check, message] of requirements) if (!check(value[key])) errors.push(`${key} ${message}`);
  return errors;
};

/** Validate parsed knowledge frontmatter. Pure and safe to import in browser/server code. */
export function validateKnowledge(value) {
  const errors = errorsFor(value, [
    ['id', (v) => typeof v === 'string' && v.trim().length > 0, 'must be a non-empty stable ID'],
    ['title', (v) => typeof v === 'string' && v.trim().length > 0, 'must be a non-empty string'],
    ['type', (v) => TYPES.has(v), 'must be fact, principle, or idea'],
    ['topic', (v) => typeof v === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(v), 'must be an English topic slug'],
    ['topic_label', (v) => typeof v === 'string' && v.trim().length > 0, 'must be a non-empty display label'],
    ['tags', strings, 'must be a string array'],
    ['updated', isIsoDate, 'must be an ISO date string'],
    ['support_streak', (v) => Number.isInteger(v) && v >= 0, 'must be a non-negative integer'],
    ['opposition_streak', (v) => Number.isInteger(v) && v >= 0, 'must be a non-negative integer'],
    ['related', strings, 'must be an ID array'],
    ['opposes', strings, 'must be an ID array'],
    ['evidence', Array.isArray, 'must be an array'],
    ['history', Array.isArray, 'must be an array'],
    ['sources', Array.isArray, 'must be an array']
  ]);
  if (errors.length || !isRecord(value)) return { valid: false, errors };
  value.evidence.forEach((entry, i) => {
    if (!isRecord(entry)) { errors.push(`evidence[${i}] must be an object`); return; }
    if (!DIRECTIONS.has(entry.direction)) errors.push(`evidence[${i}].direction is invalid`);
    if (typeof entry.background !== 'string' || !entry.background.trim()) errors.push(`evidence[${i}].background must be non-empty`);
    if (typeof entry.source_id !== 'string' || !entry.source_id.trim()) errors.push(`evidence[${i}].source_id must be non-empty`);
    if (!ORIGINS.has(entry.origin)) errors.push(`evidence[${i}].origin must be user or ai`);
    if (typeof entry.input_digest !== 'string' || !/^[a-f0-9]{64}$/.test(entry.input_digest)) errors.push(`evidence[${i}].input_digest must be a SHA-256 hex digest`);
    if (entry.counted === true && entry.origin !== 'user') errors.push(`evidence[${i}] AI evidence cannot count toward streaks`);
    if (entry.counted === true && !['support', 'oppose'].includes(entry.direction)) errors.push(`evidence[${i}] only support/oppose evidence can count`);
  });
  value.history.forEach((entry, i) => {
    if (!isRecord(entry) || !TYPES.has(entry.from) || !TYPES.has(entry.to) || !isIsoDate(entry.at) || typeof entry.reason !== 'string' || !entry.reason.trim()) errors.push(`history[${i}] must include valid from/to types, date, and reason`);
  });
  return { valid: errors.length === 0, errors };
}

/** Validate a report frontmatter object. */
export function validateReport(value) {
  return result(errorsFor(value, [
    ['id', (v) => typeof v === 'string' && !!v, 'must be a stable ID'],
    ['fingerprint', (v) => typeof v === 'string' && !!v, 'must be non-empty'],
    ['origin', (v) => ORIGINS.has(v), 'must be user or ai'],
    ['kind', (v) => REPORT_KINDS.has(v), 'is invalid'],
    ['status', (v) => REPORT_STATUSES.has(v), 'is invalid'],
    ['request', (v) => typeof v === 'string', 'must be a string'],
    ['result', (v) => typeof v === 'string', 'must be a string'],
    ['created', isIsoDate, 'must be an ISO date string'],
    ['updated', isIsoDate, 'must be an ISO date string']
  ]));
}

/** Validate minimal state persisted by the workflow CLI. */
export function validateWorkflowState(value) {
  return result(errorsFor(value, [
    ['version', (v) => v === 1, 'must equal 1'],
    ['pending', (v) => v === null || isRecord(v), 'must be null or an object'],
    ['idleFingerprint', (v) => v === null || typeof v === 'string', 'must be null or a string'],
    ['acknowledgedInputs', isRecord, 'must be an object']
  ]));
}

/** Validate a deterministic plan emitted by a Skill; paths are workspace-relative. */
export function validateOperationPlan(value) {
  if (!isRecord(value)) return { valid: false, errors: ['must be an object'] };
  const allowedKeys = new Set(['version', 'kind', 'source_id', 'source_digest', 'writes', 'moves', 'daily_status_path']);
  const errors = Object.keys(value)
    .filter((key) => !allowedKeys.has(key))
    .map((key) => `unknown operation plan field: ${key}`);
  errors.push(...errorsFor(value, [
    ['version', (v) => v === 1, 'must equal 1'],
    ['kind', (v) => ['input', 'daily', 'report', 'review'].includes(v), 'is invalid'],
    ['source_id', (v) => typeof v === 'string' && !!v, 'must be non-empty'],
    ['source_digest', (v) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v), 'must be a SHA-256 hex digest'],
    ['writes', Array.isArray, 'must be an array'],
    ['moves', (v) => v === undefined || Array.isArray(v), 'must be an array when supplied'],
    ['daily_status_path', (v) => v === null || typeof v === 'string', 'must be null or a path']
  ]));
  if (errors.length) return { valid: false, errors };
  value.writes.forEach((write, i) => {
    if (!isRecord(write) || typeof write.path !== 'string' || typeof write.content !== 'string' || typeof write.expected_digest !== 'string' || !/^[a-f0-9]{64}$/.test(write.expected_digest)) errors.push(`writes[${i}] must have path, content, a SHA-256 expected_digest`);
  });
  (value.moves ?? []).forEach((move, i) => {
    if (!isRecord(move) || typeof move.from_path !== 'string' || typeof move.to_path !== 'string' || typeof move.id !== 'string' || typeof move.expected_digest !== 'string' || !/^[a-f0-9]{64}$/.test(move.expected_digest)) errors.push(`moves[${i}] must have from_path, to_path, id, a SHA-256 expected_digest`);
  });
  return { valid: errors.length === 0, errors };
}

function result(errors) { return { valid: errors.length === 0, errors }; }
export const knowledgeTypes = Object.freeze(['fact', 'principle', 'idea']);
export const reportStatuses = Object.freeze([...REPORT_STATUSES]);
export const reportKinds = Object.freeze([...REPORT_KINDS]);
