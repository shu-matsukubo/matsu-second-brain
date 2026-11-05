---
name: collect-conversation-input
description: 前日のCodex会話から開発に直接関係する本人の意思だけを抽出し、Notion inputへ重複なく登録する。knowledge整理は行わない。
---

# 会話からNotion inputへ収集する

## 概要

- Asia/Tokyoの前日00:00以上、当日00:00未満の本人発言を収集する。
- 一発言を一inputとし、発言内の複数の意思をまとめる。

## 制約と責務範囲

- [対象範囲の判断基準](../curate-second-brain/references/input-scope.md)に従う。
- AI回答・引用・例示・第三者の意見を本人の意思へ置き換えない。
- 原文は開発部分だけをそのまま抜粋し、確度・条件・肯定/否定を保つ。
- 背景は前後の本人発言から補う。推定しかできなければ不足を報告する。
- 秘密情報・対象外の内容・会話全文を保存しない。
- knowledge整理と既存inputの変更は担当しない。

## フロー

1. Notionのガイドと有効Skillを確認し、全MCP呼出しに現在の`instructions_version`を付ける。
2. `node scripts/collect-codex-inputs.mjs --day YYYY-MM-DD --out <OSのtempのJSON>`を実行する。
3. 同じshell呼出しで出力を読み、終了コードと`errors`を確認する。未知のログ形式へ対象を広げない。
4. 対象範囲に合う発言を選び、[Notion登録手順](references/notion-registration.md)で照合・作成・読み戻しを行う。
5. 対象期間、追加・重複・対象外の件数、取得不能な範囲を報告する。取得失敗を候補なしと扱わない。
