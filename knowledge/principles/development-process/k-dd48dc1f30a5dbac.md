---
id: k-dd48dc1f30a5dbac
title: 状態管理方式は現在の不変条件で選ぶ
type: principle
topic: development-process
topic_label: 開発プロセス
tags:
  - 状態管理
  - 永続化
  - 設計判断
updated: 2026-10-29
support_streak: 0
opposition_streak: 0
history_status: unknown
related:
  - k-3ddb79c59977a9f0
opposes: []
evidence: []
history: []
sources: []
---

# 状態管理方式は現在の不変条件で選ぶ

将来のデータ量や機能拡張の可能性だけで高機能な永続化方式を先取りせず、現在必要なデータ量、同時実行性、検索性、整合性、更新頻度から最小の方式を選ぶ。

将来の変更に備えるときは、実装を先取りする代わりに永続化の責務と利用側の境界を分け、後から方式を変更できる構造にする。

## 関連

- [長寿命なCoreを短寿命なClientへ依存させない](k-3ddb79c59977a9f0.md)
