import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { hash } from './lib/notion-input.mjs';

const root = process.cwd();
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => item.isDirectory() ? walk(path.join(dir, item.name)) : item.isFile() && item.name.endsWith('.md') ? [path.join(dir, item.name)] : []);
const pages = [];
for (const file of walk(path.join(root, 'daily'))) {
  const raw = fs.readFileSync(file, 'utf8'), match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) continue;
  const meta = YAML.parse(match[1]);
  if (meta.status !== 'new') continue;
  const source_ref = path.relative(root, file).replaceAll('\\', '/'), quote = raw.slice(match[0].length).trim();
  const key = `legacy-${hash(`${source_ref}\n${quote}`)}`;
  const value = meta.created ?? meta.created_at ?? meta['登録日時'];
  const date = value ? String(value).replace(' ', 'T') : source_ref.replace(/^daily\/(\d{4})\/(\d{2})\/(\d{2})-(\d{2})(\d{2})(\d{2})\.md$/, '$1-$2-$3T$4:$5:$6');
  const at = date.length === 10 ? date : /(?:Z|[+-]\d{2}:\d{2})$/.test(date) ? date : `${date}+09:00`;
  if (!Number.isFinite(Date.parse(at)) || !quote) throw new Error(`legacy input lacks valid date/body: ${source_ref}`);
  pages.push({ path: source_ref, digest: hash(raw), properties: { '名前': String(meta.title ?? meta['タイトル'] ?? quote.split('\n')[0]).slice(0, 100), '状態': '未処理', '入力キー': key, '入力元': 'legacy-daily', 'date:発言日時:start': at, 'date:発言日時:is_datetime': at.length > 10 ? 1 : 0, '原文': quote, '要約': '旧dailyからの移行。原文を読み、本人の意思を整理する。', '背景': '旧入力を失わずNotionへ移行した。原文はdailyにも保全している。', '会話参照': source_ref } });
}
for (const item of pages) {
  const at = item.properties['date:発言日時:start'];
  item.properties['発言順'] = new Date(at.length === 10 ? `${at}T00:00:00+09:00` : at).toISOString();
}
console.log(JSON.stringify(pages));
