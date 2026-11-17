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
updated: 2026-11-17
support_streak: 0
opposition_streak: 0
history_status: unknown
related:
  - k-63ec6b4ce9ba5b6b
  - k-f7e33e41fd6f8b95
  - k-97d6709958a83deb
opposes: []
evidence:
  - source_id: report/recheck-hono-google-login-sources.md
    input_digest: 0bdf3064110f86a0759420f7bc3f385ef16c96cb21934e5bfde0a12228624bce
    origin: ai
    direction: none
    background: HonoとGoogleの公式資料および固定commitのmiddleware実装・型定義を確認し、出典日と設定例の確認範囲を追記した。user-googleの部分型を扱い、セッション未実装の例をログイン完了と誤認しないよう修正した。
    counted: false
history:
  - from: fact
    to: fact
    at: 2026-11-17
    reason: HonoとGoogleの公式資料および固定commitのmiddleware実装・型定義を確認し、出典日と設定例の確認範囲を追記した。user-googleの部分型を扱い、セッション未実装の例をログイン完了と誤認しないよう修正した。
    previous_body: "\r

      # Hono で Google ログインを実装する\r

      \r

      Hono ではサードパーティーミドルウェア `@hono/oauth-providers` を使うと、Google OAuth 2.0
      の認可エンドポイントへのリダイレクト、認可コードとトークンの交換、基本プロフィールの取得を簡潔に実装できる。\r

      \r

      ただし、ミドルウェアが担当するのは Google との OAuth フローである。取得した Google
      ユーザーとアプリ内ユーザーの対応付け、ログインセッションの作成、ログアウト、アクセス制御はアプリ側で実装する。詳細は [OAuth
      ログイン後のアプリセッションを設計する](k-63ec6b4ce9ba5b6b.md) に分離する。\r

      \r

      ## 準備\r

      \r

      1. Google Cloud で OAuth クライアントを作成する。\r

      2. `googleAuth` を適用する認証ルートの完全な URL を、承認済みリダイレクト URI に登録する。\r

      3. クライアント ID とクライアントシークレットを実行環境のシークレットに保存する。\r

      4. 必要最小限のスコープを決める。ログイン用途なら `openid`、`email`、`profile` を基本とする。\r

      \r

      ミドルウェアは既定では適用先のルートをリダイレクト URI として使う。たとえば本番のルートが
      `https://example.com/auth/google` なら、その URL を Google Cloud に登録する。HTTPS
      を使い、実際の値とスキーム、ホスト、パス、末尾のスラッシュまで一致させる。クライアントシークレットはソースコードや公開領域に保存しない。\r

      \r

      ## 最小構成\r

      \r

      ```shell\r

      npm install hono @hono/oauth-providers\r

      ```\r

      \r

      ```ts\r

      import { Hono } from 'hono'\r

      import { googleAuth } from '@hono/oauth-providers/google'\r

      \r

      type Bindings = {\r

      \  GOOGLE_ID: string\r

      \  GOOGLE_SECRET: string\r

      }\r

      \r

      const app = new Hono<{ Bindings: Bindings }>()\r

      \r

      app.get(\r

      \  '/auth/google',\r

      \  googleAuth({\r

      \    scope: ['openid', 'email', 'profile'],\r

      \  }),\r

      \  async (c) => {\r

      \    const googleUser = c.get('user-google')\r

      \r

      \    // 1. googleUser.id をキーにアプリ内ユーザーを検索または作成する\r

      \    // 2. 推測困難なセッションIDを発行し、サーバー側へ保存する\r

      \    // 3. Secure、HttpOnly、SameSite を設定したCookieでセッションを返す\r

      \r

      \    return c.redirect('/')\r

      \  }\r

      )\r

      \r

      export default app\r

      ```\r

      \r

      Cloudflare Workers では、ミドルウェアが既定名の `GOOGLE_ID` と `GOOGLE_SECRET`
      を環境バインディングから取得できる。別の実行環境では、公式 README の例のように `client_id` と `client_secret`
      を設定する。\r

      \r

      Cloudflare Workers に登録するシークレット名も、このバインディング名に一致させる。\r

      \r

      ```shell\r

      npx wrangler secret put GOOGLE_ID\r

      npx wrangler secret put GOOGLE_SECRET\r

      ```\r

      \r

      `GOOGLE_CLIENT_ID` や `GOOGLE_CLIENT_SECRET`
      など別名で登録しても、この省略形の設定からは自動で参照されない。別名を使う場合は `googleAuth` の `client_id` と
      `client_secret` に明示的に渡す。\r

      \r

      ## 判断のポイント\r

      \r

      Googleログインだけを素早く追加する用途には `@hono/oauth-providers`
      が向く。一方、複数プロバイダー、永続セッション、アカウント連携、組織単位の認可などをまとめて扱いたい場合は、Auth.js や OIDC
      対応の認証基盤も比較する。\r

      \r

      また、Google OAuth は Google API へのアクセス権を得る仕組みでもある。単なるログインに Drive や Calendar
      などの広いスコープを追加せず、機能が必要になった時点で追加の同意を求める。\r

      \r

      ## 関連ナレッジ\r

      \r

      - [OAuth ログイン後のアプリセッションを設計する](k-63ec6b4ce9ba5b6b.md): Google
      ユーザーとアプリ内ユーザーの対応付け、セッション、ログアウトを設計する。\r

      - [Cloudflare Workers のシークレット管理](../cloudflare/k-f7e33e41fd6f8b95.md):
      Google のクライアントシークレットを環境別に安全に管理する。\r

      - [Cloudflare Workers の初回デプロイ手順](../cloudflare/k-97d6709958a83deb.md):
      Workers へアプリを初回デプロイする手順を確認する。\r

      \r

      ## 公式情報\r

      \r

      - [Hono Third-party
      Middleware](https://hono.dev/docs/middleware/third-party)\r

      - [Hono OAuth Providers
      Middleware](https://github.com/honojs/middleware/tree/main/packages/oauth\
      -providers)\r

      - [Google OAuth 2.0 for Web Server
      Applications](https://developers.google.com/identity/protocols/oauth2/web\
      -server)\r

      - [Google OAuth 2.0
      Policies](https://developers.google.com/identity/protocols/oauth2/policie\
      s)\r\n"
    previous_path: knowledge/facts/app-development/k-09eeb3ef9aafd09d.md
sources:
  - url: https://hono.dev/docs/middleware/third-party
  - url: https://github.com/honojs/middleware/tree/main/packages/oauth-providers
  - url: https://developers.google.com/identity/protocols/oauth2/web-server
  - url: https://developers.google.com/identity/protocols/oauth2/policies
  - url: https://hono.dev/docs/middleware/third-party
    checked_at: 2026-11-17
    note: 外部middlewareとしてOAuth Providersを掲載
  - url: https://github.com/honojs/middleware/blob/89dc1e0d30e9a109a0a3d3ec3a23bc5296c2a24b/packages/oauth-providers/README.md
    checked_at: 2026-11-17
    note: Googleの設定とscope例
  - url: https://github.com/honojs/middleware/blob/89dc1e0d30e9a109a0a3d3ec3a23bc5296c2a24b/packages/oauth-providers/package.json
    checked_at: 2026-11-17
    note: リポジトリ上のversion 0.9.1。npm配布版との一致は未検証
  - url: https://github.com/honojs/middleware/blob/89dc1e0d30e9a109a0a3d3ec3a23bc5296c2a24b/packages/oauth-providers/src/providers/google/googleAuth.ts
    checked_at: 2026-11-17
    note: 既定の認証情報名・redirect URI・state照合
  - url: https://github.com/honojs/middleware/blob/89dc1e0d30e9a109a0a3d3ec3a23bc5296c2a24b/packages/oauth-providers/src/providers/google/index.ts
    checked_at: 2026-11-17
    note: user-googleのContext型
  - url: https://github.com/honojs/middleware/blob/89dc1e0d30e9a109a0a3d3ec3a23bc5296c2a24b/packages/oauth-providers/src/providers/google/authFlow.ts
    checked_at: 2026-11-17
    note: 認可コード交換とGoogle UserInfo取得
  - url: https://github.com/honojs/middleware/blob/89dc1e0d30e9a109a0a3d3ec3a23bc5296c2a24b/packages/oauth-providers/src/providers/google/types.ts
    checked_at: 2026-11-17
    note: GoogleUser型
  - url: https://developers.google.com/identity/protocols/oauth2/web-server
    checked_at: 2026-11-17
    note: redirect URIの一致と認可コードフロー
  - url: https://developers.google.com/identity/protocols/oauth2/policies
    checked_at: 2026-11-17
    note: クライアント情報と最小scopeの扱い
---
# 内容

Honoの外部ミドルウェア `@hono/oauth-providers` は、Googleの認可コードフローとプロフィール取得を補助する。アプリ内ユーザーとの対応、ログインセッション、ログアウト、認可の実装はアプリ側に残る。

以下は2026-11-17に確認した `honojs/middleware` のコミット `89dc1e0d30e9a109a0a3d3ec3a23bc5296c2a24b`（package.json上の版0.9.1）に基づく接続例。npm配布版の内容との一致、コンパイル、実ログインを検証した完成版ではない。

## 設定の対応

GoogleのWeb用OAuthクライアントに、利用するリダイレクトURIを登録する。Googleへ送るURIは登録値と一致させる。公開先はHTTPSとし、ホスト・パス・末尾のスラッシュも確認する。必要なscopeだけを求め、クライアントシークレットをソースへ含めない。

確認した実装では `client_id` / `client_secret` の省略時に、Honoの `env(c)` から `GOOGLE_ID` / `GOOGLE_SECRET` を読む。Workersではこの名前でバインディングを用意する。別名を使うときはオプションへ明示的に渡す。シークレットを平文の設定ファイルへ記載する例として扱わない。

既定の `redirect_uri` はリクエストURLからクエリを除いた値。別の公開URLを使う構成では `redirect_uri` を指定し、Googleの登録値と合わせる。確認した実装には、認可コード受信時にCookieとクエリの `state` を照合する処理がある。

## OAuth接続部分の例

`hono` と `@hono/oauth-providers` を導入し、環境に合う設定を用意する。例のscopeは公式READMEの指定に合わせている。

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
  googleAuth({ scope: ['openid', 'email', 'profile'] }),
  (c) => {
    const googleUser = c.get('user-google')
    if (!googleUser?.id) {
      return c.text('Googleユーザーを取得できませんでした', 401)
    }

    // この後にアプリ内ユーザーとの対応とセッション作成を実装する。
    // 未実装の状態でログイン成功へリダイレクトしない。
    return c.text('アプリ側のセッション処理は未実装です', 501)
  }
)

