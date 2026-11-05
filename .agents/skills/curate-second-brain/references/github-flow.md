# 改善処理のGitHub連携

knowledge統合・メンテナンス・report作成の共通手順。GitHub操作は接続済みプラグインを優先し、ローカルのcheckout・commit・pushにはGitを使う。CI確認などプラグインで足りない機能は認証済みCLIを利用できる。認証や通信の失敗を成功・対象なしと扱わない。

## 開始と再開

1. `git status --short`、現在のブランチ、追跡先、既存PRとそのheadを確認する。未完了の同じ改善PRがある場合は、そのブランチでCI確認・修正・マージを再開する。完了済みinputを再適用しない。
2. 通常の新規処理はcleanなmainで`git fetch origin`、`git merge --ff-only origin/main`し、`git switch -c codex/<作業を識別できる名前>`で開始する。mainが分岐している場合は強制的に合わせない。
3. 無関係な未コミット変更がある場合は混ぜず、隔離した作業場所を使うか、変更の所有と対象を確認する。本人が既存差分の利用を明示した場合は、未追跡ファイルを含むstash等で保全してから最新mainへ更新し、作業ブランチへ復元する。競合時は元変更を失わないよう停止し、内容を確認する。

## 一件の処理と公開

4. 親・下位Skillの手順で主対象を一件処理する。journal・snapshot・反映台帳とNotionの完了通知は既存の再開契約を維持する。Notion完了とGitHubへの統合完了は別々に確認し、push失敗でknowledgeを再適用しない。
5. 差分・新規ファイル・削除をレビューし、根拠・復旧記録の保全と秘密情報の非混入を確認する。rootの`npm test`、`node scripts/brain.mjs validate`、`npm run index:check`を実行する。Viewerの検証は`.github/workflows/viewer-ci.yml`と同じcheck・typecheck・test・buildを使う。依存がなければlockfileに基づく`npm ci`を行う。
6. 対象ファイルを明示してstage・commitし、`git push -u origin <branch>`する。mainをbaseにPRを作成し、変更の内容・理由・検証結果を説明する。既存PRがあれば更新し、重複作成しない。差分がない場合はcommit・PRを作らず終了する。

## CIとマージ

7. PRの最新head SHAに対する全CIが終了するまでこの実行で確認を続ける。必須チェックと集約チェック`Viewer CI`の成功を確認する。CIが見つからない・pending・失敗・cancelledの状態ではマージしない。意図された条件による個別jobのskipは集約チェックの成功と合わせて判断する。失敗したらログを確認し、この作業範囲内で修正して同じブランチへpushし、新しいheadのCIを待つ。権限不足・外部障害・対象外の修正が必要な場合はブランチとPRを残し、URL・失敗箇所・再開方法を報告して終了する。承認要件を迂回しない。
8. マージ直前に最新head・baseとマージ可能性を再確認する。main更新により検証対象が変わる場合は、mainを取り込んで再pushし、新しいCIの成功を待つ。確認したhead SHAを指定してマージし、GitHub側のmerged状態を読み戻す。ローカルがcleanならmainへ戻りfetch・fast-forwardし、マージした変更を含むことを確認する。force pushやmainへの直接pushはしない。

CI・マージの途中で中断したら、新しいinputやreportを処理せず既存PRから再開する。失敗の記録を追加する場合は秘密情報やログ全文を転載せず、既存reportとの重複を避ける。最終報告にはPRのURL、CI結果、マージ結果と未完了事項を示す。mainへのマージに伴う既存の自動配信は維持するが、この手順から別のdeploy操作は実行しない。
