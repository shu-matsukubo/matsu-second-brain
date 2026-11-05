# 改善処理のGitHub連携

## 範囲

- knowledge統合・メンテナンス・report作成の共通手順。
- GitHub操作は接続済みプラグイン、checkout・commit・pushはローカルGitを使う。
- プラグインで不足するCI確認などは認証済みCLIを使える。
- 認証・通信の失敗を成功や対象なしと扱わない。
- アプリのdeployと公開範囲の変更は含めない。

## 開始・再開

1. `git status --short`、現在のブランチ、追跡先、既存PRとheadを確認する。
2. 未完了の同じ改善PRがあれば、そのブランチでCI確認・修正・マージを再開する。
3. 新規処理はcleanなmainから開始する。

```powershell
git fetch origin
git merge --ff-only origin/main
git switch -c codex/<作業名>
```

| 条件 | 対応 |
| --- | --- |
| mainが分岐 | 強制的に合わせない |
| 無関係な未コミット変更 | 混ぜず、隔離した作業場所を使うか所有・対象を確認 |
| 本人が既存差分の利用を明示 | 未追跡を含めstash等で保全し、最新mainへ更新後に復元 |
| 復元時の競合 | 元変更を保全して停止し、内容を確認 |
| 完了済みinput | 再適用しない |

## 変更・公開

1. 親・下位Skillで主対象一件を処理する。
2. 差分・新規ファイル・削除をレビューする。
3. 根拠・復旧記録の保全、秘密情報の非混入を確認する。
4. 次の検証を実行する。依存がなければlockfileに基づき`npm ci`する。

```powershell
npm run check:skills
npm test
node scripts/brain.mjs validate
npm run index:check
npm --prefix app/viewer run check
npm --prefix app/viewer run typecheck
npm --prefix app/viewer test
npm --prefix app/viewer run build
```

5. 対象ファイルを明示してstage・commitし、`git push -u origin <branch>`する。
6. main向けPRを作り、変更・理由・検証結果を記載する。既存PRがあれば更新する。

- 検証設定の正本: [Viewer CI](../../../../.github/workflows/viewer-ci.yml)。
- 差分なしなら空commit・PRを作らない。
- journal・snapshot・receiptとNotion完了通知の契約を維持する。
- Notion完了とGitHub統合を別々に確認する。push失敗でknowledgeを再適用しない。

## CI・マージ

1. 最新head SHAの全CIが終了するまで、この実行で確認を続ける。
2. 必須チェックと集約チェック`Viewer CI`の成功を確認する。
3. マージ直前に最新head・base・マージ可能性を再確認する。
4. main更新で検証対象が変われば取り込み、再push後のCI成功を待つ。
5. 確認したhead SHAを指定してマージする。
6. GitHub側のmerged状態を読み戻す。
7. ローカルがcleanならmainへ戻り、fetch・fast-forward後に変更を含むことを確認する。

| CI・権限の状態 | 対応 |
| --- | --- |
| CIなし・pending・失敗・cancelled | マージしない |
| 意図された個別jobのskip | 集約チェックの成功と合わせて判断 |
| 作業範囲内のCI失敗 | ログを確認し、同じブランチで修正・push・再確認 |
| 権限不足・外部障害・対象外の修正が必要 | ブランチとPRを残し、URL・失敗箇所・再開方法を報告 |

- 承認要件を迂回しない。
- force push・mainへの直接pushをしない。
- 中断後は既存PRから再開し、新しいinput/reportへ進まない。
- 失敗記録は既存reportとの重複を避け、秘密情報・ログ全文を転載しない。
- 最終報告: PR URL・CI結果・マージ結果・未完了事項。
- mainマージに伴う既存の自動配信は維持する。別のdeploy操作は実行しない。
