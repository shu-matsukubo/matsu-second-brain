---
id: k-faeac1f2745de751
title: 不採用アーキテクチャは前提が変わったら再評価する
type: principle
topic: development-process
topic_label: 開発プロセス
tags:
  - アーキテクチャ
  - 設計判断
  - 前提条件
updated: 2026-10-05
support_streak: 0
opposition_streak: 0
history_status: unknown
related:
  - k-a9b0faffeeed8800
opposes: []
evidence: []
history: []
sources: []
---

# 不採用アーキテクチャは前提が変わったら再評価する

以前不採用にした構成は、その判断理由となった制約が解消されたときに再評価する。

専用Integrationの必要性、APIへのアクセス可否、認証方式、利用可能な環境など、判断を制約した条件を記録する。標準プロトコルや共通インターフェースが使えるようになるなど、前提が変わった場合は、過去の結論をそのまま適用せず現在の条件で判断し直す。

## 関連

- [Issueは現在の実装に照合してから設計する](k-a9b0faffeeed8800.md)
