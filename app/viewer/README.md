# Knowledge Viewer

- 対象: `knowledge/`と`indexes/`の閲覧。
- 構成: Void 1.5.0 / Vite 8 / React / TypeScript / Material UI。
- 表示: MUIテーマで色・文字・操作部品を統一。

## ローカル起動

- Node.js: 26.13.0。
- 実行場所: `app/viewer/`。
- 既定値: `mock`。トークン・`.env`は不要。

```sh
npm ci
npm run dev
```

- 表示されたローカルURLを開く。通常は`http://localhost:5173`。
- Voidの環境設定が必要なら[env.mock.example](env.mock.example)を`.env`へコピーする。
- dotenvの読み込み先: `app/viewer/.env`。

## 開発コマンド

| コマンド                 | 内容                                |
| ------------------------ | ----------------------------------- |
| `npm run dev`            | Void/Vite開発サーバー               |
| `npm run check`          | Biomeのlint・format確認             |
| `npm run fix`            | Biomeの自動修正                     |
| `npm run typecheck`      | 環境型生成・TypeScript検査          |
| `npm run index:generate` | Markdownからindex生成。事前にnpm ci |
| `npm run index:check`    | indexの非破壊検証                   |
| `npm test`               | Vitest                              |
| `npm run build`          | 本番ビルド                          |

## データと環境変数

| 変数                            | 値・用途                                     |
| ------------------------------- | -------------------------------------------- |
| `VIEWER_DATA_SOURCE`            | `mock` / `github`。既定はmock                |
| `MATSU_SECOND_BRAIN_READ_TOKEN` | githubモード必須のサーバー用読み取りトークン |

- 定義: [src/env.ts](src/env.ts)。
- ローカルのgithubモード: `.env`へ上記2値を設定する。
- トークン: 対象リポジトリだけにアクセスできるFine-grained PAT。`Contents: Read-only`。
- 実トークン・`.env`はコミットしない。ブラウザーやクライアントビルドへ渡さない。
- CI: mockを使用。本番Secretは不要。
- 認証: なし。githubモードでは読み込んだknowledge/indexesをページ利用者へ公開する。

## 取得と表示

```text
mainの同じコミット
├─ indexes/library.json → /api/library → 検索・topic・最近の更新
└─ 許可対象knowledge  → /api/article → 選択時の本文取得
```

| 項目                 | 動作                                               |
| -------------------- | -------------------------------------------------- |
| GitHub取得元         | `shu-matsukubo/matsu-second-brain`のmain           |
| 初期取得             | indexメタデータだけ。本文は含めない                |
| 検索                 | タイトル・タグの部分一致 AND 分類条件              |
| topic一覧            | 検索・分類の両方に一致するknowledgeから生成        |
| ホーム               | 最近更新された10件                                 |
| topic画面            | 分類別のknowledge一覧。topic本文は取得しない       |
| 本文                 | `/api/article?path=...&snapshot=...`で遅延取得     |
| ブラウザーキャッシュ | snapshot/path単位で取得済み・通信中を共有          |
| 更新確認             | 新snapshot取得時に旧本文キャッシュを破棄           |
| サーバー             | 60秒メモリキャッシュ・最大4件同時取得              |
| 本文の許可対象       | 一覧と同じコミットのknowledge Markdown通常ファイル |
| 画面遷移             | topic/knowledge内部リンク・戻る/進む・直接URL      |

## Index

- 正本: Knowledge Markdownの`id/title/type/topic/topic_label/tags/updated`。
- 派生物: `indexes/library.json`とtopic Markdown。
- 検証: ID/path/topic/classification/linkの不整合・symlinkを拒否。
- 生成: 内容が変わったファイルだけ置換し、古い生成topic pageを除去。
- rootでも`npm run index:generate` / `npm run index:check`を実行できる。

## Pull request CI

- 対象: main向けPR。
- 正本: [Knowledge Viewer workflow](../../.github/workflows/viewer-ci.yml)。
- 検証: Skill構造・リンク、workflow test、データ検証、Viewer lint・index・型・test・build。
- 変更検出対象に差分がなければ検証jobをskip。
- 変更検出・必要な検証の失敗/cancelは集約jobも失敗。
- Required status check名: **Viewer CI**。
- CIからの自動公開: なし。

## Cloudflareデプロイ

| 設定                | 値                                                                     |
| ------------------- | ---------------------------------------------------------------------- |
| Worker              | `second-brain-viewer`                                                  |
| workers.dev         | 有効                                                                   |
| preview URL         | 無効                                                                   |
| custom domain route | 未設定                                                                 |
| 公開先              | [Knowledge Viewer](https://second-brain-viewer.matsu-app.workers.dev/) |
| データ              | githubモードでmainを表示                                               |
| 設定ファイル        | [void.config.ts](void.config.ts)                                       |

1. Cloudflare Deploy Skillと[Voidデプロイ手順](https://void.cloud/reference/cli/deploy)を使う。
2. `app/viewer/`でWrangler・Voidそれぞれの認証を確認する。Void未ログインならブラウザーでログインする。

```sh
npx wrangler whoami
npx void cloudflare login
```

3. 未登録のWorker Secretだけ登録する。

```sh
npx wrangler secret put MATSU_SECOND_BRAIN_READ_TOKEN --name second-brain-viewer
npx wrangler secret put VIEWER_DATA_SOURCE --name second-brain-viewer
```

- 値は入力プロンプトへ渡す。トークンをファイル・コマンド引数に書かない。
- `VIEWER_DATA_SOURCE`には`github`を入力する。
- どちらもサーバー値とする。[Void環境変数仕様](https://void.cloud/reference/api/env)を参照する。

4. デプロイする。

```sh
npx void deploy --platform cloudflare
```

5. 公開URLと`/api/library`でGitHubデータ取得を確認する。

| 条件                                             | 対応                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| 初回の仮Workerで`/__void/ready`失敗、公開URL無効 | Cloudflare管理画面の対象Worker → Settings → Domains & Routesでworkers.devを有効化して再実行 |
| Windowsの証明書エラー                            | PowerShellで`$env:NODE_USE_SYSTEM_CA = '1'`を設定                                           |

| ファイル                                             | 管理                                          |
| ---------------------------------------------------- | --------------------------------------------- |
| `void.lock.json`                                     | アカウント・解決済み設定を共有するためGit管理 |
| `.cloudflare/`・`.wrangler/`・`.void-wrangler.jsonc` | 生成物。Git管理外                             |
