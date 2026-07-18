---
title: API Gateway HTTP API で JWT オーソライザーを設定する
category: AWS
tags:
  - AWS
  - API Gateway
  - JWT
  - 認証認可
updated: 2026-07-18
---

# API Gateway HTTP API で JWT オーソライザーを設定する

API Gateway の HTTP API では、OIDC または OAuth 2.0 プロバイダーが発行する JWT を組み込みの JWT オーソライザーで検証できる。issuer と audience をオーソライザーへ設定し、保護対象のルートから参照する。

## CloudFormation の最小構成

次の例は、既存の `HttpApi` と `ApiIntegration` にオーソライザーと保護対象ルートを追加する。

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

`Issuer` は IdP の発行者識別子と完全に一致させ、`Audience` にはこの API 向けトークンの受信者を設定する。クライアントは通常、`Authorization: Bearer <token>` でアクセストークンを送る。

## 認可スコープとバックエンド認可

API 認可には、可能なら ID トークンではなくアクセストークンを使い、ルートに認可スコープを設定する。`AuthorizationScopes` を複数指定した場合は、そのうち少なくとも1つをトークンが持てば通過する。すべてのスコープを必須にする条件や、テナント、所有者、リソース単位の業務認可はバックエンドで追加する。

API Gateway は検証済みのクレームを統合先へ渡す。Lambda プロキシ統合では、JWT クレームを `event.requestContext.authorizer.jwt.claims` から参照できる。

## 検証される項目と制約

- `iss` は設定した issuer と一致する必要がある。
- `aud` があれば audience と照合し、`aud` がない場合だけ `client_id` を照合する。両方がある場合は `aud` が優先される。
- `exp`、`nbf`、`iat` の時刻条件が検証される。
- ルートにスコープを設定した場合は、`scope` または `scp` に少なくとも1つの一致が必要になる。
- 組み込み JWT オーソライザーが対応する署名方式は RSA 系に限られる。
- 公開鍵は最大2時間キャッシュされるため、鍵のローテーション時は新旧の鍵を併用する猶予期間を設ける。

## 動作確認

少なくとも次のケースを試し、保護対象の全ルートにオーソライザーが設定されていることを確認する。

- 有効なアクセストークン
- トークンなし
- 期限切れ
- issuer 不一致
- audience 不一致
- スコープ不足

## 関連ナレッジ

- [[API Gateway の REST API と HTTP API における JWT 認証]]: JWT の要件から REST API と HTTP API のどちらを選ぶか判断する。

## 公式情報

- [HTTP API の JWT オーソライザー](https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-jwt-authorizer.html)
- [AWS::ApiGatewayV2::Authorizer](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-apigatewayv2-authorizer.html)
- [AWS::ApiGatewayV2::Route](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-apigatewayv2-route.html)
