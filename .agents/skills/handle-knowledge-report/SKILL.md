---
name: handle-knowledge-report
description: 実行可能なreport候補一件を再確認し、承認範囲内でknowledge改善を反映するか、保留・完了・失敗を記録する。
---

# Knowledge reportに対応する

## 概要

- CLIの`next`が選んだreport一件を現在の根拠と照合する。
- 実施・保留・解消済みの判断と結果をreportに残す。

## 制約と責務範囲

- [AGENTS.md](../../../AGENTS.md)と[knowledge-policy](../../../knowledge-policy/)に従う。
- `reopened: true`ならclosed reportも扱う。選ばれていないclosed reportは再試行しない。
- AI由来のknowledge候補も、根拠とpolicyへの適合を確認できれば実施する。
- 追加情報待ち・未承認のpolicy/Skill変更・結果を左右する曖昧点は`deferred`にする。
- 既存意思・背景・出典・履歴を保持し、AI reportを支持数へ含めない。
- 曖昧さを解消するために独断で代替処理へ切り替えない。

## フロー

1. report本体・現在のknowledge・根拠を読み、候補が現在も有効か確認する。
2. 判断に応じて[CLI契約](../../../docs/workflow-contract.md)でreport planを作る。
3. `node scripts/brain.mjs apply PLAN.json`でknowledgeと元reportの結果をまとめて適用する。
4. 内部参照・report結果と実態の一致を確認し、統合親へ返す。
5. Skill改善が必要なら、確認できる例と影響を別reportへ提案する。処理方針の変更には本人の明示指示を要する。
