import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { checkSkills } from '../check-skills.mjs';

const source = (body = '') => `---\nname: example\ndescription: Use when processing an example.\n---\n# Example\n\n## 概要\n\n- Process an example.\n\n## 制約と責務範囲\n\n- Keep the input.\n\n## フロー\n\n1. Read the input.\n${body}`;
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brain-skills-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (file, content) => { const target = path.join(root, file); fs.mkdirSync(path.dirname(target), { recursive: true }); fs.writeFileSync(target, content); };
  write('.agents/skills/example/SKILL.md', source());
  return { root, write, skill: '.agents/skills/example/SKILL.md' };
}

test('follows reference links and cycles, handles encoded paths, duplicate anchors and fenced examples', (t) => {
  const { root, write, skill } = fixture(t);
  write(skill, source('[details][ref]\n\n[ref]: <references/a%20b.md#同じ見出し-1>\n\n```md\n[example](absent.md)\n```'));
  write('.agents/skills/example/references/a b.md', '# 同じ見出し\n# 同じ見出し\n\n[entry](../SKILL.md)\n[helper](../scripts/helper.mjs)\n');
  write('.agents/skills/example/scripts/helper.mjs', 'export const value = 1;');
  assert.deepEqual(checkSkills(root).errors, []);
});

test('rejects broken paths, missing anchors, malformed escapes and unreachable resources', (t) => {
  const { root, write, skill } = fixture(t);
  write(skill, source('[missing](missing.md)\n[anchor](references/detail.md#absent)\n[bad](%ZZ.md)'));
  write('.agents/skills/example/references/detail.md', '# Detail');
  write('.agents/skills/example/references/orphan.md', '# Orphan');
  write('README.md', '[orphan](.agents/skills/example/references/orphan.md)');
  const errors = checkSkills(root).errors.join('\n');
  assert.match(errors, /missing.md/);
  assert.match(errors, /missing anchor #absent/);
  assert.match(errors, /%ZZ.md/);
  assert.match(errors, /orphan.md: resource is not reachable/);
});

test('validates YAML, identity, required structure and nonzero CLI failures', (t) => {
  const { root, write, skill } = fixture(t);
  write(skill, source().replace('name: example', 'name: wrong\nname: duplicate'));
  assert.match(checkSkills(root).errors.join('\n'), /invalid YAML/);
  write(skill, source().replace('name: example', 'name: Other').replace('description: Use when processing an example.', 'description: []').replace('## フロー', '## 概要'));
  const errors = checkSkills(root).errors.join('\n');
  assert.match(errors, /name must match/);
  assert.match(errors, /description/);
  assert.match(errors, /sections must/);
  const run = spawnSync(process.execPath, [path.resolve('scripts/check-skills.mjs')], { cwd: root, encoding: 'utf8' });
  assert.equal(run.status, 1);
  assert.match(run.stderr, /sections must/);
});

test('checks README and docs links and rejects links outside the repository', (t) => {
  const { root, write } = fixture(t);
  write('README.md', '[guide](docs/guide.md#手順)\n[outside](../outside.md)');
  write('docs/guide.md', '# 手順\n[broken](missing.md)');
  const errors = checkSkills(root).errors.join('\n');
  assert.match(errors, /link escapes the repository/);
  assert.match(errors, /docs\/guide.md: invalid local link missing.md/);
});

test('requires a Skill entrypoint and supports checking one Skill directory', (t) => {
  const { root, write, skill } = fixture(t);
  write('.agents/skills/incomplete/notes.md', '# Notes');
  assert.match(checkSkills(root).errors.join('\n'), /incomplete\/SKILL.md: cannot read/);
  assert.deepEqual(checkSkills(root, [path.dirname(skill)]).errors, []);
  assert.match(checkSkills(root, ['../elsewhere/SKILL.md']).errors.join('\n'), /inside the repository/);
});
