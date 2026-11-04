import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import readline from 'node:readline';
import { pathToFileURL } from 'node:url';
import { hash } from './lib/notion-input.mjs';

export function dayWindow(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day))) throw new Error('day must be YYYY-MM-DD');
  const start = Date.parse(`${day}T00:00:00+09:00`);
  return { start, end: start + 86400000 };
}
function files(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((item) => item.isSymbolicLink() ? [] : item.isDirectory() ? files(path.join(dir, item.name)) : item.name.endsWith('.jsonl') ? [path.join(dir, item.name)] : []);
}
export async function collectMessages(dir, day) {
  const { start, end } = dayWindow(day), messages = new Map(), errors = [];
  for (const file of files(dir)) {
    if (fs.statSync(file).mtimeMs < start) continue;
    const lines = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });
    let session = null, lineNumber = 0;
    try {
      for await (const line of lines) {
        lineNumber++;
        let event;
        try { event = JSON.parse(line); } catch { errors.push({ file: path.basename(file), line: lineNumber, reason: 'invalid JSON' }); continue; }
        if (event.type === 'session_meta') {
          session = event.payload;
          if (!['vscode', 'cli'].includes(session.source) || session.thread_source && session.thread_source !== 'user') break;
        }
        if (!session) continue;
        let quote, timestamp = event.timestamp, originalId;
        if (event.type === 'event_msg' && event.payload?.type === 'user_message') quote = event.payload.message;
        else if (event.type === 'response_item' && event.payload?.type === 'message' && event.payload.role === 'user') {
          const meta = event.payload.internal_chat_message_metadata_passthrough;
          quote = (event.payload.content ?? []).filter((part, i) => part.type === 'input_text' && (!meta || meta.content_item_metadata?.[i]?.provenance?.type === 'user' && meta.content_item_kinds?.[i] === 'user.text')).map((part) => part.text).join('\n');
          if (typeof meta?.create_time === 'number') timestamp = new Date(meta.create_time * 1000).toISOString();
          originalId = event.payload.id;
        } else continue;
        const at = Date.parse(timestamp);
        if (!(at >= start && at < end) || typeof quote !== 'string' || !quote.trim()) continue;
        if (/^\s*(?:# AGENTS\.md instructions|<environment_context>|<external_codex_apps_open_page>)/.test(quote)) continue;
        const source_ref = session.id;
        if (typeof source_ref !== 'string') continue;
        const message_id = originalId ?? hash(`${source_ref}\n${timestamp}\n${quote}`);
        const dedupe = originalId ?? hash(`${timestamp}\n${quote}`);
        if (!messages.has(dedupe)) messages.set(dedupe, { source: 'codex', source_ref, message_id, occurred_at: timestamp, quote });
      }
    } finally { lines.close(); }
  }
  return { day, timezone: 'Asia/Tokyo', messages: [...messages.values()].sort((a, b) => a.occurred_at.localeCompare(b.occurred_at) || a.message_id.localeCompare(b.message_id)), errors };
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const arg = (name) => { const i = process.argv.indexOf(name); return i < 0 ? undefined : process.argv[i + 1]; };
  const day = arg('--day') ?? new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() - 86400000));
  const result = await collectMessages(arg('--sessions') ?? path.join(os.homedir(), '.codex', 'sessions'), day);
  const output = arg('--out');
  if (!output) throw new Error('--out requires a temporary file outside the repository; raw conversation dumps are not repository assets');
  const resolved = path.resolve(output), repo = path.resolve(path.dirname(process.argv[1]), '..');
  if (resolved === repo || resolved.startsWith(repo + path.sep)) throw new Error('raw conversation output must stay outside the repository');
  fs.writeFileSync(resolved, JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ day, messages: result.messages.length, errors: result.errors.length, output: resolved }));
  if (result.errors.length) process.exitCode = 1;
}
