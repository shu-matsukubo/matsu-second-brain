---
title: OAuth ログイン後のアプリセッションを設計する
type: fact
topic: アプリ開発
tags:
  - OAuth
  - OpenID Connect
  - 認証
  - セッション
updated: 2026-08-24
---

# OAuth ログイン後のアプリセッションを設計する

OAuthアクセストークンとアプリ内のログインセッションは役割が異なる。アクセストークンは認可された保護リソースへアクセスするための値であり、OpenID ConnectのIDトークンは外部プロバイダーが行った認証についてのclaimを伝える。どちらも、アプリ内ユーザーとの対応付け、アプリ独自の有効期限、権限確認を含むセッション管理そのものを定義する値ではない。

そのため、外部ログイン後もアプリがログイン状態を維持する場合は、検証済みの認証結果を起点に、アプリ側のセッションを別に管理する。

## ログイン時の流れ

1. プロバイダーから受け取った認証結果を検証する。
2. issuerと利用者識別子をアプリ内ユーザーへ対応付ける。OpenID Connectでは `iss` と `sub` の組み合わせを使う。
3. 暗号学的に安全な乱数でセッションIDを発行し、利用者ID、有効期限、権限などの意味をサーバー側へ保存する。
4. セッションIDをCookieでブラウザーへ返す。
5. 保護対象ルートでセッションと必要な権限を確認する。

OWASPは、セッションIDに少なくとも64ビットのエントロピーを持たせ、値自体へ個人情報や業務上の意味を含めないよう示している。認証などで権限レベルが変わる際は、セッション固定攻撃を防ぐためIDを再発行する。

## Cookieとトークンの扱い

- `Secure` はCookieをHTTPS接続だけで送信させる。
- `HttpOnly` はJavaScriptからCookieを読み取れないようにする。
- `SameSite` はクロスサイトリクエストでCookieを送る範囲を制御する。OWASPはセッションCookieへ `Strict` または `Lax` を明示し、CSRF対策の多層防御として使うよう示している。
- セッションには、アプリの用途とリスクに応じたアイドルタイムアウトと絶対有効期限を設ける。

## ログアウトと失敗時の処理

ログアウト時は、Cookieを削除するだけでなく、サーバー側のセッションも無効化する。期限切れや無効なセッションIDを受け取った場合は、保護対象へのアクセスを許可せず、再ログインできる状態へ戻す。

## 公式・一次情報

- [RFC 6750: The OAuth 2.0 Authorization Framework: Bearer Token Usage](https://datatracker.ietf.org/doc/html/rfc6750)（2026-08-24確認）: アクセストークンは保護リソースへアクセスするための認可を表す。
- [OpenID Connect Core 1.0](https://openid.net/specs/openid-connect-core-1_0-18.html)（2026-08-24確認）: IDトークンとUserInfo用アクセストークンの役割、および `iss` と `sub` の安定性を定義する。
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)（2026-08-24確認）: セッションID、Cookie属性、有効期限、再発行、サーバー側無効化の実装指針を示す。

## 関連

- [OpenID Connectのユーザー識別にはissとsubを使う](<OpenID Connectのユーザー識別にはissとsubを使う.md>)
- [Hono で Google ログインを実装する](<Hono で Google ログインを実装する.md>)
- [Cloudflare Workers のシークレット管理](<../Cloudflare/Cloudflare Workers のシークレット管理.md>)
