---
name: input-to-knowledge
description: Notion input一件をknowledgeへ整理し、末尾に本人の発言履歴を残して完了状態へ進める。
---

# Notion inputをknowledgeへ反映する

## 概要

- 統合親から渡された一件を既存knowledgeへ統合する。
- 独立して参照する価値がある主題は別ノートに分ける。

## 制約と責務範囲

- [AGENTS.md](../../../AGENTS.md)と[knowledge-policy](../../../knowledge-policy/)に従う。
- 本人の希望・比較・否定・保留・決定を確度のまま整理する。
- 未確定の感想・疑問はideaとし、AIの推測を加えない。
- 外部事実は一次情報で確認し、factsへ分けて内部リンクする。一次出典URLはfacts末尾へ置く。
- 曖昧な意思は支持・反対に計数しない。
- Notion完了更新とローカルackは統合親が行う。

## フロー

1. [対象範囲の判断基準](../curate-second-brain/references/input-scope.md)で再確認する。対象外・関係不明なら親へ保留理由を返す。
2. Notionを再取得し、本文JSONから作るsnapshotを`node scripts/brain.mjs input-verify SNAPSHOT.json`で照合する。
3. 主題ごとの既存knowledgeを確認し、[CLI契約](../../../docs/workflow-contract.md)でinput planを作る。
4. `node scripts/brain.mjs apply PLAN.json`で適用する。journalが残った失敗は`resume`で再開する。
5. 統合親へ反映結果を返す。保存対象がない場合も理由を返す。
