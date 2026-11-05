---
id: k-c7312886320ad33f
title: AIの操作制約はPolicyで結果を制限する
type: principle
topic: development-process
topic_label: 開発プロセス
tags:
  - AIエージェント
  - Policy
  - 実行権限
updated: 2026-10-24
support_streak: 0
opposition_streak: 0
history_status: unknown
related:
  - k-c2677cc313efd69a
opposes: []
evidence: []
history: []
sources: []
---

# AIの操作制約はPolicyで結果を制限する

AIの利用可能なコマンドをすべて列挙するのではなく、変更可能な対象、禁止する状態遷移、必要な事前条件、承認済みscope、公開や不可逆操作の境界など、守るべきPolicyを定義する。

安全な操作では既存ツールの能力を活用し、危険な境界はMCPやHookなど強制可能な実行層で拒否する。能力の数を一律に制限するより、許容できない結果を防ぐ。

## 関連

- [AIセキュリティは入力経路と実行権限をセットで考える](k-c2677cc313efd69a.md)
