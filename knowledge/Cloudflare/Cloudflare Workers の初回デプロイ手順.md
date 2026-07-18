---
title: Cloudflare Workers の初回デプロイ手順
category: Cloudflare
tags:
  - Cloudflare
  - Workers
  - Wrangler
updated: 2026-07-18
---

# Cloudflare Workers の初回デプロイ手順

初回デプロイでは、依存関係の準備、Cloudflare への認証、本番用シークレットの登録、デプロイの順に進める。シークレットの登録方法や必須項目の検証は [[Cloudflare Workers でシークレットを管理する]] を参照する。

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

デプロイ前に、アプリが必要とする機密値を Worker のシークレットとして登録する。コードが参照するバインディング名、対象環境、必須シークレットの宣言をそろえる必要がある。具体的なコマンドと設定は [[Cloudflare Workers でシークレットを管理する]] を参照する。

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

- シークレットの登録先とデプロイ先に同じ `--env` を指定する。
- `package.json` のデプロイスクリプトが何を実行するか確認してから `npm run deploy` を使う。

## 関連ナレッジ

- [[Cloudflare Workers 無料枠の概要]]: デプロイ前に無料枠の制約を確認する。
- [[Cloudflare Workers でシークレットを管理する]]: 本番・ローカル・環境別のシークレット管理を確認する。
- [[Hono で Google ログインを実装する]]: Google OAuth を使う Hono アプリのシークレット名と登録例を確認する。

## 公式ドキュメント

- [Wrangler のインストールと更新](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [Wrangler の環境](https://developers.cloudflare.com/workers/wrangler/environments/)
