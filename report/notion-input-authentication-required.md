---
id: notion-input-authentication-required
fingerprint: curate-notion-pending-view-mcp-authentication-required
origin: ai
kind: failure
status: pending
created: 2026-11-07
updated: 2026-11-07
request: 2026-11-07の整理実行で、Notion
  MCPの未処理ビュー取得が再認証要求で停止した。CodexのNotion接続を再認証し、同じ未処理ビューを取得できるか確認する。
result: CLIはinput_fetchを返した。Notion
  MCPのquery_data_sourcesが認証を要求したため、入力の有無は未確認。knowledge、index、入力snapshot、Notionの処理状態は未変更。再認証後はCLIのnextから再開し、設定済みの未処理ビューを取得する。取得成功を確認した時点でこの障害を完了にする。
---
