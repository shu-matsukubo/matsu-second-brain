---
id: k-f1b6da308d1daaf7
title: エージェントのモデルは責務に応じて選ぶ
type: principle
topic: development-process
topic_label: 開発プロセス
tags:
  - AIエージェント
  - モデル選択
updated: 2026-10-09
support_streak: 0
opposition_streak: 0
history_status: unknown
related:
  - k-1c336721577e40fb
  - k-284229ca7cd4221b
  - k-cff4d20a9bc43e30
  - k-f51a362201719cec
  - k-cace147d56d039c9
opposes: []
evidence: []
history: []
sources: []
---

# エージェントのモデルは責務に応じて選ぶ

複数のAIエージェントを使うとき、すべてに同じ高性能モデルを割り当てる必要はない。各エージェントの責務と作業の難しさに応じてモデルを選ぶと、品質を保ちながらコストと処理時間を抑えられる。

## 選択の目安

- 判断、設計、曖昧な要件の整理には、高性能モデルを使う。
- 手順が明確な実装や反復作業には、軽量モデルを使う。

モデルは役職名やエージェント単位で固定せず、担当するタスクに必要な判断力と出力品質を基準に割り当てる。

Workflowは具体的なモデル名ではなく、必要な能力や役割を指定する。役割とモデルの対応付けはAgent設定に置き、モデルを入れ替えるときにWorkflowの変更を求めない。

## 関連

- [AIフローでは能力・制御・判断知識を分離する](k-1c336721577e40fb.md)
- [上位Agentへの相談は必要時の共通能力にする](k-284229ca7cd4221b.md)
- [AIの実行場所は責務から決める](k-cff4d20a9bc43e30.md)
- [AIエージェントには覚えておく仕事を任せる](k-f51a362201719cec.md)
- [マルチエージェントの並列度はタスク構造で決める](k-cace147d56d039c9.md)