export default app
```

`user-google` は型定義上 `Partial<GoogleUser> | undefined` なので、IDなど利用する値を確認する。この値を検査しただけでは、アプリのログインセッションを作成したことにはならない。例の501応答は未実装を示す意図的な終了である。

## 関連リンク

- [OAuth ログイン後のアプリセッションを設計する](k-63ec6b4ce9ba5b6b.md): 外部アカウントとアプリ内ユーザーの対応、セッション、ログアウトの責務を参照する。
- [Cloudflare Workers のシークレット管理](../cloudflare/k-f7e33e41fd6f8b95.md): 実行環境の認証情報を管理する。
- [Cloudflare Workers の初回デプロイ手順](../cloudflare/k-97d6709958a83deb.md): 公開手順は別に確認する。

# 根拠・思考の履歴

2026-11-17に以下を確認した。以前のsources四件は確認日がなく、旧更新日2026-08-24から確認日を推定していない。旧本文・設定例・製品比較の説明はfrontmatterのhistoryへ全文保存し、元出典も保持した。Auth.js等の比較を今回の公式仕様確認や本人の採用基準として引き継いでいない。

- [Hono Third-party Middleware](https://hono.dev/docs/middleware/third-party)（2026-11-17確認）
- [OAuth Providers README](https://github.com/honojs/middleware/blob/89dc1e0d30e9a109a0a3d3ec3a23bc5296c2a24b/packages/oauth-providers/README.md)（2026-11-17確認）: Googleの使い方・scope例。版の確認は同コミットの [package.json](https://github.com/honojs/middleware/blob/89dc1e0d30e9a109a0a3d3ec3a23bc5296c2a24b/packages/oauth-providers/package.json)。
- [googleAuth実装](https://github.com/honojs/middleware/blob/89dc1e0d30e9a109a0a3d3ec3a23bc5296c2a24b/packages/oauth-providers/src/providers/google/googleAuth.ts)、[Context型](https://github.com/honojs/middleware/blob/89dc1e0d30e9a109a0a3d3ec3a23bc5296c2a24b/packages/oauth-providers/src/providers/google/index.ts)、[AuthFlow](https://github.com/honojs/middleware/blob/89dc1e0d30e9a109a0a3d3ec3a23bc5296c2a24b/packages/oauth-providers/src/providers/google/authFlow.ts)、[GoogleUser型](https://github.com/honojs/middleware/blob/89dc1e0d30e9a109a0a3d3ec3a23bc5296c2a24b/packages/oauth-providers/src/providers/google/types.ts)（いずれも2026-11-17確認）
- [Google OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)、[OAuth 2.0 Policies](https://developers.google.com/identity/protocols/oauth2/policies)（いずれも2026-11-17確認）

確認は公式資料・ソース・型定義の読解まで。ライブラリの導入やコードのコンパイル、Google Cloudの作成、実際のOAuth同意、ログイン、シークレット登録、deployは行っていない。セッションfactやOIDC識別fact全体を再検証したものでもない。型の読解は実装全体の安全性の保証ではない。本人の新しい意思を追加したものではなく、支持・反対0/0、過去履歴不明を維持する。
