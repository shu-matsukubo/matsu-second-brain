#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { spawnSync } from 'node:child_process';
import YAML from 'yaml';
import { validateKnowledge } from './lib/schema.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const BASE = 'efa3a14783cf9349c8e22141b40f93428ae9ded4';
const MAP_PATH = 'report/archive/migration-map.json';
const LEGACY_KNOWLEDGE = '.migration-legacy-knowledge';
const STAGING_KNOWLEDGE = 'knowledge.next';
const OLD_TOPICS = new Map([
  ['AWS', ['aws', 'AWS']],
  ['Cloudflare', ['cloudflare', 'Cloudflare']],
  ['Codex', ['codex', 'Codex']],
  ['Docker', ['docker', 'Docker']],
  ['Git', ['git', 'Git']],
  ['Neovim', ['neovim', 'Neovim']],
  ['アプリ開発', ['app-development', 'アプリ開発']],
  ['開発ツール', ['development-tools', '開発ツール']],
  ['開発プロセス', ['development-process', '開発プロセス']]
]);
const sha = (value) => crypto.createHash('sha256').update(value).digest('hex');
const prepareOnly = process.argv.includes('--prepare-only');
const rel = (value) => value.replaceAll('\\', '/');
const abs = (value) => path.resolve(ROOT, value);
const read = (value) => fs.readFileSync(value);
const insideRoot = (value) => {
  const resolved = path.resolve(value);
  if (resolved === ROOT || !resolved.startsWith(ROOT + path.sep)) throw new Error(`Refusing path outside repository: ${resolved}`);
  return resolved;
};
const exists = (value) => fs.existsSync(abs(value));

function walk(relative, allowMissing = false) {
  const directory = abs(relative);
  assertNoSymlinkParents(relative);
  if (!fs.existsSync(directory)) {
    if (allowMissing) return [];
    throw new Error(`Missing legacy directory: ${relative}`);
  }
  const rootInfo = fs.lstatSync(directory);
  if (rootInfo.isSymbolicLink() || !rootInfo.isDirectory()) throw new Error(`Legacy path must be a real directory: ${relative}`);
  const files = [];
  const visit = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const child = path.join(current, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`Legacy symlinks require manual review: ${rel(path.relative(ROOT, child))}`);
      if (entry.isDirectory()) visit(child);
      else if (entry.isFile()) files.push(rel(path.relative(ROOT, child)));
    }
  };
  visit(directory);
  return files.sort((a, b) => a.localeCompare(b, 'en'));
}

