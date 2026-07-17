---
title: Cloudflare Workers 無料枠の概要
category: Cloudflare
tags:
  - Cloudflare
  - Workers
  - サーバーレス
updated: 2026-07-18
---

# Cloudflare Workers 無料枠の概要

Cloudflare Workers は、インフラを管理せずにコードを実行できるサーバーレス環境である。Workers Free プランは既定で利用でき、クレジットカードを登録せずに開始できる。

## 主な無料枠

2026年7月時点の主な上限は次のとおり。

- Worker を呼び出すリクエスト: 1アカウントあたり1日100,000件
- CPU時間: 1リクエストあたり10ミリ秒
- メモリ: 1 isolate あたり128 MB
- Worker数: 1アカウントあたり100個
- 環境変数: 1 Worker あたり64個

リクエスト数は毎日 00:00 UTC にリセットされる。Workers Static Assets だけを返すリクエストは原則として無料かつ無制限だが、Worker スクリプトを呼び出す場合は無料枠に含まれる。

リクエスト上限に達すると Error 1027 が発生する。Cloudflare のルートで fail open を選ぶと Worker をバイパスし、fail closed を選ぶとエラーページを返す。認証などバイパスできない用途では fail closed を選び、使用量を監視する。

## 利用時の考え方

- 小規模なAPI、Webhook、検証環境などは無料枠から始めやすい。
- CPU時間の上限は処理の実時間ではなく、コードがCPUを使用した時間に対して適用される。
- 128 MB のメモリ上限は呼び出しごとではなく isolate ごとであり、1つの isolate が複数の同時リクエストを処理することがある。
- KV、R2、D1、Workers AI などの関連サービスには、それぞれ別の料金と上限がある。
- 料金や上限は変更される可能性があるため、導入時には公式ページを確認する。

## 公式情報

- [Workers Pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Cloudflare Workers](https://www.cloudflare.com/products/workers/)
