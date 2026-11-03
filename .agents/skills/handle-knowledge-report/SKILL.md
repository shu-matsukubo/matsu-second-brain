---
name: handle-knowledge-report
description: 実行可能なreport候補一件を再確認し、承認範囲内でknowledge改善を反映するか、保留・完了・失敗を記録する。
---

# Knowledge reportに対応する

統合ワークフローから割り当てられた一件だけを扱う。`AGENTS.md`、`knowledge-policy/`、report本体、現在のknowledgeを確認し、候補が現在も有効かを根拠と照合する。

## 実行判断

- CLIの`next`が選択した一件だけを扱う。対象はpending、journalがないin_progress、または`reopened: true`で返されたclosed reportを含む。closed statusだけを見て再開対象を除外せず、CLIが選んでいないclosed reportを独断で再試行しない。現在も正しくpolicyに沿い、ユーザーの判断を要しない候補だけ実施する。
- AI由来のknowledge改善候補も、根拠と現在の状態を再確認しpolicyに適合すれば実施できる。AI由来であることだけで人間承認待ちにしない。
- ユーザーが追加情報を求める候補、未承認のpolicy/Skill運用変更、判断で結果が大きく変わる曖昧点は実施せず`deferred`相当で保留し、必要な問いと根拠を残す。
- 不正確・重複・既に解消済みの候補は、その理由と確認した対象をreportに記録して適切な終端状態へ更新する。
- 曖昧さを解消するために無断で代替処理へ切り替えない。処理失敗はfailureとして根拠・影響・再開情報を残す。

## Knowledge変更

有効な候補を反映する場合は、knowledge-policyの分類、根拠、主題分割、topic、リンク、stable ID規則に従い、直接必要な主対象だけを更新する。既存意思や背景・出典・履歴を失わない。人間入力の証拠がない支持/反対や昇降格履歴を追加しない。AI reportは支持数に含めない。

既存knowledgeの本文を要約・訂正して置き換える場合は、`evidence`/`history`/`sources`の既存prefixを変更せず、`history`へ`previous_body`（置換前の本文全文）と`previous_path`（置換前のknowledge path）を含むentryを追記する。単なる移動時のMarkdownリンク先変更は本文保持として扱えるが、core CLIの検証に従う。

変更内容、結果、処理日、対象をoperation planに含め、CLIで検証・適用する。新規reportはCLIのreport-add schemaに従い、`id`、`fingerprint`、`origin`、`kind`、`status`、`request`、`result`、`created`、`updated`を渡す。request/resultはfrontmatterだけを正本として保存し、本文へ重複させない。reportの状態更新はknowledge変更と重複実行されないようCLIのsource digest/重複排除契約を使う。indexをCLIが生成する場合、Skillで重複して更新しない。適用後、内部参照とreport結果が実態に合うことを確認する。

## Skill改善

対応完了時、同種の失敗や反復作業がSkill改善を必要とするか確認する。必要なら、確認できる例と利用への影響を添えて別reportに提案する。Skill自体の処理方針はユーザーの明示指示なしに変更しない。
