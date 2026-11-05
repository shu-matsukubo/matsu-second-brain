---
name: curate-second-brain
description: Notion input・report対応・knowledge評価を優先順に一件処理し、反映とNotion完了通知を安全に再開する。
---

# 第2の脳の統合ワークフロー

## 概要

- 一回につき主対象一件を選び、反映・完了通知・GitHub統合まで進める。
- 選択・検証・適用には[workflow CLI](../../../scripts/brain.mjs)を使う。

## 制約と責務範囲

- 意味判断は[AGENTS.md](../../../AGENTS.md)と[knowledge-policy](../../../knowledge-policy/)に従う。
- Notion接続先は[設定](../../../config/notion-input.json)を参照する。
- Notionのガイドと有効Skillを確認し、全MCP呼出しに現在の`instructions_version`を付ける。
- 取得失敗を対象なしと扱わない。dailyへの切替やsnapshotのすり替えは行わない。
- 主対象の完了時にSkill改善の必要性を確認し、必要な場合だけreportへ提案する。

## フロー

1. [GitHub連携手順](references/github-flow.md)で開始・再開する。
2. `node scripts/brain.mjs next`を実行する。
3. [入力の選択と完了通知](references/notion-input.md)で返却されたkindを処理する。
4. 計画の適用には[CLI契約](../../../docs/workflow-contract.md)を使う。
5. 差分を検証し、GitHub連携手順でPR・CI確認・マージを完了する。
