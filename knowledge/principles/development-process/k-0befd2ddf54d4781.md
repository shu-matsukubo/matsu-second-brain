---
id: k-0befd2ddf54d4781
title: Workflowの状態は既存成果物から導出する
type: principle
topic: development-process
topic_label: 開発プロセス
tags:
  - Workflow設計
  - 状態管理
updated: 2026-11-05
support_streak: 1
opposition_streak: 0
related:
  - k-1c336721577e40fb
opposes: []
evidence:
  - source_id: notion:40e013b8-a22b-8164-833d-effabbf6908a
    input_digest: 56e6853dd807682c277d00cda1f9b844c864848a1524fe1a17b84aabfa110a15
    origin: user
    direction: support
    background: 本人は、進捗を既存成果物から導出し、上位Workflowを既存手順の薄い制御層にする方針を述べた。
    counted: true
    quote: "## Workflowの状態は既存成果物から導出する\r

      \r

      Workflowの進捗管理だけを目的に、\r

      新しいラベルやステータスを増やさない。\r

      \r

      まず、\r

      \r

      - PR\r

      - Branch\r

      - Commit\r

      - 作業記録\r

      \r

      など、処理の結果として自然に存在する事実から\r

      現在状態を導出できないか考える。\r

      \r

      例えば、\r

      \r

      Open PRが存在する\r

      → 実装済み・レビュー待ち\r

      \r

      と判断できるなら、\r

      「レビュー待ち」ラベルを別途管理しない。\r

      \r

      同じ状態を複数箇所へ保存すると、\r

      それらの同期と不整合処理が新しい責務になる。\r

      \r

      状態を保存する前に、\r

      既存の事実から計算できないか確認する。\r

      \r

      また、定期実行などの上位Workflowは\r

      既存の実装・レビュー手順を再実装せず、\r

      処理順と停止条件だけを持つ薄い\r

      Orchestration Layerとして設計する。"
    occurred_at: 2026-10-08T00:44:12+09:00
    source_ref: daily/2026/10/08-004412.md
    input_key: legacy-f6be3cb68d682f3ccb7015c81d36bd1ae989d698643976bc3c483a4abeabb039
history:
  - from: principle
    to: principle
    at: 2026-11-05
    reason: 旧dailyの登録日時を会話の発言時刻と混同しない表記にした。
    previous_body: |
      # 内容

      Workflowの進捗はPR・Branch・Commit等の既存成果物から導出し、同じ状態を表すラベルやステータスを重ねて管理しない。

      ## 関連リンク

      - [AIフローでは能力・制御・判断知識を分離する](k-1c336721577e40fb.md)

      # 根拠・思考の履歴

      - 発言日時: 2026-10-08T00:44:12+09:00
      - 会話参照: daily/2026/10/08-004412.md
      - 入力: notion:40e013b8-a22b-8164-833d-effabbf6908a

      本人の原文:

      ```text
      ## Workflowの状態は既存成果物から導出する

      Workflowの進捗管理だけを目的に、
      新しいラベルやステータスを増やさない。

      まず、

      - PR
      - Branch
      - Commit
      - 作業記録

      など、処理の結果として自然に存在する事実から
      現在状態を導出できないか考える。

      例えば、

      Open PRが存在する
      → 実装済み・レビュー待ち

      と判断できるなら、
      「レビュー待ち」ラベルを別途管理しない。

      同じ状態を複数箇所へ保存すると、
      それらの同期と不整合処理が新しい責務になる。

      状態を保存する前に、
      既存の事実から計算できないか確認する。

      また、定期実行などの上位Workflowは
      既存の実装・レビュー手順を再実装せず、
      処理順と停止条件だけを持つ薄い
      Orchestration Layerとして設計する。
      ```
    previous_path: knowledge/principles/development-process/k-0befd2ddf54d4781.md
sources:
  - source_id: notion:40e013b8-a22b-8164-833d-effabbf6908a
    occurred_at: 2026-10-08T00:44:12+09:00
    source_ref: daily/2026/10/08-004412.md
---
# 内容

Workflowの進捗はPR・Branch・Commit等の既存成果物から導出し、同じ状態を表すラベルやステータスを重ねて管理しない。

## 関連リンク

- [AIフローでは能力・制御・判断知識を分離する](k-1c336721577e40fb.md)

# 根拠・思考の履歴

- 入力日時（旧dailyの登録日時。会話の発言時刻は未確認）: 2026-10-08T00:44:12+09:00
- 会話参照: daily/2026/10/08-004412.md
- 入力: notion:40e013b8-a22b-8164-833d-effabbf6908a

本人の原文:

```text
## Workflowの状態は既存成果物から導出する

Workflowの進捗管理だけを目的に、
新しいラベルやステータスを増やさない。

まず、

- PR
- Branch
- Commit
- 作業記録

など、処理の結果として自然に存在する事実から
現在状態を導出できないか考える。

例えば、

Open PRが存在する
→ 実装済み・レビュー待ち

と判断できるなら、
「レビュー待ち」ラベルを別途管理しない。

同じ状態を複数箇所へ保存すると、
それらの同期と不整合処理が新しい責務になる。

状態を保存する前に、
既存の事実から計算できないか確認する。

また、定期実行などの上位Workflowは
既存の実装・レビュー手順を再実装せず、
処理順と停止条件だけを持つ薄い
Orchestration Layerとして設計する。
```
