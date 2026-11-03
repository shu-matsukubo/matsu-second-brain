---
id: k-cff4d20a9bc43e30
title: AIの実行場所は責務から決める
type: principle
topic: development-process
topic_label: 開発プロセス
tags:
  - AIエージェント
  - 実行環境
  - 最小権限
updated: 2026-08-30
support_streak: 0
opposition_streak: 0
history_status: unknown
related:
  - k-f1b6da308d1daaf7
  - k-c2677cc313efd69a
opposes: []
evidence: []
history: []
sources: []
---

# AIの実行場所は責務から決める

AI処理をCloudかLocalかで一律に決めず、担当する責務と必要な制約から実行場所を選ぶ。

## 判断の基準

- ネットワーク権限
- ローカルコンテキストへのアクセス
- セキュリティ境界
- 自動化の必要性

実装はLocal、限定的なレビューや集計はCloudのように、責務ごとに必要最小限の権限を持つ環境へ配置する。

## 関連

- [エージェントのモデルは責務に応じて選ぶ](k-f1b6da308d1daaf7.md)
- [AIセキュリティは入力経路と実行権限をセットで考える](k-c2677cc313efd69a.md)
