---
title: OpenID Connectのユーザー識別にはissとsubを使う
type: fact
topic: アプリ開発
tags:
  - OpenID Connect
  - ユーザー識別
updated: 2026-08-24
---

# OpenID Connectのユーザー識別にはissとsubを使う

OpenID Connectの `sub`（Subject Identifier）は、issuer内で利用者ごとに一意で、再割り当てされない識別子である。異なるissuer間では同じ値になる可能性があるため、利用者を一意に識別するキーには `iss` と `sub` の組み合わせを使う。

`email` などの他のclaimには、issuerをまたいだ一意性や時間経過に対する不変性の保証がない。GoogleのIDトークンでも、メールアドレスは変わる可能性があり、利用者レコードの主識別子には `sub` を使うよう案内されている。

## 実装への影響

- 外部アカウントとの対応付けには、issuerと `sub` を保存する。
- メールアドレスは連絡先や表示情報として扱い、恒久的な主キーにしない。

## 関連

- [OAuth ログイン後のアプリセッションを設計する](<../../02-principles/アプリ開発/OAuth ログイン後のアプリセッションを設計する.md>)

## 根拠

- [OpenID Connect Core 1.0 — Subject Identifier Types](https://openid.net/specs/openid-connect-core-1_0-18.html#SubjectIDTypes)（確認日: 2026-08-24）
- [Google OpenID Connect API reference](https://developers.google.com/identity/openid-connect/reference)（確認日: 2026-08-24）
