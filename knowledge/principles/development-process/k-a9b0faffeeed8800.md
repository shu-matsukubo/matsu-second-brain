---
id: k-a9b0faffeeed8800
title: Issueは現在の実装に照合してから設計する
type: principle
topic: development-process
topic_label: 開発プロセス
tags:
  - Issue
  - 設計
  - 実装確認
updated: 2026-08-30
support_streak: 0
opposition_streak: 0
history_status: unknown
related:
  - k-5c5789a9053c209a
  - k-b6bac51054c079bf
  - k-faeac1f2745de751
opposes: []
evidence: []
history: []
sources: []
---

# Issueは現在の実装に照合してから設計する

Issueは作成時点の要求や前提を記録したスナップショットであり、絶対的な仕様とは限らない。IssueからTaskへ進む前に現在のコードを確認し、実装済み、前提の変化、他の変更との競合、Issueの想定が成立しない可能性を検出する。

Issueへの忠実さより、現在の状態との整合性を優先して設計する。

## 関連

- [改善バックログは現在状態から再評価する](k-5c5789a9053c209a.md)
- [AIに設計を依頼するときは現在の構成を共有する](k-b6bac51054c079bf.md)
- [不採用アーキテクチャは前提が変わったら再評価する](k-faeac1f2745de751.md)
