---
name: weekly-review
description: 第二の脳全体を現在の情報設計で評価し、週次レポートを作成または更新する。knowledge・Index・links・signals・daily・feedback・設計との差を観測し、改善候補と昇格候補を整理する。レポート以外のデータは変更しない。
---

# 第二の脳を週次レビューする

## 原則

- 第二の脳全体を俯瞰して評価する。
- 週次レポートだけを作成または更新し、`knowledge`、`indexes`、`signals`、`daily` を変更しない。
- 根拠のない推測を記載しない。
- 改善を強制せず、事実と観測を分けて記載する。
- 過去の形式を固定基準にせず、現在の `AGENTS.md` を評価基準にする。

## referenceの選び方

`AGENTS.md` で全体の現在の思想と正しい状態を確認した後、この `SKILL.md` から必要なreferenceを直接読む。curate Skillや日次の変更手順は読まない。

- 全体の調査観点は、[評価観点](references/inspect-knowledge-base.md)を読む。
- レポートを書き始める段階で、[週次レポート形式](references/write-weekly-report.md)を読む。

## サブエージェントによる調査

調査範囲が複数の独立した観点へ分かれ、委譲によって速度または品質が上がる場合は、次のカスタムサブエージェントへ必要な調査だけを委譲できる。

- [`knowledge_semantics_reviewer`](../../../.codex/agents/knowledge_semantics_reviewer.toml): knowledgeの意味品質・分類とsignalsの反復・昇格可能性
- [`reference_integrity_auditor`](../../../.codex/agents/reference_integrity_auditor.toml): IndexとMarkdown linksの参照整合性
- [`activity_evidence_reviewer`](../../../.codex/agents/activity_evidence_reviewer.toml): daily、Git履歴、前回レビュー、feedbackの活動証跡

毎回すべてを起動せず、親がレビューの広さ、変更量、調査間の依存関係から委譲先を選ぶ。独立して実行できる調査は並列化してよい。委譲時は対象期間、基準となる前回レポートまたはコミット、担当範囲を明示し、根拠となるパス・件数・確認できない点を返すよう依頼する。

サブエージェントの結果は観測材料であり、改善候補・昇格候補の採否と優先度は親が現在のファイルと照合して決める。親はレポートの作成、変更範囲の確認、commitを委譲しない。

## 手順

1. `AGENTS.md` を読み、現在の全体基準を確認する。
2. [評価観点](references/inspect-knowledge-base.md)を読み、必要な調査範囲と相互依存を確認する。
3. 必要に応じて該当するカスタムサブエージェントへ調査を委譲し、独立した調査は並列化する。委譲しない観点は親が直接確認する。
4. 評価観点の全項目が親またはサブエージェントの調査で覆われていることを確認し、結果の重複、矛盾、未確認事項を現在のファイルと照合する。
5. 親が既存データと現在の基準との差、未解消のfeedback、signalsの反復、前回候補とGit履歴を統合し、通常の日次メンテナンスで扱える改善候補と、根拠が十分な昇格候補を判断する。週次レビュー自身は改善や昇格を実行しない。
6. レポートを書き始める段階で週次レポート形式を読み、親がレポートを作成または更新する。
7. レポート以外のファイルが変更されていないことを確認する。
8. この処理で変更したレポートだけをコミットし、既存の無関係な変更を含めない。
9. 保存先、主な観測、日次メンテナンスへ渡した候補を簡潔に報告する。
