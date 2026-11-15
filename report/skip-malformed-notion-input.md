---
id: skip-malformed-notion-input
fingerprint: user:2026-11-15:skip-malformed-notion-input
origin: user
kind: skill
status: completed
created: 2026-11-15
updated: 2026-11-15
request: 壊れたNotion入力は対応不要などにして処理対象外にし、本人に会話参照の探索・手動補完を求めないようにする。
result: "AGENTS.mdと統合Skillのnotion-input手順を更新。未着手入力の本文JSON欠落・形式不正・必須情報不足等を確認した場合\
  はNotionで対応不要にし、理由・元記録・キーを保持する。取得の失敗・本文省略や処理途中のsnapshot/journal/receiptは除外せず再開\
  対象とする。Notionに対応不要（完了グループ）を追加し、未処理ビューは従来の未処理条件を維持。今回の保留2件（410013b8-a22b-817b-a\
  1e3-cacf12af0046、410013b8-a22b-81c0-98b8-fbec79b28eb7）を対応不要に更新し、原文・本文等の保持と結果を\
  読み戻して確認。収集SkillとChatGPT
  cloud用コピー元プロンプトに全状態のキー照合を明記した。既存スケジュールのプロンプトは変更していない。Skill再評価:
  統合Skillは不備時の分岐、収集Skillは再登録防止を更新。入力整理Skillはstage済み入力だけを扱うため変更不要。CLIは既存の入力検証と再開\
  契約を維持し、変更不要。本人の明示依頼の範囲で方針を変更し、knowledge-policyとknowledgeは変更していない。"
---
