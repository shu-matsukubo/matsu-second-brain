---
id: k-4fead23b62fc49b6
title: 利用者が指示書を登録してAI Workflowを拡張する案
type: idea
topic: development-process
topic_label: 開発プロセス
tags:
  - AI Workflow
  - 拡張
  - MCP
updated: 2026-11-07
support_streak: 1
opposition_streak: 0
related:
  - k-1c336721577e40fb
  - k-3953b9c0e4266be4
opposes: []
evidence:
  - source_id: notion:40e013b8-a22b-81ad-b6b3-c7af3d1e91a3
    input_digest: 52e2f9d54ed4fece8bb55e49b1ece4f72eca7a10f9721f657f0a6413d7c8a888
    input_key: legacy-9b1997265ba80a41a29e6176336e0b63bcdcc083ee0524b806c94ca05a090437
    quote: "## AI Workflowの拡張はユーザー登録型にする\r

      \r

      生成方法やレビュー観点を、\r

      プラグイン作者が実装し続ける必要はない。\r

      \r

      利用者が自然言語で指示書を登録し、\r

      Workflowが必要に応じて適用する。\r

      \r

      構成：\r

      \r

      - 登録Skill：自然言語を構造化する\r

      - MCP：指示書の保存・検索・取得を担当する\r

      - Workflow：適用するモジュールを選択する\r

      - Worker / Reviewer：取得した指示を実行する\r

      \r

      登録時には名前・種別・適用条件・概要・\r

      実行指示などへ正規化する。\r

      \r

      一覧では軽量なメタデータのみ返し、\r

      選択後に必要な指示全文を取得する。\r

      \r

      登録された指示は上位の安全制約を上書きできない。\r

      \r

      プラグイン本体は共通Workflowに集中し、\r

      専門的な生成方法や検証方法は利用者が拡張する。"
    occurred_at: 2026-10-24T23:18:37+09:00
    source_ref: daily/2026/10/24-231837.md
    origin: user
    direction: support
    background: 利用者が自然言語で登録した指示書を必要に応じて適用する具体的なWorkflow拡張方式を本人が提示した。役割分担と取得方法、安全制約を備えた構成案への明確な支持として記録し、実装済みの事実や確定した運用とせずideaに保持する。
    counted: true
history: []
sources: []
---
# 内容

利用者が自然言語で生成方法やレビュー観点の指示書を登録し、AI Workflowが必要に応じて選択・適用する拡張案。プラグイン作者が専門的な方法を実装し続ける代わりに、プラグイン本体は共通Workflowに集中し、専門的な生成・検証方法を利用者が追加できるようにする。

登録Skillは自然言語を名前・種別・適用条件・概要・実行指示などへ構造化し、MCPは保存・検索・取得を担当する。Workflowが適用モジュールを選び、Worker / Reviewerが取得した指示を実行する。

一覧では軽量なメタデータだけを返し、選択後に必要な指示全文を取得する。登録された指示は上位の安全制約を上書きできない。これは本人が提示した構成案として保持し、実装・採用済みとは扱わない。

## 関連リンク

- [AIフローでは能力・制御・判断知識を分離する](../../principles/development-process/k-1c336721577e40fb.md)
- [Agentは必要最小限にし専門性は知識で拡張する](../../principles/development-process/k-3953b9c0e4266be4.md)

# 根拠・思考の履歴

- 入力日時（旧dailyの登録日時。会話の発言時刻は未確認）: 2026-10-24T23:18:37+09:00
- 会話参照: daily/2026/10/24-231837.md
- 入力: notion:40e013b8-a22b-81ad-b6b3-c7af3d1e91a3
- 入力キー: legacy-9b1997265ba80a41a29e6176336e0b63bcdcc083ee0524b806c94ca05a090437
- 背景: 旧入力を失わずNotionへ移行した。原文はdailyにも保全している。

本人の原文:

```text
## AI Workflowの拡張はユーザー登録型にする

生成方法やレビュー観点を、
プラグイン作者が実装し続ける必要はない。

利用者が自然言語で指示書を登録し、
Workflowが必要に応じて適用する。

構成：

- 登録Skill：自然言語を構造化する
- MCP：指示書の保存・検索・取得を担当する
- Workflow：適用するモジュールを選択する
- Worker / Reviewer：取得した指示を実行する

登録時には名前・種別・適用条件・概要・
実行指示などへ正規化する。

一覧では軽量なメタデータのみ返し、
選択後に必要な指示全文を取得する。

登録された指示は上位の安全制約を上書きできない。

プラグイン本体は共通Workflowに集中し、
専門的な生成方法や検証方法は利用者が拡張する。
```
