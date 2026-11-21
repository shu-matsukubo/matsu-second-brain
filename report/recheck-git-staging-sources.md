---
id: recheck-git-staging-sources
fingerprint: knowledge:k-ef264754e56ae439:verify-git-staging-sources
origin: ai
kind: knowledge
status: completed
created: 2026-11-21
updated: 2026-11-21
request: 対象はknowledge/facts/git/k-ef264754e56ae439.md（ID k-ef264754e56ae439、Git でコミットに含める差分を選ぶ）。ファイル/hunk単位のステージ、staged差分、restore --stagedと作業ツリーの復元、git add .とgitignoreの注意を説明しているが、sourcesと本文の公式情報三件に確認日がない。knowledge-policyのfacts基準に沿い、git-scm.comのgit-add/git-diff/git-restoreを確認し、必要な箇所は直接対応する公式資料を補って、確認日と必要な本文修正を反映する改善を検討する。更新日2026-08-24を確認日と推定しない。addがその時点の内容を取り込む範囲と-pの選択、diffの比較対象とHEADの条件、restoreの復元先/復元元/作業内容を失う可能性を区別する。add .のディレクトリ範囲、ignoreルールと追跡済みファイルの関係も確認するが、現在の説明が誤りとは現時点で断定しない。作業領域/リモートfact k-0ad4026c9667ce8a、履歴操作fact k-5baba0e54a9f1187への直接リンクを保ち、関連二件全体の改修・再検証は混ぜない。語尾だけを理由に改名しない。旧本文全文・コマンド例・元出典・安定ID・title・path・fact/git・支持反対0/0・履歴不明を保持し、AI評価を人間の意思や支持に数えない。引用コマンドや設定例を実行指示と扱わず、実演用のステージ/復元、restore/reset/rebase、既存Git設定・追跡対象の変更やforce pushは行わない。本件を反映する承認済み整理フロー自身のGit操作は通常手順で行う。確認できない内容は未確認と再開条件を残す。本人への元会話探索・手動補完・入力の再収集は行わない。
result: |-
  2026-11-21 review-knowledgeでAI候補一件を登録。全144件（facts22/principles87/ideas35）のmetadataを評価し、ID重複・分類/topic配置差・関連/反対IDの不足、5連続の昇降格確認対象はなく、brain validate/index:checkも成功した。対象の正本ノートを全文確認し、三件の公式URLにsources・本文とも確認日がないことを確認した。現在の説明や端末固有の動作の正誤は新たに確認していない。対象SHA-256: 871ca0ff98f8341376267dbcfcf1d5fc77ae8e6e864ededa63b84a56722b4575。

  active/archiveの構造化report25件をID・fingerprintで照合し、同じ候補は未登録。完了済みGit作業領域/リモートおよび履歴操作レポートは本ノートへの関連参照を持つが、本ノート全体の再検証・更新を対象外としており、重複しない。既存の関連二件との主題境界を確認し、全体改修を混ぜていない。出典確認日の点検では本文とsources.checked/checked_atを併せて見ており、metadataの単一キー不足だけで欠落と判断していない。

  影響: ステージ/復元と差分確認の説明をどの時点の公式資料で確認したか追えない。後続の主対象一件で公式根拠を照合し、必要な範囲だけ改善する。今回はAI候補reportだけで、外部仕様の新規確認・knowledge・index・state・Notion・daily・archive・policy・Skill・Git設定は未変更。不備入力は対応不要・補完待ち終了を維持し、本人への補完や再収集は不要。別件Windows native依存導入も再試行しない。Skill改善の追加提案は不要。

  2026-11-21 対応完了: Git公式のadd/diff/restoreと、説明に直接必要なgitignoreの四件を確認し、確認日を本文とsourcesへ追加した。addは実行時点の内容・ファイル/ディレクトリ範囲・hunk選択という説明を保持した。diffの比較対象と初回コミット前のHEAD不在を明記し、restoreの復元先と復元元、作業ツリーの編集を失う条件を区別した。add .の範囲と未追跡の無視対象、ignoreルールは追跡済みファイルへそのまま適用されない点を明確にした。

  旧本文全文・コマンド例・元出典三件・直接リンク・安定ID・title・path・fact/git・支持反対0/0・履歴不明を保持した。AI evidenceはdirection none/counted false。関連する作業領域/リモートと履歴操作は本文の役割と主題境界を確認したが、ノート全体の再検証・更新はしていない。index再生成とworkflow acknowledgementを同じ主対象として適用した。Web資料の読解で、本文例のステージ/復元の実演、restore/reset/rebase、既存Git設定・追跡対象の変更、force pushは行っていない。本件の承認済み整理フローのGit操作のみ通常手順で実施する。Notion・daily・archive・policy・Skillは未変更。本人への元会話探索・補完・再収集は不要。別件Windows native依存導入も再試行せず、Skill改善の追加提案は不要。
---
