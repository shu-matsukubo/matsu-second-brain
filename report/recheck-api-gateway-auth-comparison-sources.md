---
id: recheck-api-gateway-auth-comparison-sources
fingerprint: knowledge:k-8d3f67394f671d3c:verify-api-gateway-auth-comparison-sources
origin: ai
kind: knowledge
status: completed
created: 2026-11-17
updated: 2026-11-17
request: 対象はknowledge/facts/aws/k-8d3f67394f671d3c.md（ID k-8d3f67394f671d3c、API
  Gateway の REST API と HTTP API における JWT 認証）。REST/HTTP
  APIのJWT・Cognito・Lambda・IAM認可の比較と、機能・費用を含む選び方を記述しAWS公式出典三件を持つが、sourcesと本文の公式情報欄に確認日がない。knowledge-policyのfactsの出典基準に沿い、AWS公式一次資料で現行の比較対象と条件を確認し、確認日と必要な本文修正を反映する改善を検討する。更新日2026-08-24を出典確認日と推測しない。認可方式の名称や対象APIを区別し、HTTP
  APIの組み込みJWT検証とREST
  APIのCognito/Lambda認可を混同しない。機能の対応状況と低価格という相対表現は条件・確認範囲を示し、未確認の仕様変更や具体的な料金を推測しない。必要な範囲で公式の比較表、JWT/Lambda/Cognito資料を確認し、確認できない項目は未確認・再開条件を残す。関連するHTTP
  API設定fact
  k-80d43c7d7d3971e7には既存の確認日と独立したCloudFormation例があり、その全体の更新・実動作検証へ広げず役割分担を保つ。AWSリソースの作成・課金操作・権限や実サービス設定の変更・deployは行わない。安定ID・題名・ファイル名・fact・topic
  aws、旧本文・元出典・関連リンクを保全し、支持反対0/0・過去履歴不明を維持する。題名の語尾だけを理由に改名せず、AI評価を本人の採用意思や支持へ数えない。
result: |-
  2026-11-17 handle-knowledge-reportでAPI Gateway認可比較のfact一件を更新した。AWS公式のREST/HTTP比較、RESTのLambda/Cognito、HTTPのJWT/Lambda、および料金資料を読んだ。汎用組み込みJWTの有無と、REST APIでのCognito/Lambda経由のJWT検証を区別し、機能・認可条件・費用の比較範囲を整理した。Private APIエンドポイントとPrivateなバックエンド統合も混同しないよう明記した。具体単価や無料枠・見積もりの更新は行わず、相対的な価格説明を設計上の位置づけとして限定した。

  公式URL六件に2026-11-17の確認を追加し、元出典三件・旧本文全文をappend-onlyで保全した。安定ID・題名・ファイル名・type fact・topic aws・関連リンク・支持反対0/0・履歴不明は維持する。追加evidenceはAI/none/counted false。関連設定fact k-80d43c7d7d3971e7の本文・CloudFormation例全体は再検証/更新していない。Indexとworkflow acknowledgementを同じ主対象として生成した。

  資料の読解であり、AWSリソース作成・実JWT試験・課金操作・権限/サービス設定変更・deployはしていない。Notion・daily・archive・policy・Skillにも変更はない。本人の採用意思とは扱わず、本人への手動補完や入力再収集は不要。Skill改善の追加提案も不要。

  以前の候補登録結果（保全）:
  2026-11-17 review-knowledgeで候補一件を登録。全144件（facts22/principles87/ideas35）のID重複、分類/topic配置差、関連・反対IDの参照不足はなく、brain validate/index:checkも成功した。対象ノートを全文確認し、認可方式の比較表、機能による選び方とHTTP APIの価格に関する相対表現がある一方、公式URL三件と本文の公式情報欄には確認日がないことを確認した。保存された記述の点検であり、今回のレビューで現在のAWS仕様や料金の正誤・変化を検証したものではない。

  関連するk-80d43c7d7d3971e7を読み、設定例と検証項目を担当する別主題で、本文に2026-08-26の確認日があることを確認した。確認日不足を理由にそのノート全体まで一括候補化していない。active/archiveの構造化report18件のID・fingerprintを照合し同一候補は未登録。現在のcanonical knowledgeを直接確認できている。対象確認時SHA-256: 0d254b18ba8bef609f0df9d11a1be5ca0d6160636e0fa18f5618c47b64f50d79。

  影響: 比較に使ったAWSの機能と認可条件がどの時点のものか追いにくく、選択判断の前提を再確認しにくい。後続の主対象一件で公式根拠と現本文を照合して必要な範囲だけ改善する。今回はAI候補reportの登録だけで、外部仕様の新規検証・knowledge・Index・state・Notion・daily・archive・policy・Skill・実サービス設定は変更していない。本人への出典探索・手動補完、入力再収集は不要。Skill改善の追加提案も不要。
---
