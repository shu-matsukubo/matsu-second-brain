---
id: k-09eeb3ef9aafd09d
title: Hono で Google ログインを実装する
type: fact
topic: app-development
topic_label: アプリ開発
tags:
  - アプリ開発
  - Hono
  - Google
  - OAuth
updated: 2026-08-24
support_streak: 0
opposition_streak: 0
history_status: unknown
related:
  - k-63ec6b4ce9ba5b6b
  - k-f7e33e41fd6f8b95
  - k-97d6709958a83deb
opposes: []
evidence: []
history: []
sources:
  - url: https://hono.dev/docs/middleware/third-party
  - url: https://github.com/honojs/middleware/tree/main/packages/oauth-providers
  - url: https://developers.google.com/identity/protocols/oauth2/web-server
  - url: https://developers.google.com/identity/protocols/oauth2/policies
---

# Hono で Google ログインを実装する

Hono ではサードパーティーミドルウェア `@hono/oauth-providers` を使うと、Google OAuth 2.0 の認可エンドポイントへのリダイレクト、認可コードとトークンの交換、基本プロフィールの取得を簡潔に実装できる。

ただし、ミドルウェアが担当するのは Google との OAuth フローである。取得した Google ユーザーとアプリ内ユーザーの対応付け、ログインセッションの作成、ログアウト、アクセス制御はアプリ側で実装する。詳細は [OAuth ログイン後のアプリセッションを設計する](k-63ec6b4ce9ba5b6b.md) に分離する。

## 準備

1. Google Cloud で OAuth クライアントを作成する。
2. `googleAuth` を適用する認証ルートの完全な URL を、承認済みリダイレクト URI に登録する。
3. クライアント ID とクライアントシークレットを実行環境のシークレットに保存する。
4. 必要最小限のスコープを決める。ログイン用途なら `openid`、`email`、`profile` を基本とする。

ミドルウェアは既定では適用先のルートをリダイレクト URI として使う。たとえば本番のルートが `https://example.com/auth/google` なら、その URL を Google Cloud に登録する。HTTPS を使い、実際の値とスキーム、ホスト、パス、末尾のスラッシュまで一致させる。クライアントシークレットはソースコードや公開領域に保存しない。

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

Cloudflare Workers に登録するシークレット名も、このバインディング名に一致させる。

```shell
npx wrangler secret put GOOGLE_ID
npx wrangler secret put GOOGLE_SECRET
```

`GOOGLE_CLIENT_ID` や `GOOGLE_CLIENT_SECRET` など別名で登録しても、この省略形の設定からは自動で参照されない。別名を使う場合は `googleAuth` の `client_id` と `client_secret` に明示的に渡す。

## 判断のポイント

Googleログインだけを素早く追加する用途には `@hono/oauth-providers` が向く。一方、複数プロバイダー、永続セッション、アカウント連携、組織単位の認可などをまとめて扱いたい場合は、Auth.js や OIDC 対応の認証基盤も比較する。

また、Google OAuth は Google API へのアクセス権を得る仕組みでもある。単なるログインに Drive や Calendar などの広いスコープを追加せず、機能が必要になった時点で追加の同意を求める。

## 関連ナレッジ

- [OAuth ログイン後のアプリセッションを設計する](k-63ec6b4ce9ba5b6b.md): Google ユーザーとアプリ内ユーザーの対応付け、セッション、ログアウトを設計する。
- [Cloudflare Workers のシークレット管理](../cloudflare/k-f7e33e41fd6f8b95.md): Google のクライアントシークレットを環境別に安全に管理する。
- [Cloudflare Workers の初回デプロイ手順](../cloudflare/k-97d6709958a83deb.md): Workers へアプリを初回デプロイする手順を確認する。

## 公式情報

- [Hono Third-party Middleware](https://hono.dev/docs/middleware/third-party)
- [Hono OAuth Providers Middleware](https://github.com/honojs/middleware/tree/main/packages/oauth-providers)
- [Google OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google OAuth 2.0 Policies](https://developers.google.com/identity/protocols/oauth2/policies)
