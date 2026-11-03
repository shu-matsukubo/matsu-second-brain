---
id: k-20bf6db73d8aa7b6
title: Git worktreeは独立案の比較に使う
type: principle
topic: git
topic_label: Git
tags:
  - Git worktree
  - 案の比較
  - 開発フロー
updated: 2026-09-30
support_streak: 0
opposition_streak: 0
history_status: unknown
related:
  - k-cace147d56d039c9
opposes: []
evidence: []
history: []
sources: []
---

# Git worktreeは独立案の比較に使う

Git worktreeは、複数の実装案を作業領域ごと分けて並行に検討するときに使う。日常の開発では、分離が必要な理由がなければ既存workspaceを直接編集する。

worktreeを使うかは習慣で決めず、案を隔離して比較する価値があるかで判断する。

## 関連

- [マルチエージェントの並列度はタスク構造で決める](../development-process/k-cace147d56d039c9.md)