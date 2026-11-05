---
name: review-knowledge
description: knowledge全体を現在の人間policyと照らして評価し、根拠のある改善候補を重複なくreportへ登録する。knowledge本文はこの手続きでは変更しない。
---

# Knowledge全体を評価する

## 概要

- 統合親から全体評価を割り当てられたときに使う。
- 観測と提案を分け、根拠のある候補をreportへ残す。

## 制約と責務範囲

- [AGENTS.md](../../../AGENTS.md)と[knowledge-policy](../../../knowledge-policy/)に従う。
- 対象は分類・主題分割・根拠と出典・topic・タイトル・安定ID・関連/反対リンク・履歴と昇降格。
- 変更はreportと必要なstateに限る。knowledge本文の修正は後続の処理へ渡す。
- policyの曖昧さは質問として提案する。明示意思と5連続支持の関係を独断で確定しない。
- 履歴不明だけを降格理由にしない。支持数や昇降格履歴を捏造しない。
- 候補はAI由来とし、本人の意思・支持/反対の証拠へ混入させない。

## フロー

1. `node scripts/brain.mjs review-state --input-empty`で入力変更を確認する。未処理ビューが空と確認できた実行だけ`--input-empty`を使う。
2. 変更がなければ終了する。変更があれば全体を評価し、明確な問題から候補化する。
3. Index評価には`npm run index:check`を使う。検証自体の失敗は不整合と断定せず、確認不能として扱う。
4. [候補登録と再開](references/report-candidates.md)で既存reportと照合し、[CLI契約](../../../docs/workflow-contract.md)で登録・再開する。
5. 新規の実行可能候補がなければ`review-complete FINGERPRINT --input-empty`で入力変更待ちにする。
