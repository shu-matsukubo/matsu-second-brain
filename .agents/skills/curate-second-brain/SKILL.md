---
name: curate-second-brain
description: 統合ワークフローで第2の脳を整理する。定期実行や全体整理では、daily・report対応・knowledge評価を優先順に一つずつ処理し、変更がない保留状態では再探索しない。
---

# 第2の脳の統合ワークフロー

全体原則はリポジトリの`AGENTS.md`、知識の意味判断は`knowledge-policy/`を正本とする。policyとSkillの処理方針は、ユーザーが明示的に変更を求めない限り編集しない。曖昧な方針や機能不足はreportへ提案する。

## 1回の実行を選ぶ

ワークフローの意味判断はSkillが担い、CLIは入力の選択、計画の検証・適用、再開状態を決定的に管理する。リポジトリrootから`node scripts/brain.mjs`を実行する。コマンド契約は次の通り。

- `validate`: knowledge/report/stateを検証する。
- `next`: journal、最古のnew daily、対応対象report、必要なら全体reviewの順に次の対象をJSONで返す。reportはpending、journalがないin_progress、または人間によるrequest/body変更で`reopened: true`になったclosed項目が選ばれる。
- `resume`: `next`が`kind: resume`を返したときに実行する。journalの記録だけから同じ処理を再開し、元のtemp planを探したり意味内容を再生成したりしない。
- `apply PLAN.json`: 検証済みoperation planを適用する。途中失敗後は元の一時planを探さず、`resume`でjournalの保存内容から再開する。daily planではsource自身のstatusだけを更新する。report planはsourceであるreportファイル自身をwritesに含める。knowledgeを書き込む場合はcoreがindexを生成する。
- `report-add REPORT.json`: reportをfingerprintで重複排除して追加する。request/resultはfrontmatterを正本とする。
- `review-state`: 全体reviewのfingerprintと変更状況を表示する。
- `review-complete FINGERPRINT`: fingerprintが現行入力と一致し、journal・new daily・pending/in_progress/reopened reportがない場合にreview済みfingerprintを記録する。同じ値がすでに記録済みなら書き込まない。

Operation planのschemaは`validateOperationPlan`が検証する。`version: 1`、`kind`（daily/report/review）、既存の`source_id`と`source_digest`、`writes`（path/content/expected_digest）、`daily_status_path`を含む。`source_digest`は`next`が対象に返した値を使う。report source digestはrequest/bodyに基づき、result/statusの変更では変わらない。report変更planはsource report自身のMarkdownを`writes`に含め、id/fingerprint/origin/kind/request/created/bodyを保持し、status/result/updatedを更新する。knowledgeの分類/topic変更で実ファイルを移す場合だけ、`moves`に`from_path`、`to_path`、安定`id`、移動元の`expected_digest`を含める。対応する移動先ファイルとリンク更新を`writes`に含め、coreの移動検証・journalを通す。knowledge/report以外の任意ファイルやdaily本文を直接書き換えるplanを作らない。一時JSONが必要ならOSのtemp領域を使い、リポジトリ内に未承認の運用stateを追加しない。

実行に必要なNode依存関係がない場合は、リポジトリrootと`app/viewer`でlockfileに基づく`npm ci`を行う。依存取得が利用できない、または失敗した場合に、別のpackage managerや未承認の代替方法へ切り替えない。失敗原因と再開に必要な情報をreportへ記録する。

まず`next`の結果を確認する。`kind: resume`なら`node scripts/brain.mjs resume`で記録済み処理だけを再開し、元planを探したり推測で作り直したりしない。その他はCLIの選択結果に従い次の優先順で主対象を一つ選ぶ。