function atomicWrite(targetRelative, content) {
  const target = insideRoot(abs(targetRelative));
  assertNoSymlinkParents(targetRelative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  assertNoSymlinkParents(targetRelative);
  if (fs.existsSync(target)) {
    if (read(target).equals(Buffer.from(content))) return;
    throw new Error(`Refusing to overwrite a different file: ${targetRelative}`);
  }
  const temporary = `${target}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, content, { flag: 'wx' });
  fs.renameSync(temporary, target);
}
function assertNoSymlinkParents(relative) {
  let current = ROOT;
  for (const segment of relative.split(/[\\/]/).filter(Boolean)) {
    current = path.join(current, segment);
    if (!fs.existsSync(current)) continue;
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`Refusing to follow a symlink: ${relative}`);
  }
}

function parseMarkdown(bytes) {
  const text = bytes.toString('utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error('Legacy Markdown has no frontmatter');
  return { text, metadata: YAML.parse(match[1]), body: text.slice(match[0].length), eol: match[0].includes('\r\n') ? '\r\n' : '\n' };
}

function oldKnowledgeFiles(sourceRoot) {
  return ['01-facts', '02-principles', '03-ideas'].flatMap((folder) => walk(`${sourceRoot}/${folder}`)).filter((p) => p.endsWith('.md'));
}

function collectKnowledge(sourceRoot) {
  const legacyFiles = oldKnowledgeFiles(sourceRoot).map((sourcePath) => ({
    sourcePath,
    oldPath: sourceRoot === 'knowledge' ? sourcePath : `knowledge/${sourcePath.slice(`${sourceRoot}/`.length)}`
  }));
  const rows = legacyFiles.map(({ oldPath, sourcePath }) => {
    const source = read(abs(sourcePath));
    const parsed = parseMarkdown(source);
    const { metadata } = parsed;
    const topic = OLD_TOPICS.get(metadata.topic);
    if (!topic || !['fact', 'principle', 'idea'].includes(metadata.type) || typeof metadata.title !== 'string' || !Array.isArray(metadata.tags) || typeof metadata.updated !== 'string')
      throw new Error(`Unexpected legacy metadata in ${oldPath}`);
    const id = `k-${sha(oldPath).slice(0, 16)}`;
    const directory = metadata.type === 'fact' ? 'facts' : metadata.type === 'principle' ? 'principles' : 'ideas';
    const newPath = `knowledge/${directory}/${topic[0]}/${id}.md`;
    return { oldPath, sourcePath, newPath, id, metadata, topicKey: topic[0], topicLabel: topic[1], parsed, source, sourceSha256: sha(source), oldBodySha256: sha(parsed.body) };
  });
  if (rows.length !== 67) throw new Error(`Expected 67 legacy knowledge files, found ${rows.length}`);
  const byOldPath = new Map(rows.map((row) => [row.oldPath, row]));
  const references = new Map(rows.map((row) => [row.id, { related: [], opposes: [] }]));
  for (const row of rows) {
    for (const link of markdownLinks(row.parsed.body)) {
      const resolved = oldLinkPath(row.oldPath, link.target);
      if (/\.md(?:[#?].*)?$/i.test(link.target) && /^knowledge\/(?:01-facts|02-principles|03-ideas)\//.test(resolved) && !byOldPath.has(resolved)) throw new Error(`Legacy internal link target is missing: ${row.oldPath} -> ${link.target}`);
      const target = byOldPath.get(resolved);
      if (!target) continue;
      const before = row.parsed.body.slice(0, link.index);
      const heading = before.split(/\r?\n/).reverse().find((line) => /^#{1,6}\s/.test(line)) ?? '';
      const isOpposition = /反対|oppos/i.test(heading);
      const field = isOpposition ? 'opposes' : 'related';
      const values = references.get(row.id)[field];
      if (!values.includes(target.id)) values.push(target.id);
    }
  }
  for (const row of rows) {
    const content = rewriteBodyLinks(row, byOldPath);
    if (markdownLinks(content).some((link) => /(?:^|\/)(?:01-facts|02-principles|03-ideas)(?:\/|$)/.test(link.target))) throw new Error(`Old classification path remains in Markdown links: ${row.oldPath}`);
    const { related, opposes } = references.get(row.id);
    const sources = markdownLinks(content)
      .map((link) => link.target)
      .filter((target) => /^https?:\/\//i.test(target))
      .map((url) => ({ url }));
    const uniqueSources = [...new Map(sources.map((source) => [source.url, source])).values()];
    const frontmatter = {
      id: row.id,
      title: row.metadata.title,
      type: row.metadata.type,
      topic: row.topicKey,
      topic_label: row.topicLabel,
      tags: row.metadata.tags,
      updated: row.metadata.updated,
      support_streak: 0,
      opposition_streak: 0,
      history_status: 'unknown',
      related,
      opposes,
      evidence: [],
      history: [],
      sources: uniqueSources
    };
    row.content = `---${row.parsed.eol}${YAML.stringify(frontmatter).replace(/\n/g, row.parsed.eol).trimEnd()}${row.parsed.eol}---${row.parsed.eol}${content}`;
    row.newBodySha256 = sha(content);
  }
  return { rows, oldToNew: new Map(rows.map((row) => [row.oldPath, row.newPath])) };
}

function markdownLinks(body) {
  const links = [];
  for (const match of body.matchAll(/\]\(<?([^)>]+)>?\)/g)) links.push({ target: match[1].trim(), fullMatch: match[0], index: match.index ?? 0 });
  return links;
}
function normalizeSourcesFromLegacy(migration) {
  for (const entry of migration.knowledge) {
    const target = abs(entry.new_path);
    const migrated = parseMarkdown(read(target));
    const sources = [...new Set(markdownLinks(migrated.body)
      .map((link) => link.target)
      .filter((target) => /^https?:\/\//i.test(target)))].map((url) => ({ url }));
    if (JSON.stringify(migrated.metadata.sources) === JSON.stringify(sources)) continue;
    migrated.metadata.sources = sources;
    const updated = `---${migrated.eol}${YAML.stringify(migrated.metadata).replace(/\n/g, migrated.eol).trimEnd()}${migrated.eol}---${migrated.eol}${migrated.body}`;
    const temporary = `${target}.${process.pid}.tmp`;
    fs.writeFileSync(temporary, updated, { flag: 'wx' });
    fs.renameSync(temporary, target);
  }
}
function oldLinkPath(sourceOldPath, target) {
  if (/^(?:[a-z]+:|\/\/|#)/i.test(target)) return '';
  let clean = target.split(/[?#]/, 1)[0];
  try { clean = decodeURIComponent(clean); } catch { return ''; }
  return path.posix.normalize(path.posix.join(path.posix.dirname(sourceOldPath), clean));
}
function rewriteBodyLinks(row, byOldPath) {
  return row.parsed.body.replace(/\]\(<?([^)>]+)>?\)/g, (full, rawTarget) => {
    const target = String(rawTarget).trim();
    const oldTarget = oldLinkPath(row.oldPath, target);
    const targetRow = byOldPath.get(oldTarget);
    if (!targetRow) return full;
    const suffix = target.match(/[?#].*$/)?.[0] ?? '';
    let relative = path.posix.relative(path.posix.dirname(row.newPath), targetRow.newPath);
    relative += suffix;
    return `](${relative.includes(' ') ? `<${relative}>` : relative})`;
  });
}

function writeKnowledgeStage(sourceRoot) {
  const stage = STAGING_KNOWLEDGE;
  if (exists(stage)) {
    const target = insideRoot(abs(stage));
    fs.rmSync(target, { recursive: true, force: true });
  }
  const { rows, oldToNew } = collectKnowledge(sourceRoot);
  for (const row of rows) atomicWrite(`${stage}/${row.newPath.slice('knowledge/'.length)}`, row.content);
  const entries = rows.map(({ oldPath, newPath, id, sourceSha256, oldBodySha256, newBodySha256 }) => ({ old_path: oldPath, new_path: newPath, id, source_sha256: sourceSha256, old_body_sha256: oldBodySha256, migrated_body_sha256: newBodySha256 }));
  return { rows, oldToNew, entries };
}

function installKnowledgeWithoutRootRename(migration) {
  const entries = migration.knowledge;
  const legacyPaths = entries.map((entry) => entry.old_path).sort((a, b) => a.localeCompare(b, 'en'));
  for (const oldPath of legacyPaths) {
    const target = abs(oldPath);
    if (!fs.existsSync(target)) continue;
    if (sha(read(target)) !== entries.find((entry) => entry.old_path === oldPath).source_sha256)
      throw new Error(`Legacy knowledge changed before replacement: ${oldPath}`);
    fs.unlinkSync(target);
  }
  for (const entry of entries) {
    const staged = `${STAGING_KNOWLEDGE}/${entry.new_path.slice('knowledge/'.length)}`;
    const content = read(abs(staged));
    atomicWrite(entry.new_path, content);
  }
  const prune = (directory) => {
    if (!fs.existsSync(abs(directory))) return;
    for (const name of fs.readdirSync(abs(directory))) {
      const child = `${directory}/${name}`;
      if (fs.lstatSync(abs(child)).isDirectory() && !fs.lstatSync(abs(child)).isSymbolicLink()) prune(child);
    }
    if (fs.readdirSync(abs(directory)).length === 0) fs.rmdirSync(abs(directory));
  };
  for (const oldRoot of ['knowledge/01-facts', 'knowledge/02-principles', 'knowledge/03-ideas']) prune(oldRoot);
}

function copyArchive(sourceRelative, archiveRelative, archiveEntries) {
  const sourceFiles = walk(sourceRelative, true);
  for (const sourcePath of sourceFiles) {
    const suffix = sourcePath.slice(sourceRelative.length).replace(/^\//, '');
    const targetPath = `${archiveRelative}/${suffix}`;
    const source = read(abs(sourcePath));
    const target = abs(targetPath);
    assertNoSymlinkParents(targetPath);
    if (!fs.existsSync(target)) atomicWrite(targetPath, source);
    if (!read(target).equals(source)) throw new Error(`Archive copy mismatch: ${sourcePath} -> ${targetPath}`);
    archiveEntries.push({ old_path: sourcePath, archive_path: targetPath, sha256: sha(source) });
  }
  return sourceFiles;
}

function verifyKnowledgeFiles(entries, activeRoot = 'knowledge') {
  const ids = new Set(entries.map((entry) => entry.id));
  for (const item of entries) {
    const newPath = item.new_path;
    const sourcePath = activeRoot === 'knowledge' ? newPath : `${activeRoot}/${newPath.slice('knowledge/'.length)}`;
    assertNoSymlinkParents(sourcePath);
    const parsed = parseMarkdown(read(abs(sourcePath)));
    const meta = parsed.metadata;
    const validation = validateKnowledge(meta);
    if (!validation.valid) throw new Error(`Migrated metadata invalid at ${sourcePath}: ${validation.errors.join('; ')}`);
    if (meta.id !== item.id || sha(parsed.body) !== item.migrated_body_sha256) throw new Error(`Migrated knowledge verification failed: ${sourcePath}`);
    if (meta.support_streak !== 0 || meta.opposition_streak !== 0 || meta.history_status !== 'unknown' || meta.evidence.length !== 0 || meta.history.length !== 0) throw new Error(`Legacy history was not initialized as unknown: ${sourcePath}`);
    if ([...meta.related, ...meta.opposes].some((id) => !ids.has(id))) throw new Error(`Migrated link IDs are missing in the migration map: ${sourcePath}`);
  }
}

function safeDelete(relative, expectedFiles = null, expectedHashes = null) {
  if (!exists(relative)) return;
  const target = insideRoot(abs(relative));
  if (fs.lstatSync(target).isSymbolicLink() || !fs.lstatSync(target).isDirectory()) throw new Error(`Refusing to recursively delete a non-directory or symlink: ${relative}`);
  const actualAll = walk(relative);
  if (expectedFiles) {
    const actual = actualAll;
    if (actual.length !== expectedFiles.length) throw new Error(`Refusing cleanup with unexpected file count: ${relative}`);
    for (let i = 0; i < actual.length; i++) {
      const relativeToRoot = actual[i];
      const expected = expectedFiles[i];
      if (relativeToRoot !== expected) throw new Error(`Refusing cleanup with unexpected path: ${relativeToRoot}`);
      if (expectedHashes && sha(read(abs(relativeToRoot))) !== expectedHashes[i]) throw new Error(`Refusing cleanup after source changed: ${relativeToRoot}`);
    }
  }
  fs.rmSync(target, { recursive: true, force: true });
}
function safeDeleteFile(relative, expectedSha256) {
  if (!exists(relative)) return;
  assertNoSymlinkParents(relative);
  const target = insideRoot(abs(relative));
  const info = fs.lstatSync(target);
  if (info.isSymbolicLink() || !info.isFile() || sha(read(target)) !== expectedSha256) throw new Error(`Refusing to delete unexpected file: ${relative}`);
  fs.unlinkSync(target);
}

function baselineCheck() {
  execFileSync('git', ['diff', '--quiet', BASE, '--', 'knowledge', 'reports', 'signals', 'feedback', '.state', '.codex/agents', 'app/viewer/library-index.json'], { cwd: ROOT, stdio: 'ignore' });
}

function runIndex() {
  const generated = spawnSync(process.execPath, ['app/viewer/scripts/generate-index.ts'], { cwd: ROOT, encoding: 'utf8' });
  if (generated.status !== 0) throw new Error(`index generation failed: ${generated.stderr || generated.stdout}`);
  const checked = spawnSync(process.execPath, ['app/viewer/scripts/generate-index.ts', '--check'], { cwd: ROOT, encoding: 'utf8' });
  if (checked.status !== 0) throw new Error(`index check failed: ${checked.stderr || checked.stdout}`);
}

function hasNewKnowledgeLayout() {
  const folder = abs('knowledge');
  if (!fs.existsSync(folder)) return false;
  if (fs.lstatSync(folder).isSymbolicLink() || !fs.lstatSync(folder).isDirectory()) throw new Error('Knowledge root must be a real directory');
  const names = fs.readdirSync(folder, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  return names.includes('facts') && names.includes('principles') && names.includes('ideas');
}

function migrate() {
  const markerPath = abs(MAP_PATH);
  const markerExists = fs.existsSync(markerPath);
  const backupExists = exists(LEGACY_KNOWLEDGE);
  if (prepareOnly && markerExists) {
    const existing = JSON.parse(read(markerPath).toString('utf8'));
    verifyKnowledgeFiles(existing.knowledge);
    console.log(JSON.stringify({ status: 'already-migrated', knowledge: existing.counts }, null, 2));
    return;
  }
  let migration;
  if (markerExists) {
    migration = JSON.parse(read(markerPath).toString('utf8'));
    normalizeSourcesFromLegacy(migration);
    verifyKnowledgeFiles(migration.knowledge);
  } else {
    if (!backupExists) baselineCheck();
    const sourceRoot = backupExists && oldKnowledgeFiles(LEGACY_KNOWLEDGE).length === 67 ? LEGACY_KNOWLEDGE : 'knowledge';
    migration = writeKnowledgeStage(sourceRoot);
    verifyKnowledgeFiles(migration.entries, STAGING_KNOWLEDGE);
    const archiveEntries = [];
    copyArchive('reports', 'report/archive/reports', archiveEntries);
    copyArchive('signals', 'report/archive/signals', archiveEntries);
    copyArchive('feedback', 'report/archive/feedback', archiveEntries);
    copyArchive('.state', 'report/archive/legacy-state', archiveEntries);
    migration = {
      version: 1,
      source_commit: BASE,
      legacy_library_index_sha256: exists('app/viewer/library-index.json') ? sha(read(abs('app/viewer/library-index.json'))) : null,
      knowledge: migration.entries,
      archives: archiveEntries.sort((a, b) => a.old_path.localeCompare(b.old_path, 'en')),
      counts: { knowledge: migration.entries.length, archived_reports: archiveEntries.filter((entry) => entry.old_path.startsWith('reports/')).length, archived_signals: archiveEntries.filter((entry) => entry.old_path.startsWith('signals/')).length, archived_feedback: archiveEntries.filter((entry) => entry.old_path.startsWith('feedback/')).length, archived_state: archiveEntries.filter((entry) => entry.old_path.startsWith('.state/')).length }
    };
    if (migration.counts.archived_reports !== 71 || migration.counts.archived_signals !== 1 || migration.counts.archived_feedback !== 1 || migration.counts.archived_state !== 2) throw new Error(`Unexpected archive counts: ${JSON.stringify(migration.counts)}`);
    if (prepareOnly) {
      console.log(JSON.stringify({ status: 'prepared-only', knowledge: migration.counts.knowledge, archives: migration.counts, sample: migration.knowledge.slice(0, 3) }, null, 2));
      return;
    }
    if (!backupExists) {
      if (!exists('knowledge')) throw new Error('Legacy knowledge directory disappeared before replacement');
      const backupEntries = [];
      copyArchive('knowledge', LEGACY_KNOWLEDGE, backupEntries);
      const sourceFiles = walk('knowledge');
      if (sourceFiles.length !== migration.knowledge.length) throw new Error('Legacy knowledge backup has an unexpected file count');
      for (const entry of migration.knowledge) {
        const backupPath = `${LEGACY_KNOWLEDGE}/${entry.old_path.slice('knowledge/'.length)}`;
        if (!exists(backupPath) || sha(read(abs(backupPath))) !== entry.source_sha256) throw new Error(`Legacy knowledge backup verification failed: ${backupPath}`);
      }
    }
    installKnowledgeWithoutRootRename(migration);
    if (exists(STAGING_KNOWLEDGE)) safeDelete(STAGING_KNOWLEDGE);
  }

  if (!hasNewKnowledgeLayout()) throw new Error('Knowledge root swap did not produce the new layout');
  verifyKnowledgeFiles(migration.knowledge);
  for (const archive of migration.archives) {
    const target = abs(archive.archive_path);
    if (!fs.existsSync(target) || sha(read(target)) !== archive.sha256) throw new Error(`Archived source verification failed: ${archive.archive_path}`);
  }
  runIndex();
  const validated = spawnSync(process.execPath, ['scripts/brain.mjs', 'validate'], { cwd: ROOT, encoding: 'utf8' });
  if (validated.status !== 0) throw new Error(`brain validate failed: ${validated.stderr || validated.stdout}`);
  if (!markerExists) atomicWrite(MAP_PATH, `${JSON.stringify(migration, null, 2)}\n`);

  if (exists(LEGACY_KNOWLEDGE)) {
    const sourceFiles = walk(LEGACY_KNOWLEDGE);
    const originalPaths = migration.knowledge.map((item) => `${LEGACY_KNOWLEDGE}/${item.old_path.slice('knowledge/'.length)}`).sort((a, b) => a.localeCompare(b, 'en'));
    if (sourceFiles.length !== originalPaths.length) throw new Error('Legacy knowledge backup file count changed; refusing cleanup');
    const expected = new Map(migration.knowledge.map((item) => [`${LEGACY_KNOWLEDGE}/${item.old_path.slice('knowledge/'.length)}`, item.source_sha256]));
    for (const sourcePath of sourceFiles) if (sha(read(abs(sourcePath))) !== expected.get(sourcePath)) throw new Error(`Legacy knowledge backup changed: ${sourcePath}`);
    safeDelete(LEGACY_KNOWLEDGE);
  }

  for (const oldRoot of ['reports', 'signals', 'feedback', '.state']) {
    const archived = migration.archives.filter((entry) => entry.old_path.startsWith(`${oldRoot}/`)).sort((a, b) => a.old_path.localeCompare(b.old_path, 'en'));
    const sources = walk(oldRoot, true);
    if (sources.length && archived.length !== sources.length) throw new Error(`Legacy archive manifest mismatch: ${oldRoot}`);
    for (let i = 0; i < sources.length; i++) if (sources[i] !== archived[i].old_path || sha(read(abs(sources[i]))) !== archived[i].sha256) throw new Error(`Legacy source changed before cleanup: ${sources[i]}`);
    safeDelete(oldRoot, sources, sources.map((file) => sha(read(abs(file)))));
  }

  const oldAgents = '.codex/agents';
  if (exists(oldAgents)) {
    const oldFiles = walk(oldAgents);
    const skillText = walk('.agents/skills', true).map((file) => read(abs(file)).toString('utf8')).join('\n');
    for (const file of oldFiles) if (skillText.includes(path.basename(file, '.toml'))) throw new Error(`A current Skill still references a legacy agent: ${file}`);
    safeDelete(oldAgents, oldFiles);
  }
  if (exists('.codex') && fs.readdirSync(abs('.codex')).length === 0) fs.rmdirSync(abs('.codex'));
  if (exists('app/viewer/library-index.json')) {
    if (!migration.legacy_library_index_sha256) throw new Error('Legacy library index is not recorded in the migration manifest');
    safeDeleteFile('app/viewer/library-index.json', migration.legacy_library_index_sha256);
  }

  const dailyExpected = [
    'daily/2026/09/28-013303.md',
    'daily/2026/09/28-013311.md',
    'daily/2026/09/29-040611.md'
  ];
  const reportCandidates = [
    { id: 'signals-2026-08-knowledge-review', fingerprint: sha('signals-2026-08:review-possible-knowledge'), origin: 'ai', kind: 'knowledge', status: 'pending', request: 'report/archive/signals/2026/08.md に保存した2件の観測を確認してください。既存knowledgeと比較し、独立して参照する価値があればknowledgeへ整理してください。根拠が弱い場合は候補を保留し、archiveの記録は保持してください。', result: '', created: '2026-11-03', updated: '2026-11-03' },
    { id: 'initial-principle-evidence-threshold', fingerprint: sha('policy:explicit-principle-vs-five-consecutive-support'), origin: 'ai', kind: 'policy', status: 'deferred', request: '現在のpolicyでは、principleは本人の明示した意思または複数の独立した入力で確認できる一貫した考えに基づきます。一方、ideaは関連する人間入力で5回連続支持された場合にprincipleへの昇格対象になります。この2つの関係をどう定めるか、policy判断をお願いします。', result: '人間のpolicy判断待ちとして保留しました。既存knowledgeの支持履歴は推測で補っていません。', created: '2026-11-03', updated: '2026-11-03' }
  ];
  for (const candidate of reportCandidates) {
    const tempFile = path.join(os.tmpdir(), `brain-report-${candidate.id}-${process.pid}.json`);
    fs.writeFileSync(tempFile, JSON.stringify(candidate));
    const result = spawnSync(process.execPath, ['scripts/brain.mjs', 'report-add', tempFile], { cwd: ROOT, encoding: 'utf8' });
    fs.rmSync(tempFile, { force: true });
    if (result.status !== 0) throw new Error(`report-add failed for ${candidate.id}: ${result.stderr}`);
    const reportPath = `report/${candidate.id}.md`;
    const report = parseMarkdown(read(abs(reportPath)));
    const previousEnglishRequests = new Map([
      ['signals-2026-08-knowledge-review', 'Review the two tentative notes archived at report/archive/signals/2026/08.md. Check whether either expresses a distinct, durable idea or user principle, compare against existing knowledge, and keep them as signals if the evidence remains too tentative.'],
      ['initial-principle-evidence-threshold', 'Clarify how the explicit-or-repeated-support principle rule relates to the five-consecutive-related-input idea promotion threshold, especially for an idea that reaches five supports but has no documented transition history. Existing history is unknown and has not been reconstructed.']
    ]);
    if (report.metadata.origin === 'ai' && report.metadata.fingerprint === candidate.fingerprint && report.metadata.request === previousEnglishRequests.get(candidate.id)) {
      report.metadata.request = candidate.request;
      report.metadata.result = candidate.result;
      report.metadata.updated = candidate.updated;
      const content = `---${report.eol}${YAML.stringify(report.metadata).replace(/\n/g, report.eol).trimEnd()}${report.eol}---${report.eol}${report.body}`;
      fs.writeFileSync(abs(reportPath), content);
    }
  }
  const next = spawnSync(process.execPath, ['scripts/brain.mjs', 'next'], { cwd: ROOT, encoding: 'utf8' });
  if (next.status !== 0) throw new Error(`brain next failed: ${next.stderr}`);
  const nextTarget = JSON.parse(next.stdout);
  const dailyStatuses = dailyExpected.map((dailyPath) => {
    const parsed = parseMarkdown(read(abs(dailyPath)));
    return { path: dailyPath, status: parsed.metadata.status };
  });
  const allTargetsProcessed = dailyStatuses.every((daily) => daily.status === 'processed');
  if (nextTarget.kind !== 'daily' || (!dailyExpected.includes(nextTarget.path) && !allTargetsProcessed)) throw new Error(`Expected one of the approved 3 daily targets, got ${JSON.stringify(nextTarget)}`);
  console.log(JSON.stringify({ status: allTargetsProcessed ? 'migration-complete' : 'migration-ready', knowledge: migration.counts.knowledge, archives: migration.counts, daily: dailyStatuses, next: nextTarget }, null, 2));
}

try { migrate(); }
catch (error) { console.error(error.stack ?? error); process.exitCode = 1; }
