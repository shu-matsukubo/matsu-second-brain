---
title: Hono で Google ログインを実装する
tags:
  - アプリ開発
  - Hono
  - Google
  - OAuth
updated: 2026-07-18
---

# Hono で Google ログインを実装する

Hono ではサードパーティーミドルウェア `@hono/oauth-providers` を使うと、Google OAuth 2.0 の認可エンドポイントへのリダイレクト、認可コードとトークンの交換、基本プロフィールの取得を簡潔に実装できる。

ただし、ミドルウェアが担当するのは Google との OAuth フローである。取得した Google ユーザーとアプリ内ユーザーの対応付け、ログインセッションの作成、ログアウト、アクセス制御はアプリ側で実装する。

## 準備

1. Google Cloud で OAuth クライアントを作成する。
2. アプリの認証ルートを承認済みリダイレクト URI に登録する。
3. クライアント ID とクライアントシークレットを実行環境のシークレットに保存する。
4. 必要最小限のスコープを決める。ログイン用途なら `openid`、`email`、`profile` を基本とする。

本番のリダイレクト URI は HTTPS を使い、Google Cloud に登録した値とスキーム、ホスト、パス、末尾のスラッシュまで一致させる。クライアントシークレットはソースコードや公開領域に保存しない。

## 最小構成

```shell
npm install hono @hono/oauth-providers
```

```ts
import { Hono } from 'hono'
import { googleAuth } from '@hono/oauth-providers/google'

type Bindings = {
  GOOGLE_ID: string
  GOOGLE_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get(
  '/auth/google',
  googleAuth({
    scope: ['openid', 'email', 'profile'],
  }),
  async (c) => {
    const googleUser = c.get('user-google')

    // 1. googleUser.id をキーにアプリ内ユーザーを検索または作成する
    // 2. 推測困難なセッションIDを発行し、サーバー側へ保存する
    // 3. Secure、HttpOnly、SameSite を設定したCookieでセッションを返す

    return c.redirect('/')
  }
)

export default app
```

Cloudflare Workers では、ミドルウェアが既定名の `GOOGLE_ID` と `GOOGLE_SECRET` を環境バインディングから取得できる。別の実行環境では、公式 README の例のように `client_id` と `client_secret` を設定する。

## アプリ側で追加する処理

- Google ユーザーの不変な識別子をアプリ内ユーザーへ対応付ける。メールアドレスだけを恒久的な主キーにしない。
- OAuth のアクセストークンをブラウザーへそのまま返さず、必要な場合だけ暗号化またはアクセス制御されたサーバー側ストレージへ保存する。
- アプリ独自のセッションを作成し、Cookie に `Secure`、`HttpOnly`、適切な `SameSite` 属性を付ける。
- 保護対象ルートではセッションを検証し、認証だけでなく利用者ごとの権限も確認する。
- ログアウト時はアプリのセッションを破棄する。Google API への接続解除も提供する場合は、必要に応じてトークンを失効させる。
- OAuth のエラー、利用者による同意拒否、期限切れセッションを処理する。

## 判断のポイント

Googleログインだけを素早く追加する用途には `@hono/oauth-providers` が向く。一方、複数プロバイダー、永続セッション、アカウント連携、組織単位の認可などをまとめて扱いたい場合は、Auth.js や OIDC 対応の認証基盤も比較する。

また、Google OAuth は Google API へのアクセス権を得る仕組みでもある。単なるログインに Drive や Calendar などの広いスコープを追加せず、機能が必要になった時点で追加の同意を求める。

## 公式情報

- [Hono Third-party Middleware](https://hono.dev/docs/middleware/third-party)
- [Hono OAuth Providers Middleware](https://github.com/honojs/middleware/tree/main/packages/oauth-providers)
- [Google OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google OAuth 2.0 Policies](https://developers.google.com/identity/protocols/oauth2/policies)
