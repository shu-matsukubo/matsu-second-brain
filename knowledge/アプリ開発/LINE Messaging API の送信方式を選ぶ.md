---
title: LINE Messaging API の送信方式を選ぶ
category: アプリ開発
tags:
  - アプリ開発
  - 通知
  - LINE
updated: 2026-07-18
---

# LINE Messaging API の送信方式を選ぶ

LINE Messaging API では、宛先の指定方法と送信のきっかけに応じて送信方式を選ぶ。個別通知には push、複数の既知ユーザーには multicast、条件で絞る配信には narrowcast、友だち全員への配信には broadcast、利用者からのイベントへの応答には reply を使う。

## 送信方式

| 方式 | 適する用途 | 宛先・条件 |
| --- | --- | --- |
| push | 個別の利用者へ任意のタイミングで通知する | ユーザー ID、グループ ID、トークルーム ID を指定する |
| multicast | 複数の既知ユーザーへ同じ内容を送る | 複数のユーザー ID を指定する |
| narrowcast | 属性やオーディエンスで対象を絞って配信する | オーディエンスや属性条件を指定する |
| broadcast | 公式アカウントの友だち全員へ配信する | 宛先を個別指定しない |
| reply | 利用者から届いたイベントへ応答する | Webhook で受け取った reply token を使う |

push を使う場合は、アプリの利用者と LINE のユーザー ID を安全に対応付ける。reply token は有効期限が短いため保存して後から使う用途には向かない。

## メッセージ数の考え方

メッセージ数は吹き出し数ではなく、原則として「送信リクエスト数 × 受信者数」で数える。1回のリクエストには最大5個のメッセージオブジェクトを含められるが、それ自体でカウントは増えない。ブロック済みなどで配信されない宛先もカウントから除外され、reply は料金プラン上のメッセージ数に数えられない。

具体的な無料通数、追加料金、上限は契約地域とプランの最新情報を確認する。

## 関連ナレッジ

- [[アプリの通知先に Discord と LINE を使う際の選び方]]: LINE を通知先として採用するか判断する。

## 公式情報

- [LINE でメッセージを送信する](https://developers.line.biz/en/docs/messaging-api/sending-messages/)
- [LINE Messaging API リファレンス](https://developers.line.biz/en/reference/messaging-api/)
