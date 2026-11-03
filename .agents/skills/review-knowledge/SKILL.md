---
name: review-knowledge
description: knowledge全体を現在の人間policyと照らして評価し、根拠のある改善候補を重複なくreportへ登録する。knowledge本文はこの手続きでは変更しない。
---

# Knowledge全体を評価する

統合ワークフローからknowledge全体の探索を割り当てられたときに使う。`AGENTS.md`と`knowledge-policy/`を基準に評価し、レポートは観測と提案を分ける。policyが曖昧ならルールを補わず、曖昧な判断そのものをreport候補にする。

## 評価範囲

- facts/principles/ideasの分類、主題の独立性、根拠と出典、topicの一貫性、タイトル、安定ID、関連/反対リンク、履歴と昇降格の根拠を確認する。
- まず明確に確認できる問題を探し、全件を一括改修しない。個々のknowledge修正は後続のreport対応または明示されたdaily処理で行う。
- principleとideaの意味分類で「明示された意思/複数の独立入力」と「5連続支持による昇格」の関係など、現行policy・実装だけで確定できない点は誤りとして断定しない。人間判断が必要なreportへ提案する。
- 既存履歴が不足している場合は不明とし、過去の支持回数や昇降格を捏造しない。履歴不明のみを理由にknowledgeを降格候補にしない。
- Indexの同期を評価する場合は`node app/viewer/scripts/generate-index.ts --check`で非破壊検証する。検証失敗をIndexの不整合と断定せず、確認不能として扱う。knowledge変更の適用時はcore CLIがindexを生成するため、別途生成しない。

## 候補登録

1. 問題ごとに対象ID/パス、現在の証拠、policyとの差、影響、提案する次の確認または修正を特定する。
2. active/archiveを含む既存reportのstable ID/fingerprintと照合して、同じ改善を重複追加しない。既知で未承認のpolicy/Skill提案だけが残り新規の実行可能候補がない場合は既存reportを保ち、review-completeで入力変更を待つ。新しい根拠で同じcompleted問題が再発した場合は同じreport path/IDのままstatusをpendingへ戻し、新しい根拠をresultへ追記しupdatedを更新するoperation planを作る。request/bodyは保持し、CLIが後で同IDを再選択できるようにする。人間によるrequest/body変更はCLIのreopened状態で再開する。候補はAI由来として記録し、人間入力の意思や支持/反対履歴に混入させない。
3. knowledge改善、policy質問、Skill不具合など適切な種類でreport候補を作る。人間の承認が必要な提案は後続workflowが再試行し続けない状態へ送る。
4. 全体を確認しても有用な候補がなければ、CLI契約に従い現在の入力fingerprintに対する保留を記録する。入力変更なしに再探索を起こさない。

この評価手続きはreportと必要なstate以外を変更しない。改善案をその場でknowledgeへ適用しない。
