---
title: Review単位とIntegration単位を分ける
type: principle
topic: 開発プロセス
tags:
  - レビュー
  - 統合
  - Requirement
  - Task
updated: 2026-09-02
---

# Review単位とIntegration単位を分ける

小さくレビューしたい単位と、システムへ統合したい意味的な単位は同じとは限らない。Taskを実装・レビュー・検証の単位として小さく保ち、Requirementを統合とAcceptance Criteria確認の単位として扱う。

複数のTaskを上位の意味単位で一度統合してからmainlineへ入れることで、レビュー性、変更理由の追跡性、要求単位の競合解決、mainline履歴の意味的なまとまりを両立する。