1. 最古の`status: new` daily。未知や欠落statusを未処理と推測しない。
2. CLIが対応対象として選択したreportを一件。current statusだけを根拠に再開対象を除外せず、AI由来のpolicy/Skill変更案は実施せず`deferred`へ移す。ほかの候補は人間の明示指示が必要かを見極め、承認範囲内だけ実施する。
3. dailyもCLIが返す対応対象reportもないとき、knowledge全体をpolicyに照らして評価し、有用な改善候補をreportに登録する。pending以外でもCLIがin_progressまたはreopenedとして返したreportが残る間はreviewへ進まない。

保留状態の入力fingerprintが変わっていなければ探索・ファイル更新をせず終了する。再開判定の対象はdaily、policy、AI自身の処理状態更新と区別された人間のreport入力、Skills/AGENTSの方針、knowledge等、CLIが定義する人間由来入力に従う。indexやstate、AI reportの状態・処理結果だけで探索を再開させない。

## Skillの選択

選んだ主対象の手順だけを使う。必要な環境では独立した作業として下位Skillの手順を担当エージェントに渡してよい。利用可能な委譲機能に合わせて選び、モデル名や特定のsubagent設定を前提にしない。委譲先には対象、制約、必要な返却形式を明示し、最終の計画・反映前確認は統括Skillが担う。

- daily反映: [daily-to-knowledge](../daily-to-knowledge/SKILL.md)
- report対応: [handle-knowledge-report](../handle-knowledge-report/SKILL.md)
- 全体評価: [review-knowledge](../review-knowledge/SKILL.md)

## 計画を適用する

1. 対象データ、policy、既存knowledgeと直接関係する参照を確認する。
2. 意味上の計画を作成し、knowledge、report、workflow stateのschemaに合うかCLIのvalidatorで確認する。knowledgeの変更内容とdailyのstatus更新は同じ入力を二重適用しない形で一つのoperation planにまとめる。一時JSONが必要ならOSのtemp領域を使い、リポジトリ内に未承認の運用stateを追加しない。
3. CLIがplanを適用する直前に行うsource digest、期待digest、根拠・履歴・連続数の検証を通す。検証エラーは計画を書き換えてごまかさず、根拠へ戻る。
4. core CLIがindexを生成する場合、Skillから重複してindex生成・更新を行わない。
5. 反映後に変更対象と関連参照を確認する。処理未完了、結果不明、部分失敗があるときは完了扱いにせず、許可された安全な再開かfailure reportに回す。

daily本文は処理済みstatus以外変更しない。Knowledgeの独立主題・根拠・背景を保ち、入力文を丸ごと複製しない。外部事実は一次情報を確認しURLと日付を記録する。支持・反対の連続数は人間由来の関連入力だけから判断し、AI reportを数えない。履歴不明はカウンター0かつ不明状態として扱い、過去principleを履歴不明だけで降格しない。

## reportと失敗

同じ問題を重複登録しないよう、active/archiveを含む既存reportのID/fingerprintを確認する。既知で未承認のpolicy/Skill候補しかなく新しい実行可能候補がなければ、重複提案を追加せずreview-completeで入力変更を待つ。closed reportはrequest/bodyが前回acknowledge後に変われば同じIDで再対応する。新たな証拠を伴って同じ完了済み問題が再発したと確認できた場合は、同じreportを新根拠とともに再openし、重複taskを増やさない。未承認のpolicy/Skill変更、判断が曖昧な分類、未確認の出典、代替手段のない処理失敗は実行せずreportに根拠と必要な判断を記録する。failureには失敗箇所、影響、再開に必要な情報を記録する。許可がないまま処理方式を変えない。

各主対象の完了後、繰り返し起きうるSkill不具合や方針改善が必要か確認し、提案があれば重複を避けてreportへ記録する。Skillの運用方針を提案しただけで変更しない。

## 保留

全体評価で候補がないとき、実際のCLIを通じて保留状態を記録する。fingerprintが同じ間は、後続実行も入力選択と最小限の状態確認以外の探索や書き込みを行わない。ユーザーの明示的な再評価依頼は新たな人間入力として扱う。自動commit、push、deploy、外部送信は行わない。
