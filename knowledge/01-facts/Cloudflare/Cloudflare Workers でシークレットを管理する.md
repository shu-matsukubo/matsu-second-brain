---
title: Cloudflare Workers でシークレットを管理する
type: fact
topic: Cloudflare
tags:
  - Cloudflare
  - Workers
  - Wrangler
  - シークレット
updated: 2026-08-24
---

# Cloudflare Workers でシークレットを管理する

Cloudflare Workers の機密値は、ソースコードや通常の `vars` へ書かず、Worker のシークレットとして管理する。登録時は、コードが参照するバインディング名と対象環境を一致させる。

## 本番用シークレットを登録する

アプリが必要とする機密値を Wrangler で登録する。

```shell
npx wrangler secret put <BINDING_NAME>
```

対象には OAuth のクライアントシークレット、API トークン、JWT 署名用シークレットなどがある。OAuth のクライアント ID はクライアントシークレットほど機密性は高くないが、設定を一元管理するためシークレットとして扱う構成も選べる。

環境を分けている場合は、登録先を明示する。

```shell
npx wrangler secret put JWT_SECRET --env production
```

シークレットは環境間で継承されないため、必要な環境ごとに登録する。`wrangler secret put` は新しい Worker バージョンを作成し、その変更を直ちにデプロイする。

## ローカル開発用の値を保存する

ローカル開発用の値は `.dev.vars` または `.env` のどちらか一方に保存し、`.gitignore` でコミット対象外にする。本番用の値をローカル設定へコピーせず、開発専用の認証情報を使う。

## 必須シークレット名を宣言する

Wrangler の設定に必要なシークレット名を宣言すると、登録漏れをデプロイ前に検出できる。値そのものではなく、バインディング名だけをバージョン管理する。

```jsonc
{
  "secrets": {
    "required": ["GOOGLE_ID", "GOOGLE_SECRET", "JWT_SECRET"]
  }
}
```

`wrangler.toml` では次のように書く。

```toml
[secrets]
required = ["GOOGLE_ID", "GOOGLE_SECRET", "JWT_SECRET"]
```

`secrets.required` が定義されていると、`wrangler deploy` と `wrangler versions upload` は対象 Worker に必須シークレットがそろっていない場合に失敗する。ローカル開発でも、一覧にないキーは `.dev.vars` や `.env` から読み込まれず、不足しているキーには警告が出る。環境ごとに必要な名前が異なる場合は、それぞれの環境設定に宣言する。

## 確認事項

- シークレット名がコードのバインディング名と一致しているか。
- 登録時とデプロイ時の `--env` が一致しているか。
- `.dev.vars` または `.env` がコミット対象外になっているか。
- `secrets.required` に必要なバインディング名がそろっているか。

## 関連ナレッジ

- [Cloudflare Workers の初回デプロイ手順](<Cloudflare Workers の初回デプロイ手順.md>): シークレット登録を含む初回デプロイの流れを確認する。
- [Hono で Google ログインを実装する](<../../アプリ開発/Hono で Google ログインを実装する.md>): Google OAuth で必要なバインディング名と Workers への登録例を確認する。
- [OAuth ログイン後のアプリセッションを設計する](<../../02-principles/アプリ開発/OAuth ログイン後のアプリセッションを設計する.md>): OAuth のクライアントシークレットと、ログイン後のセッション情報の役割を区別する。
- [アプリの通知先に Discord と LINE を使う際の選び方](<../../アプリ開発/アプリの通知先に Discord と LINE を使う際の選び方.md>): 通知用の Webhook URL やアクセストークンをシークレットとして扱う。

## 公式ドキュメント

- [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler の環境](https://developers.cloudflare.com/workers/wrangler/environments/)
