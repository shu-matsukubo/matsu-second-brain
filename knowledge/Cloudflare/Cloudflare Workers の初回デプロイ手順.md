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

初回デプロイでは、依存関係の準備、Cloudflare への認証、本番用シークレットの登録、デプロイの順に進める。環境を分ける場合は、シークレットの登録先とデプロイ先に同じ `--env` を指定する。

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

アプリが必要とする機密値を、コードが参照するバインディング名で Worker のシークレットとして登録する。

```shell
npx wrangler secret put <BINDING_NAME>
```

対象には OAuth のクライアントシークレット、API トークン、JWT 署名用シークレットなどがある。OAuth のクライアント ID は公開鍵ではなく、機密性はクライアントシークレットより低いが、設定を一元管理するためシークレットとして扱う構成も選べる。機密値はソースコードや通常の `vars` に書かない。

環境を分けている場合は、対象を明示する。

```shell
npx wrangler secret put JWT_SECRET --env production
```

ローカル開発用の値は `.dev.vars` または `.env` のどちらか一方に保存し、`.gitignore` でコミット対象外にする。

### 必須シークレット名を設定へ宣言する

Wrangler の設定にアプリが必要とするシークレット名を宣言しておくと、登録漏れをデプロイ前に検出できる。値そのものではなく、バインディング名だけをバージョン管理する。

```jsonc
{
  "secrets": {
    "required": ["GOOGLE_ID", "GOOGLE_SECRET", "JWT_SECRET"]
  }
}
```

`wrangler.toml` を使う場合は次のように書く。

```toml
[secrets]
required = ["GOOGLE_ID", "GOOGLE_SECRET", "JWT_SECRET"]
```

`secrets.required` が定義されていると、`wrangler deploy` と `wrangler versions upload` は対象 Worker に必須シークレットがそろっていない場合に失敗する。ローカル開発でも、一覧にないキーは `.dev.vars` や `.env` から読み込まれず、不足しているキーには警告が出る。環境ごとに必要な名前が異なる場合は、それぞれの環境設定に宣言する。

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
- `secrets.required` を設定し、登録漏れをデプロイ時に検出する。
- `package.json` のデプロイスクリプトが何を実行するか確認してから `npm run deploy` を使う。
- シークレット名はコードが参照するバインディング名と一致させる。

## 関連ナレッジ

- [[Cloudflare Workers 無料枠の概要]]: デプロイ前に無料枠の制約を確認する。
- [[Hono で Google ログインを実装する]]: Google OAuth を使う Hono アプリのシークレット名と登録例を確認する。

## 公式ドキュメント

- [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler のインストールと更新](https://developers.cloudflare.com/workers/wrangler/install-and-update/)
- [Wrangler の環境](https://developers.cloudflare.com/workers/wrangler/environments/)
