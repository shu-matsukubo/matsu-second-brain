---
id: github-pr-122-ci-not-started
fingerprint: failure:github:pr-122:checks-absent-and-mergeability-unknown
origin: ai
kind: failure
status: completed
created: 2026-11-17
updated: 2026-11-17
request: ChatGPT Sitesの改善候補登録PR
  https://github.com/shu-matsukubo/matsu-second-brain/pull/122
  について、CI実行が作成されず、マージ可能性も未確定となった。既存ブランチcodex/review-20261117-sites-scope-and-topicと同じPRからGitHub統合を再開する。最新headの必須CIとViewer
  CIの成功、最新main・head/base・マージ可能性を確認し、確認済みheadを指定してマージする。CIなし・UNKNOWNのまま完了や成功と扱わず、knowledge候補を再登録しない。
result: |-
  2026-11-16T15:31:09ZにPR #122を作成した。15:35Zまで接続済みCI診断を複数回読み取り、head c9d8d0e924214f8504547540766222b60895dbc7のchecks/statusesはいずれも空。gh run listでも同ブランチの実行は空、gh pr viewはmergeable UNKNOWN/mergeStateStatus UNKNOWN/statusCheckRollup []。PRはopen・draft false、baseはe55bf5cbc59c379444d3bfb52cbad475c18e41db。リモートブランチheadとローカルhead・追跡設定は一致する。viewer-ci.ymlはmain向けpull_requestで起動する設定で、今回のreport差分は判定対象に含まれる。ローカルの必須検証は全件成功済み。

  GitHub公式 https://www.githubstatus.com/api/v2/incidents/unresolved.json はPull Requestsの性能低下（incident 2zfqmghmg3s3、investigating、15:03:22Z更新）とマージタイムアウト増加を報告している。ただし、この障害が今回のCI未作成の原因とは確認していない。CI設定や権限を変更せず、空commitやPRの開閉による起動操作も行っていない。

  このレポートは現在の主対象PRの統合未完了と再開条件を記録するもの。追加後の最新headに対するCIを確認し、未起動が続く間はPRをマージせず保持する。復旧時は既存PRを先に統合し、この記録は実際のCI/マージ結果で解消を判断する。Notion入力・knowledge・旧dailyには未反映で、Sitesの利用条件の確認やノート移動もまだ実施していない。

  2026-11-17 再確認・解消: GitHubからPR #122を読み戻し、merged true、最終head 881c3f4b08d097f3463e880590dfd615e279fcfa、merge commit ee05b31bf925ce57a17e094e7b6c3f535baef1bc、merged_at 2026-11-16T15:46:35Zを確認した。同じ最終headのCI診断でDetect viewer input changes・Validate viewer・Viewer CIの全3件がcompleted/successであることを再確認した。したがって、このPRでCI未作成・マージ可能性未確定のため統合を進められなかった状態は解消済みとして完了にする。GitHub全体の障害復旧や、当時のCI遅延の原因を確定したものではない。

  上記の旧結果は当時の観測として保持する。PRの再作成・開閉やCIの再実行、CI設定・権限の変更、knowledge候補の再登録は行っていない。関連するSites改善候補は別の主対象としてPR #123で処理済みであり、今回はこの障害記録の状態と確認済み台帳だけを更新する。Notion・knowledge・旧daily・indexは変更しない。Skill改善の追加提案は不要。
---
