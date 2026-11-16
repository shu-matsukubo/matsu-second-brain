---
id: separate-notification-criteria-and-specifications
fingerprint: knowledge:k-483e48a6197921ea:separate-user-criteria-and-product-facts
origin: ai
kind: knowledge
status: completed
created: 2026-11-16
updated: 2026-11-16
request: 対象は knowledge/principles/app-development/k-483e48a6197921ea.md（ID k-483e48a6197921ea）。通知先を選ぶ本人の判断基準と、Discord/LINEの送信方式・認証・料金上限・再送などの外部仕様が一つのprincipleへ混在している。knowledge-policy/policy.mdの分類・主題分割・根拠の方針に沿って、外部仕様は公式一次情報と確認日を持つfactsへ整理し、本人の記録で裏付けられる判断と区別する改善を検討する。既存fact knowledge/facts/app-development/k-a399c0657f69c609.md などの内容を照合し、重複を増やさず、独立して参照する価値のある不足部分だけを追加・更新する。元の内容、出典、成立経緯、安定IDを保全し、必要なリンクとIndexを同時に整合させる。本人の根拠は保全済み旧入力 daily/2026/07/10-081514.md を確認し、後から加わった一般的な製品選択の助言を本人の意思と推定しない。旧保存文の公開鍵・秘密鍵に関する記述も、本人の当時の理解として履歴へ保全し、未検証の外部事実として採用しない。登録日時は実会話の発言時刻ではない。AI評価は支持・反対へ計数せず、0/0・history_status unknownを維持する。履歴不明だけを理由にprincipleを降格しない。根拠や分類の判断が残る場合は、確認できた範囲と残る論点を明示して保留できる。本人に手動補完を依頼せず、旧daily・Notionの再収集や入力状態変更は行わない。
result: |-
  2026-11-16 review-knowledgeで改善候補を登録。全143件（facts21/principles87/ideas35）の安定ID・配置・metadataを確認し、brain validate/index:checkは成功。現在の対象ノートを全文確認し、導入要件比較表と送信方法・認証情報・課金・レート制限・再送の説明がprinciple内に残り、公式リンク6件には確認日がないことを確認した。関連するLINE送信方式factは既に送信方式とメッセージ数の説明を持ち、対象principleの一部と重なる。製品仕様の正否と最新性は今回検証しておらず、移す際に一次情報で確認する。

  旧入力はprocessed、登録日時は2026-07-10 08:15:14で、DiscordかLINEを通知手段の候補に挙げ、LINEの初期準備を少し面倒と感じた保存文がある。元会話の逐語原文・発言時刻・会話IDを確認したとは扱わない。NotionでDiscordを検索して一致ページは得られず、保全済み旧入力を確認した。report/archive/reports/daily/2026/11-02.mdの中優先候補に同じ仕様混在・重複の観測があり、現ノートでも問題が残っている。active/archiveのstable ID/fingerprintを照合し、同一問題を扱う構造化reportは未登録だったため、過去観測を今回の現状態と結ぶ一件として登録した。過去の日次レポートは変更・複製していない。

  確認時SHA-256: knowledge/principles/app-development/k-483e48a6197921ea.md = 08369d2e297445d5238130fa2eeb2c3f631cbfacc71e8be22df434977b2467d6; knowledge/facts/app-development/k-a399c0657f69c609.md = fed4b0f67496e3318dd9e320bf270f8671ec35655e4d9c215abafe8ef6e0bea4; daily/2026/07/10-081514.md = 063f24856aa33e4766a61ad52895cef7000d1d9fc994055870efbfbd938d0dda; report/archive/reports/daily/2026/11-02.md = 88f28af6a1f4c81d24bad3a45361652bafd9c21835ae40fe0932b12a97680bf3。

  影響: 外部製品の仕様変更を個人の判断基準の変更と混同しやすく、同じLINE仕様を複数箇所で保守する必要がある。後続処理では、本人の確認可能な判断・旧保存文と、現時点で確認した外部事実・出典日を分けて単独で理解できる形にする。今回はAI由来の候補登録だけでknowledge・index・state・旧daily・Notionには変更していない。未処理入力の不備を対応不要にする方針とは別の、既存knowledgeの主題分割・出典保全の改善である。Skill改善の追加提案は不要。

  2026-11-16 対応完了: 元のprinciple・LINE fact・旧入力が候補登録時のSHA-256と一致することを確認した。本人の判断は旧入力で確認できる通知先候補とLINEの準備負担に限定し、旧保存文と登録日時の制約を末尾に追記した。外部仕様は公式一次情報で確認し、LINEは既存ID k-a399c0657f69c609に集約、Discord Incoming Webhookは新規fact k-e119969b83d066a3 に分離した。各factsに確認日2026-11-16と一次出典を保持した。LINEの送信トークンとv2.1発行に使う鍵を区別し、無料通数と最終的な送信可能上限も区別した。既存の一般的な用途別推奨は本人の意思とみなさず、旧本文全文をhistoryへ保全した。元の出典は削除せず、AI由来・none/countfalseの根拠を追加し、支持反対0/0・履歴不明・既存安定IDと分類を維持した。直接関係するリンクとCloudflare側のリンク説明、Indexを整合させた。Cloudflareの外部仕様は変更・再検証していない。旧daily・archive・Notionは変更せず、送信試験・採用操作・手動補完依頼も行っていない。主対象に直接必要な分割・リンク更新だけを実施し、Skill改善の追加提案は不要。
---
