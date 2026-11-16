---
id: notion-input-authentication-required
fingerprint: curate-notion-pending-view-mcp-authentication-required
origin: ai
kind: failure
status: completed
created: 2026-11-07
updated: 2026-11-16
request: 2026-11-07の整理実行で、Notion
  MCPの未処理ビュー取得が再認証要求で停止した。CodexのNotion接続を再認証し、同じ未処理ビューを取得できるか確認する。
result: |-
  CLIはinput_fetchを返した。Notion MCPのquery_data_sourcesが認証を要求したため、入力の有無は未確認。knowledge、index、入力snapshot、Notionの処理状態は未変更。再認証後はCLIのnextから再開し、設定済みの未処理ビューを取得する。取得成功を確認した時点でこの障害を完了にする。

  2026-11-16T08:46Z 再確認: 現在のNotion接続で、config/notion-input.jsonに設定された同じ未処理ビュー view://40e013b8-a22b-8117-acf4-000c9b287c13 をquery_data_sources（mode: view、page_size: 1、instructions_version: 0.0.6）で取得できた。resultsは空配列、has_moreはfalseで、認証要求や取得エラーは発生していない。接続先データソース collection://d632624f-58fe-4b86-9a83-5d0d5aba12f1 のfetchも成功し、入力キューのスキーマを確認した。したがって、このレポートが対象とする2026-11-07の未処理ビュー取得障害は解消済みとして完了にする。今回、再認証操作や接続設定変更は行っていない。

  未処理入力がないことを取得結果で確認したうえで、この障害レポート一件だけを処理した。Notionページ、knowledge、入力snapshot、receiptには変更していない。今後の通信・認証・取得失敗をデータ不備や対象なしと扱わず、既存の失敗・再開手順に従う。入力記録の不備を対応不要にする方針とは区別する。Skill改善の追加提案は不要。
---
