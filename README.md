# 第2の脳

入力は[Notion「第2の脳 input」](https://app.notion.com/p/9e7aaa31478844e0b828515a8df463fb)、整理済みknowledgeの正本はこのリポジトリのMarkdownです。

Codex／ChatGPTの前日の本人の会話から開発に直接関係する意思決定だけを収集し、既存の整理タスクが一回につきinput一件を反映します。Notionは未処理・処理中・完了・保留・エラーを管理し、処理済みは未処理ビューから外します。初期運用では削除しません。

資産運用・投資判断など開発と無関係な情報は、原文・要約・背景を含め入力へ登録しません。開発との関係が不明なものも除外します。

## 日次の収集

- Codex: 毎日07:00（Asia/Tokyo）、ローカルのオートメーション`codex-notion-input`。[実行プロンプト](prompts/collect-codex-input.md)、[収集Skill](.agents/skills/collect-conversation-input/SKILL.md)。PCとアプリの起動が必要です。
- ChatGPT cloud: 毎日07:10（Asia/Tokyo）を推奨。[コピー用プロンプト](prompts/collect-chatgpt-input.md)を既存の履歴取得タスクへ設定してください。この環境のオートメーション作成ツールはローカル用のため、cloud側タスクは作成していません。
- 整理: 既存の「第二の脳の継続改善」で[統合Skill](.agents/skills/curate-second-brain/SKILL.md)が一件ずつ処理します。[実行プロンプト](prompts/curate-second-brain.md)。実行間隔・通知・実行先はアプリの設定を参照してください。

実行プロンプトは作業場所とSkill呼出しを中心に短く保ち、処理の流れ・判断条件・再開手順はSkillとreferenceで管理します。収集と整理で共通の[対象範囲](.agents/skills/curate-second-brain/references/input-scope.md)を使います。ChatGPT cloud用はローカルSkillを参照できないため、単独実行に必要な登録手順をコピー用プロンプトに含めます。

ローカルのCodex collectorは、対話用Desktop／CLIの本人のメッセージを読みます。非対話exec、内部エージェント、システム指示、Skill注入は対象外です。元発言の日時をAsia/Tokyoの前日で判定し、fork等で再掲される同じメッセージを重複排除します。原文の一時出力はリポジトリ外へ置きます。収集実行とその一時ファイルの読み取りは同じshell呼出しで行ってください。

## Notionの入力契約

接続先・ビューは[config/notion-input.json](config/notion-input.json)にあります。未処理と入力キー照合は保存済みビューを使い、検索や回数制限のあるSQLを前提にしません。has_moreがある場合はページ送りします。未処理は、DATE欄の表示精度による丸めを避ける「発言順」（元日時のUTC ISO文字列）の昇順で並べます。

一覧用プロパティとは別に、各ページ本文の唯一のJSONコードブロックを取り込みの正本とします。input_key/source/source_ref/occurred_at/quote/summary/contextを保存し、Notionの表示用Markdown変換で原文や出典が変わるのを避けます。本文の入力記録と表示用プロパティを食い違わせず、処理開始後の訂正は新しい入力として登録してください。

## 整理と再開

リポジトリに変更を加える改善処理は、最新main → 新しい`codex/`ブランチ → 一件の修正・reportと検証 → commit/push・PR → CI成功確認 → マージまで実施します。[GitHub連携手順](.agents/skills/curate-second-brain/references/github-flow.md)が開始・再開・失敗時の共通手順です。CI失敗時はマージせず、同じブランチで修正して再確認します。差分がなければPRは作りません。

```powershell
npm ci
npm --prefix app/viewer ci
node scripts/brain.mjs next
```

`next`は未完了journal、処理中input、Notion完了通知待ちを優先します。input_fetchならSkillがNotionの未処理ビューを照会します。空と確認できた実行だけ`next --input-empty`でreport／全体評価へ進めます。接続失敗を空として扱いません。

CLIのinput-stageは一件を固定し、applyはknowledge・根拠・履歴・indexを検証して反映台帳を残します。反映後はNotionの完了更新を読み戻して確認し、input-ackで固定中の一件を解放します。JSON引数はファイルのほか`-`で標準入力から渡せます。

- journalが残った場合: `node scripts/brain.mjs resume`。元のplanを再生成しません。
- input_ackが返る場合: knowledgeを再適用せず、Notionの完了更新だけ再試行します。
- inputが変更されていた場合: 強行せず競合を記録し、journal／snapshot／receiptを保持します。

stateには処理中の一件と最小の反映台帳を保存します。人間の意思・原文・発言日時はknowledge末尾にも残します。本文は「内容 → 関連リンク → 根拠・思考の履歴」とし、直接関係する外部事実はfactsへ切り出して内部リンクします。既存knowledgeは内容を更新する機会にこの形式へ整理します。

## 旧入力の保全

dailyは旧入力のアーカイブです。未処理58件をNotionへ移し、対応と元ファイルのdigestを[state/legacy-input-migration.json](state/legacy-input-migration.json)に記録しました。daily本文は変更していません。旧statusのnewは旧データで、現在の処理状態はNotionを参照します。移行を再実行する際は対応表と入力キーを照合し、再登録しないでください。

## 検証

```powershell
npm test
node scripts/brain.mjs validate
npm run index:check
npm --prefix app/viewer test
npm --prefix app/viewer run typecheck
```
