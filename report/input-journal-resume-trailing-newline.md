---
id: input-journal-resume-trailing-newline
fingerprint: ef84e385f2d19831ce511a95b8869e2a798d847cc398c374016a020833e7f3e2
origin: ai
kind: failure
status: completed
created: 2026-11-05
updated: 2026-11-05
request: Notion inputのknowledge更新planをresumeすると「knowledge body replacement
  requires previous_body/previous_path
  history」で失敗する。対象knowledge本文の末尾CRLFを含むprevious_bodyがjournal内で末尾LFを失い、置換前本文との完全一致検証を通らない。CLIまたはMarkdown/YAML直列化で本文末尾の改行を保つ修正が必要。
result: "初回applyとjournalからのresumeはいずれもknowledge書き込み前に同じ検証エラーで停止。state/journal.json（nextWrite=0）、state/notion-input.json snapshotを保持。Notion inputは処理中のままで未完了。原因は旧本文が270文字、journalから復元したprevious_bodyが269文字で、末尾CRLFのLFのみ欠落していることを読み取り比較で確認。安全な再開: CLIの改修を明示的に許可された作業で行った後、元のjournalをnode scripts/brain.mjs resumeで再開し、knowledge/indexを検証してからNotion完了更新とinput-ackを行う。元planを再作成・差し替えない。\n\n2026-11-05 復旧完了（本人がこのチャットで実復旧を依頼）。元knowledgeのSHA-256がjournalのexpected_digestと一致し、Notionのcanonical入力記録がsnapshotと一致することを確認。state/recovery/input-journal-resume-trailing-newline/に元journal・snapshot・旧knowledge・修復後journalとrepair.jsonを保全した。history.previous_bodyの末尾で欠けていたLF 1文字だけを復元（269→270文字）し、変更した保存内容に対応するoperation_digest/plan_digestを更新。同じjournalからresumeしてknowledge/indexを生成・検証した。旧本文は末尾CRLFまで完全保存され、この入力のevidenceと支持は1回のみ。Notionを完了に更新し、原文・キー・日時・本文JSONの保持を再取得で確認後、input-ackを実行。active journal/snapshotはCLIの正常終了で解消した。訂正: 現在のyamlライブラリの標準保存・復元では欠落を再現できず、CLI不具合は断定できない。CLIコードやSkillの動作方針は変更していない。欠落を生んだplan作成経路の特定と再発防止は今回の復旧には含めない。"
---
