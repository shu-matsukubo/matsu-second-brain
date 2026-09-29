---
title: Git worktreeは独立案の比較に使う
type: principle
topic: Git
tags:
  - Git worktree
  - 案の比較
  - 開発フロー
updated: 2026-09-30
---

# Git worktreeは独立案の比較に使う

Git worktreeは、複数の実装案を作業領域ごと分けて並行に検討するときに使う。日常の開発では、分離が必要な理由がなければ既存workspaceを直接編集する。

worktreeを使うかは習慣で決めず、案を隔離して比較する価値があるかで判断する。

## 関連

- [マルチエージェントの並列度はタスク構造で決める](<../../02-principles/開発プロセス/マルチエージェントの並列度はタスク構造で決める.md>)