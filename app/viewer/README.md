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

| コマンド                 | 内容                                                         |
| ------------------------ | ------------------------------------------------------------ |
| `npm run dev`            | VoidとViteの開発サーバーを起動                               |
| `npm run check`          | BiomeでLintとフォーマットを確認                              |
| `npm run fix`            | Biomeで自動修正可能なLintとフォーマットを適用                |
| `npm run typecheck`      | `void env types` で環境型を生成し、TypeScriptの型を確認      |
| `npm run index:generate` | MarkdownからViewer用JSONを生成する（事前に `npm ci` が必要） |
| `npm run index:check`    | Viewer用JSONの整合性をファイル変更なしで検証する             |
| `npm test`               | Vitestのテストを実行                                         |
| `npm run build`          | Void/Viteの本番ビルドを実行                                  |

## データソースと環境変数

| 変数                            | 用途                                                               |
| ------------------------------- | ------------------------------------------------------------------ |
| `VIEWER_DATA_SOURCE`            | `mock` または `github`。未設定時は `mock`                          |
| `MATSU_SECOND_BRAIN_READ_TOKEN` | GitHubモードでサーバーが使う読み取りトークン。GitHubモードでは必須 |

ローカルでGitHubデータを確認する場合は、任意で `.env` に `VIEWER_DATA_SOURCE=github` と `MATSU_SECOND_BRAIN_READ_TOKEN` を設定できます。値は `src/env.ts` で定義し、トークンはクライアントへ渡しません。`.env` はGit管理対象外なので、設定した実トークンやそれを含む `.env` をコミットしないでください。CIはモックで動作し、本番トークンは不要です。`env.mock.example` にはモック設定だけを置いています。

GitHubモードは `shu-matsukubo/matsu-second-brain` の `main` からデータを読みます。初期表示では `/api/library` から `app/viewer/library-index.json` のメタデータだけを取得し、タイトル・タグ検索とトピック・分類フィルタをブラウザー上で行います。本文検索は行いません。記事選択時だけ `/api/article?path=...&snapshot=...` で本文を取得し、ブラウザーではコミットとパス単位で取得済み・通信中の本文をキャッシュします。サーバーには60秒のメモリキャッシュと最大4件の同時取得制限があり、本文は一覧と同じコミットの許可対象Markdown（通常ファイル）だけを返します。閲覧中にmainが更新された場合は再読み込みを案内します。

Viewer用JSONは本文を含まない派生データです。生成は `node app/viewer/scripts/generate-index.ts`、非破壊検証は末尾に `--check` を付けて、任意の作業ディレクトリから実行できます。Frontmatterのタイトル・トピック・文字列タグ・更新日を使用し、分類は配置パスから取得します。タイトル未指定時はH1、次にファイル名へフォールバックします。パス順に安定して出力し、不正なFrontmatterでは失敗します。ナレッジ整理SkillがMarkdown変更後・コミット前に再生成し、日次レビューSkillは `--check` の不整合を改善候補として報告します。

このViewerは認証を設けず、読み込んだknowledgeとindexesをページ利用者に表示します。GitHubモードへ切り替えると、対象内容は公開情報として閲覧可能になります。公開を前提に扱える内容だけを置いてください。

トークンが必要な場合は、対象リポジトリだけにアクセスできるFine-grained personal access tokenを作り、**Contents: Read-only**だけを許可します。トークンをブラウザーのコードへ埋め込まないでください。

## Pull request CI

`main` 宛てのPull requestでは `Knowledge Viewer` ワークフローが毎回起動します。`app/`、`knowledge/`、`indexes/` またはワークフロー自身に差分がある場合はNode.js 26.13.0、モックデータ、本番Secretなしで `npm ci`、`npm run check`、`npm run index:check`、`npm run typecheck`、`npm test`、`npm run build` を実行します。対象の差分がない場合はアプリ検証を省略し、集約ジョブが成功を報告します。変更検出または必要な検証が失敗・キャンセルされた場合、集約ジョブも成功扱いにしません。

ブランチ保護でRequired status checkを指定する場合は、固定名の **Viewer CI** を選択します。検証設定だけを追加しており、デプロイ処理はありません。

## Cloudflareへのデプロイ

Cloudflare Deploy Skillと[Voidのデプロイ手順](https://void.cloud/reference/cli/deploy)を使います。`app/viewer/` で実行してください。Worker名は `second-brain-viewer` です。`void.config.ts` はworkers.devでの公開を有効にし、プレビューURLを無効にしています。カスタムドメインのルートは設定していません。

公開URLは [Knowledge Viewer](https://second-brain-viewer.matsu-app.workers.dev/) です。GitHubモードで `main` のknowledgeとindexesを表示します。

デプロイ前にWranglerの認証状態を確認します。Voidの認証は別に管理されるため、Voidで未ログインの場合はブラウザーでログインしてください。

```sh
npx wrangler whoami
npx void cloudflare login
```

GitHubモードでは、次の2つのWorker Secretを使います。登録済みのシークレットは再登録不要です。トークンの値は入力プロンプトから登録し、ファイルやコマンド引数に書かないでください。

```sh
npx wrangler secret put MATSU_SECOND_BRAIN_READ_TOKEN --name second-brain-viewer
npx wrangler secret put VIEWER_DATA_SOURCE --name second-brain-viewer
```

2つ目のプロンプトには `github` を入力します。`VIEWER_DATA_SOURCE` とトークンはどちらも `src/env.ts` に定義したサーバー値で、公開変数やクライアントビルド値にはしません。環境変数の役割は[Voidの環境変数仕様](https://void.cloud/reference/api/env)を参照してください。

```sh
npx void deploy --platform cloudflare
```

シークレット登録で作成された仮Workerへの初回デプロイで `/__void/ready` の確認に失敗し、公開URLが無効な場合は、Cloudflare管理画面の対象Workerの **Settings > Domains & Routes** でworkers.devを有効にして再実行します。

Voidが生成する `void.lock.json` は、デプロイ先アカウントと解決済み設定を保持します。別の端末でも同じ設定を使えるようGit管理します。`.cloudflare/`、`.wrangler/`、`.void-wrangler.jsonc` は生成物のためGit管理しません。

WindowsでCloudflare APIへの接続が証明書エラーになる場合は、PowerShellで `$env:NODE_USE_SYSTEM_CA = '1'` を設定し、信頼済みのシステム証明書を利用します。

デプロイ後は公開URLと `/api/library` を確認し、モックではなくGitHubのデータを取得できることを確認します。このリポジトリのCIから自動公開はしません。
