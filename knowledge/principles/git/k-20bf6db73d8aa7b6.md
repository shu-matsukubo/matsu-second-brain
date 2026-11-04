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
updated: 2026-11-04
support_streak: 1
opposition_streak: 0
history_status: unknown
related:
  - k-cace147d56d039c9
opposes: []
evidence:
  - direction: support
    background: 複数の実装案を比べる際、同じWorking
      Treeを書き換えるのではなく、同じ起点のworktreeへ案ごとに分ける考えを明示した。比較条件を揃え、干渉を防ぎ、状態管理を環境へ持たせることを重視している。
    source_id: daily/2026/10/02-071301.md
    origin: user
    input_digest: ed13f5d05178d7ec5b43a10a02a3ba5c5e877fd9d5e6cbd230272f7daf30ab6d
    counted: true
history:
  - from: principle
    to: principle
    at: 2026-11-04
    reason: 人間のdailyから、同一起点のworktreeで案を隔離する利点と比較時の状態管理を補足した。
sources: []
---

# Git worktreeは独立案の比較に使う

Git worktreeは、複数の実装案を作業領域ごと分けて並行に検討するときに使う。日常の開発では、分離が必要な理由がなければ既存workspaceを直接編集する。

worktreeを使うかは習慣で決めず、案を隔離して比較する価値があるかで判断する。

## 関連

- [マルチエージェントの並列度はタスク構造で決める](../development-process/k-cace147d56d039c9.md)

実装案を比較するときは、同じ起点から案ごとのworktreeを用意する。作業の干渉を防いで同じ条件で比較でき、比較状態を人の記憶ではなく作業環境に保持できる。
