---
title: Cloudflare Workers の初回デプロイ手順
tags:
  - Cloudflare
  - Workers
  - Wrangler
updated: 2026-07-17
---

# Cloudflare Workers の初回デプロイ手順

## 前提

- Node.js と npm が利用できる
- プロジェクトに Wrangler がローカル依存関係として定義されている
- Worker 名などの設定が `wrangler.jsonc`、`wrangler.toml` などに用意されている

## セットアップ

依存関係をインストールする。

```shell
npm install
```

ローカル端末から対話的に操作する場合は、初回だけ Cloudflare にログインする。

```shell
npx wrangler login
```

CI/CD では対話ログインではなく、必要な権限に絞った `CLOUDFLARE_API_TOKEN` を利用する。

## 本番用シークレットの登録

アプリが必要とする値を Worker のシークレットとして登録する。

```shell
npx wrangler secret put MY_EMAIL
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GITHUB_TOKEN
npx wrangler secret put JWT_SECRET
```

`GOOGLE_CLIENT_ID` は Google OAuth のクライアントIDであり、公開鍵ではない。機密性が特に高いのはクライアントシークレット、APIトークン、JWT署名用シークレットである。これらの値はソースコードや通常の `vars` に書かない。

環境を分けている場合は、対象を明示する。

```shell
npx wrangler secret put JWT_SECRET --env production
```

ローカル開発用の値は `.dev.vars` または `.env` のどちらか一方に保存し、`.gitignore` でコミット対象外にする。

## デプロイ

標準の Wrangler コマンドは次のとおり。

```shell
npx wrangler deploy
```

`package.json` の `scripts.deploy` が Wrangler のデプロイを呼び出す構成なら、次でも実行できる。

```shell
npm run deploy
```

環境を分けている場合は、シークレットを登録した環境とデプロイ先を一致させる。

```shell
npx wrangler deploy --env production
```

## 注意点

- `wrangler secret put` は新しい Worker バージョンを作成し、その変更を直ちにデプロイする。
- シークレットは環境間で継承されないため、環境ごとに登録する。
- `package.json` のデプロイスクリプトが何を実行するか確認してから `npm run deploy` を使う。
- シークレット名はコードが参照するバインディング名と一致させる。

## 公式ドキュメント

- [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler のインストールと更新](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [Wrangler の環境](https://developers.cloudflare.com/workers/wrangler/environments/)
