import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { marked } from 'marked';
import GithubSlugger from 'github-slugger';
import YAML from 'yaml';

const sections = ['概要', '制約と責務範囲', 'フロー'];
const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/;
const plain = (tokens) => tokens.map((token) => token.tokens ? plain(token.tokens) : token.type === 'html' ? '' : token.text ?? '').join('');

function markdown(source) {
  const tokens = marked.lexer(source.replace(frontmatter, ''));
  const headings = [], links = [];
  const slugger = new GithubSlugger();
  marked.walkTokens(tokens, (token) => {
    if (token.type === 'heading') headings.push({ depth: token.depth, title: plain(token.tokens), anchor: slugger.slug(plain(token.tokens)) });
    if (token.type === 'link' || token.type === 'image') links.push(token.href);
  });
  return { headings, links };
}

function filesIn(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`symlink is not a Skill resource: ${file}`);
    return entry.isDirectory() ? filesIn(file) : [file];
  }).sort();
}

/** Read-only checks; semantic decisions and external URL availability remain review work. */
export function checkSkills(root = process.cwd(), targets) {
  root = fs.realpathSync(root);
  const errors = [], resources = [], entries = [];
  const display = (file) => path.relative(root, file).replaceAll('\\', '/');
  const error = (file, message) => errors.push(`${display(file)}: ${message}`);
  const within = (file) => file === root || (!path.relative(root, file).startsWith(`..${path.sep}`) && path.relative(root, file) !== '..' && !path.isAbsolute(path.relative(root, file)));
  const skillRoot = path.join(root, '.agents', 'skills');
  if (targets) {
    for (const target of targets) {
      let file = path.resolve(root, target);
      if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'SKILL.md');
      entries.push(file);
    }
  } else {
    if (!fs.existsSync(skillRoot)) errors.push('.agents/skills: no Skills found');
    else for (const directory of fs.readdirSync(skillRoot, { withFileTypes: true })) {
      const folder = path.join(skillRoot, directory.name);
      if (directory.isSymbolicLink()) { error(folder, 'symlink is not a Skill directory'); continue; }
      if (!directory.isDirectory()) continue;
      entries.push(path.join(folder, 'SKILL.md'));
      try { resources.push(...filesIn(folder)); } catch (cause) { error(folder, cause.message); }
    }
    if (!entries.length && !errors.length) errors.push('.agents/skills: no Skills found');
  }
  const parsed = new Map();
  function load(file) {
    if (parsed.has(file)) return parsed.get(file);
    try {
      const source = fs.readFileSync(file, 'utf8');
      const result = { source, ...markdown(source) };
      parsed.set(file, result);
      return result;
    } catch (cause) { error(file, `cannot read Markdown: ${cause.message}`); return null; }
  }
  for (const file of entries) {
    if (!within(file)) { error(file, 'Skill must be inside the repository'); continue; }
    const doc = load(file);
    if (!doc) continue;
    const front = frontmatter.exec(doc.source);
    if (!front) error(file, 'YAML frontmatter is required');
    else {
      try {
        const meta = YAML.parse(front[1], { uniqueKeys: true });
        if (!meta || typeof meta !== 'object' || Array.isArray(meta)) throw new Error('metadata must be an object');
        if (typeof meta.name !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(meta.name) || meta.name.length > 64 || meta.name !== path.basename(path.dirname(file))) error(file, 'name must match the directory and use a lowercase slug of at most 64 characters');
        if (typeof meta.description !== 'string' || !meta.description.trim() || meta.description.length > 1024) error(file, 'description must contain 1–1024 characters');
      } catch (cause) { error(file, `invalid YAML: ${cause.message}`); }
    }
    if (doc.headings.filter((h) => h.depth === 1).length !== 1) error(file, 'exactly one title is required');
    if (JSON.stringify(doc.headings.filter((h) => h.depth === 2).map((h) => h.title)) !== JSON.stringify(sections)) error(file, `sections must be ${sections.join(' → ')}`);
  }

  const edges = new Map(), visited = new Set();
  const queue = [...entries.filter(within)];
  if (!targets) {
    for (const file of ['README.md', 'app/viewer/README.md']) if (fs.existsSync(path.join(root, file))) queue.push(path.join(root, file));
    const docs = path.join(root, 'docs');
    if (fs.existsSync(docs)) queue.push(...filesIn(docs).filter((file) => file.endsWith('.md')));
  }
  while (queue.length) {
    const file = queue.shift();
    if (visited.has(file)) continue;
    visited.add(file);
    edges.set(file, []);
    const doc = load(file);
    if (!doc) continue;
    for (const destination of doc.links) {
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(destination)) continue;
      try {
        const hashAt = destination.indexOf('#');
        const rawPath = (hashAt < 0 ? destination : destination.slice(0, hashAt)).split('?')[0];
        const fragment = hashAt < 0 ? '' : decodeURIComponent(destination.slice(hashAt + 1));
        const target = rawPath ? path.resolve(path.dirname(file), decodeURIComponent(rawPath)) : file;
        if (!within(target)) throw new Error('link escapes the repository');
        const stat = fs.statSync(target);
        if (!within(fs.realpathSync(target))) throw new Error('link resolves outside the repository');
        edges.get(file).push(target);
        if (fragment) {
          if (!stat.isFile() || !target.endsWith('.md')) throw new Error('anchor target must be Markdown');
          const targetDoc = load(target);
          if (targetDoc && !targetDoc.headings.some((h) => h.anchor === fragment)) throw new Error(`missing anchor #${fragment}`);
        }
        // Inspect linked Markdown recursively, without treating code examples as links.
        if (stat.isFile() && target.endsWith('.md')) queue.push(target);
      } catch (cause) { error(file, `invalid local link ${destination}: ${cause.message}`); }
    }
  }
  const reached = new Set(), pending = [...entries];
  while (pending.length) {
    const file = pending.pop();
    if (reached.has(file)) continue;
    reached.add(file);
    pending.push(...edges.get(file) ?? []);
  }
  if (!targets) for (const file of resources) if (!reached.has(file)) error(file, 'resource is not reachable from a Skill entrypoint');
  return { errors, skills: entries.length, documents: visited.size };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    const result = checkSkills(process.cwd(), process.argv.length > 2 ? process.argv.slice(2) : undefined);
    if (result.errors.length) { console.error(result.errors.join('\n')); process.exitCode = 1; }
    else console.log(`Skills: ${result.skills}, Markdown documents: ${result.documents} — OK`);
  } catch (cause) { console.error(cause.message); process.exitCode = 1; }
}
