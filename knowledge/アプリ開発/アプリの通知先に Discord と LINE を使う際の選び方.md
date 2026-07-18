---
title: アプリの通知先に Discord と LINE を使う際の選び方
category: アプリ開発
tags:
  - アプリ開発
  - 通知
  - Discord
  - LINE
updated: 2026-07-18
---

# アプリの通知先に Discord と LINE を使う際の選び方

アプリから運用者や少人数のチームへ一方向に通知するだけなら、Discord の Incoming Webhook は導入しやすい。一般利用者へ普段使っている LINE 上で通知したい場合は LINE Messaging API が適するが、初期設定と利用者管理が増える。

## 導入要件の違い

| 観点 | Discord Incoming Webhook | LINE Messaging API |
| --- | --- | --- |
| 主な用途 | 特定の Discord チャンネルへの通知 | LINE公式アカウントから利用者への通知 |
| 送信先の指定 | Webhook にひもづくチャンネル | ユーザー ID、グループ ID、配信対象など |
| 受信者側の準備 | 対象サーバーとチャンネルを閲覧できる状態にする | 公式アカウントの友だち追加や、アプリとのユーザー ID の対応付けを行う |
| 初期設定 | 対象チャンネルで Webhook を作成 | LINE公式アカウントを作成し、Messaging API を有効化 |
| アプリ側の認証情報 | Webhook URL に含まれる ID とトークン | チャネルアクセストークン |
| 送信方法 | Webhook URL に HTTP POST | 用途に応じて push、multicast、narrowcast、broadcast などの API を使用 |
| 課金・上限の主な単位 | API のレート制限 | 原則として送信リクエスト数と受信者数。月間上限がある |
| 向いている場面 | 監視、バッチ結果、開発・運用通知 | エンドユーザー向け通知、LINE上の対話 |

Discord の Incoming Webhook は Bot ユーザーや常時接続を必要としない。Webhook URL が送信権限を持つため、ソースコードへ直接書かずシークレットとして管理する。

LINE Messaging API の利用には、LINE公式アカウントと Messaging API チャネルが必要になる。送信時に使う基本的な認証情報はチャネルアクセストークンであり、単純な通知の初期設定で公開鍵と秘密鍵のペアを直接登録するわけではない。トークンは漏えいを避け、期限を設定できるチャネルアクセストークン v2.1 など、公式が推奨する方式を検討する。

## 選び方

- 通知の受け手が Discord を使う開発者や運用者で、チャンネル単位の一方向通知で足りるなら Discord を優先する。
- 利用者が普段使う LINE へ届けること自体に価値があるなら LINE Messaging API を選ぶ。
- 双方向の操作が必要なら、Discord は Bot、LINE は Webhook を受ける Bot サーバーを含めて設計する。
- どちらも認証情報をシークレットとして管理し、漏えい時に失効・再発行できる運用を用意する。
- 一時的な失敗を再送する場合は、重複通知を防ぐ。Discord はレスポンスのレート制限情報と `Retry-After` に従い、LINE の対象 API では `X-Line-Retry-Key` を利用する。
- LINE は月間上限を超えると配信に失敗するため、送信数を監視し、導入時に最新プランを確認する。

## 関連ナレッジ

- [[LINE Messaging API の送信方式を選ぶ]]: LINE を採用した後に、宛先と用途に合う API を選ぶ。

## 公式情報

- [Discord Webhooks](https://docs.discord.com/developers/platform/webhooks)
- [Discord Webhook Resource](https://docs.discord.com/developers/resources/webhook)
- [Discord Rate Limits](https://docs.discord.com/developers/topics/rate-limits)
- [LINE Messaging API を始める](https://developers.line.biz/en/docs/messaging-api/getting-started/)
- [LINE Bot を構築する](https://developers.line.biz/en/docs/messaging-api/building-bot/)
- [LINE チャネルアクセストークン](https://developers.line.biz/en/docs/basics/channel-access-token/)
