---
title: API Gateway の REST API と HTTP API における JWT 認証
category: AWS
tags:
  - AWS
  - API Gateway
  - JWT
  - 認証認可
updated: 2026-07-18
---

# API Gateway の REST API と HTTP API における JWT 認証

Amazon API Gateway には REST API と HTTP API がある。外部の OpenID Connect（OIDC）または OAuth 2.0 プロバイダーが発行する JWT を、API Gateway の標準機能で直接検証したい場合は HTTP API が適している。

## オーソライザーの違い

| 認可方式 | REST API | HTTP API |
| --- | --- | --- |
| JWT オーソライザー | 非対応 | 対応 |
| Amazon Cognito | Cognito User Pools オーソライザー | JWT オーソライザーとして利用可能 |
| Lambda オーソライザー | 対応 | 対応 |
| IAM 認可 | 対応 | 対応 |

HTTP API の JWT オーソライザーは、設定した issuer と audience を基に署名や標準クレームを検証し、必要に応じてルートごとのスコープも検証する。Cognito に限定されず、要件を満たす OIDC / OAuth 2.0 プロバイダーを利用できる。

REST API の組み込み JWT 系認可は Cognito User Pools 向けであり、汎用 JWT オーソライザーはない。Cognito 以外のプロバイダーが発行する JWT を使う場合は、通常は Lambda オーソライザーでトークン検証を実装する。

Lambda オーソライザーは REST API と HTTP API の両方で利用できるため、独自の認証・認可ロジックが必要な場合に選択できる。ただし、Lambda の実行、エラー処理、キャッシュ、鍵のローテーションなどの運用が増える。

## 選び方

- 外部 IdP の JWT を標準機能で検証したい場合は HTTP API を優先する。
- Cognito User Pools を利用し、REST API 固有の機能が必要なら REST API も選択肢になる。
- API キー、クライアント単位のスロットリング、リクエスト検証、AWS WAF、プライベート API、キャッシュなどが必要なら REST API を検討する。
- REST API 固有の機能が不要なら、機能を絞った低価格な HTTP API を検討する。
- 標準オーソライザーで表現できない認可要件がある場合は、どちらでも Lambda オーソライザーを利用できる。

## 関連ナレッジ

- [[API Gateway HTTP API で JWT オーソライザーを設定する]]: HTTP API を選んだ後の最小構成と検証項目を確認する。

## 公式情報

- [REST API と HTTP API の選択](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html)
- [REST API の Lambda オーソライザー](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)
- [REST API と Amazon Cognito User Pool の統合](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-enable-cognito-user-pool.html)
