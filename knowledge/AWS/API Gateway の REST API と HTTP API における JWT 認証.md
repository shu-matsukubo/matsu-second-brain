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

## HTTP API の最小構成例

CloudFormation では、HTTP API に JWT オーソライザーを作成し、保護するルートから参照する。次は既存の `HttpApi` と `ApiIntegration` に追加する最小例である。

```yaml
JwtAuthorizer:
  Type: AWS::ApiGatewayV2::Authorizer
  Properties:
    ApiId: !Ref HttpApi
    Name: app-jwt-authorizer
    AuthorizerType: JWT
    IdentitySource:
      - $request.header.Authorization
    JwtConfiguration:
      Issuer: https://id.example.com/
      Audience:
        - https://api.example.com

ProtectedRoute:
  Type: AWS::ApiGatewayV2::Route
  Properties:
    ApiId: !Ref HttpApi
    RouteKey: GET /profile
    Target: !Sub integrations/${ApiIntegration}
    AuthorizationType: JWT
    AuthorizerId: !Ref JwtAuthorizer
    AuthorizationScopes:
      - profile:read
```

`Issuer` は IdP の発行者識別子と完全に一致させ、`Audience` にはこの API 向けトークンの受信者を設定する。クライアントは通常、`Authorization: Bearer <token>` でアクセストークンを送る。`AuthorizationScopes` を複数指定すると OR 条件になるため、複数権限をすべて必須にする場合はバックエンドでも検証する。

設定後は、少なくとも有効なトークン、期限切れ、issuer 不一致、audience 不一致、スコープ不足、トークンなしを試し、保護対象の全ルートにオーソライザーが設定されていることを確認する。

## JWT オーソライザー利用時の注意

- API 認可には、可能なら ID トークンではなくアクセストークンを使う。
- ルートに認可スコープを設定し、必要な権限を持つアクセストークンだけを受け入れる。複数のスコープを設定した場合は、そのうち少なくとも1つをトークンが持てば通過するため、すべてを必須にしたい認可はバックエンドで追加する。
- issuer と audience を IdP の設定に合わせる。API Gateway は `aud` があれば `aud` を検証し、`aud` がない場合だけ `client_id` を検証する。両方を含むトークンでは `aud` が優先される。
- `exp`、`nbf`、`iat` の時刻クレームも検証される。期限切れだけでなく、まだ有効でないトークンや未来の発行時刻を持つトークンも拒否される。
- 現在、組み込み JWT オーソライザーが対応する署名方式は RSA 系に限られる。IdP が EC 系など別の方式を使う場合は、そのまま利用できない。
- API Gateway が取得する公開鍵のキャッシュを考慮し、署名鍵のローテーション時は新旧の鍵を併用する猶予期間を設ける。
- 検証後のクレームはバックエンドへ渡される。テナント、所有者、リソース単位などの業務認可は、必要に応じてバックエンドでも行う。
- 対応する署名アルゴリズムや公開鍵キャッシュなどの制約は、導入時にも公式資料で確認する。

## 公式情報

- [REST API と HTTP API の選択](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-vs-rest.html)
- [HTTP API の JWT オーソライザー](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)
- [AWS::ApiGatewayV2::Authorizer](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-apigatewayv2-authorizer.html)
- [REST API の Lambda オーソライザー](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html)
- [REST API と Amazon Cognito User Pool の統合](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-enable-cognito-user-pool.html)
