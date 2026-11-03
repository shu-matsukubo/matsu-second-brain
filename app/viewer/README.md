# Knowledge Viewer

Void 1.5.0、Vite 8、React、TypeScript、Material UIで作った、`knowledge/` と `indexes/` の閲覧アプリです。MUIテーマで画面全体の色・文字・操作部品を揃えています。

## ローカルで起動する

Node.js 26.13.0を使います。`VIEWER_DATA_SOURCE` の既定値は `mock` なので、トークンや `.env` を用意せずに起動できます。

```sh
npm ci
npm run dev
```

表示されたローカルURLをブラウザーで開きます。開発サーバーは通常 `http://localhost:5173` で起動します。

Voidの環境設定を使いたい場合は、`env.mock.example` を `.env` にコピーできます。Voidが読むdotenvファイルはプロジェクトルートの `.env` です。

```sh
cp env.mock.example .env
```

## 開発コマンド

`app/viewer/` で実行します。

| コマンド            | 内容                                                    |
| ------------------- | ------------------------------------------------------- |
| `npm run dev`       | VoidとViteの開発サーバーを起動                          |
| `npm run check`     | BiomeでLintとフォーマットを確認                         |
| `npm run fix`       | Biomeで自動修正可能なLintとフォーマットを適用           |
| `npm run typecheck` | `void env types` で環境型を生成し、TypeScriptの型を確認 |
| `npm test`          | Vitestのテストを実行                                    |
| `npm run build`     | Void/Viteの本番ビルドを実行                             |

## データソースと環境変数

| 変数                            | 用途                                                               |
| ------------------------------- | ------------------------------------------------------------------ |
| `VIEWER_DATA_SOURCE`            | `mock` または `github`。未設定時は `mock`                          |
| `MATSU_SECOND_BRAIN_READ_TOKEN` | GitHubモードでサーバーが使う読み取りトークン。GitHubモードでは必須 |

ローカルでGitHubデータを確認する場合は、任意で `.env` に `VIEWER_DATA_SOURCE=github` と `MATSU_SECOND_BRAIN_READ_TOKEN` を設定できます。値は `src/env.ts` で定義し、トークンはクライアントへ渡しません。`.env` はGit管理対象外なので、設定した実トークンやそれを含む `.env` をコミットしないでください。CIはモックで動作し、本番トークンは不要です。`env.mock.example` にはモック設定だけを置いています。

GitHubモードは `shu-matsukubo/matsu-second-brain` の `main` にあるMarkdownを読みます。`indexes/` と `knowledge/` のFacts、Principles、Ideasだけを対象にし、1ページ20件で取得します。サーバーには60秒のメモリキャッシュと最大4件の同時取得制限があります。ブラウザーは初回に全ページを取得し、その後の検索と絞り込みは取得済みデータ上で行います。

このViewerは認証を設けず、読み込んだknowledgeとindexesをページ利用者に表示します。GitHubモードへ切り替えると、対象内容は公開情報として閲覧可能になります。公開を前提に扱える内容だけを置いてください。

トークンが必要な場合は、対象リポジトリだけにアクセスできるFine-grained personal access tokenを作り、**Contents: Read-only**だけを許可します。トークンをブラウザーのコードへ埋め込まないでください。

## Pull request CI

`main` 宛てのPull requestでは `Knowledge Viewer` ワークフローが毎回起動します。`app/` に差分がある場合はNode.js 26.13.0、モックデータ、本番Secretなしで `npm ci`、`npm run check`、`npm run typecheck`、`npm test`、`npm run build` を実行します。`app/` に差分がない場合はアプリ検証を省略し、集約ジョブが成功を報告します。変更検出または必要な検証が失敗・キャンセルされた場合、集約ジョブも成功扱いにしません。

ブランチ保護でRequired status checkを指定する場合は、固定名の **Viewer CI** を選択します。検証設定だけを追加しており、デプロイ処理はありません。

## 将来のCloudflare公開準備

Cloudflare Workerはまだ作成していません。初回公開時はCloudflare Deploy Skillと[Voidのデプロイ手順](https://void.cloud/reference/cli/deploy)を使い、Cloudflareアカウントでログインしたうえで、まず次を実行します。

```sh
npx void deploy --platform cloudflare
```

Void設定のWorker名は `second-brain-viewer` です。初回デプロイ後、GitHubモードへ切り替える前に、VoidのSecret管理でFine-grained tokenをサーバーSecretとして登録し、その後データソースを切り替えます。

```sh
npx void secret put MATSU_SECOND_BRAIN_READ_TOKEN
npx void secret put VIEWER_DATA_SOURCE=github
```

最初のコマンドは値を表示しない入力プロンプトを使います。`VIEWER_DATA_SOURCE` とトークンはどちらも `src/env.ts` に定義したサーバー値です。CloudflareのWorker Secretとして登録し、公開変数やクライアントビルド値にはしません。[VoidのSecret管理](https://void.cloud/reference/cli/secrets)では、`void secret put` は `void.config.ts` で指定したWorkerを対象にします。初回デプロイでWorkerを作成してから登録してください。環境変数の役割は[Voidの環境変数仕様](https://void.cloud/reference/api/env)を参照してください。

必要なときだけ、Cloudflare Deploy Skillに沿ってWorkerを初期作成し、Secret登録、GitHub取得の確認、公開結果の確認を順に行います。このリポジトリのCIから自動公開はしません。
