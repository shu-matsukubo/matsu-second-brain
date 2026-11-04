---
id: input-journal-resume-trailing-newline
fingerprint: ef84e385f2d19831ce511a95b8869e2a798d847cc398c374016a020833e7f3e2
origin: ai
kind: failure
status: pending
created: 2026-11-05
updated: 2026-11-05
request: Notion inputのknowledge更新planをresumeすると「knowledge body replacement
  requires previous_body/previous_path
  history」で失敗する。対象knowledge本文の末尾CRLFを含むprevious_bodyがjournal内で末尾LFを失い、置換前本文との完全一致検証を通らない。CLIまたはMarkdown/YAML直列化で本文末尾の改行を保つ修正が必要。
result: "初回applyとjournalからのresumeはいずれもknowledge書き込み前に同じ検証エラーで停止。state/journal.j\
  son（nextWrite=0）、state/notion-input.json snapshotを保持。Notion
  inputは処理中のままで未完了。原因は旧本文が270文字、journalから復元したprevious_bodyが269文字で、末尾CRLFのLFのみ欠落\
  していることを読み取り比較で確認。安全な再開: CLIの改修を明示的に許可された作業で行った後、元のjournalをnode
  scripts/brain.mjs
  resumeで再開し、knowledge/indexを検証してからNotion完了更新とinput-ackを行う。元planを再作成・差し替えない。"
---
