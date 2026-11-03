---
name: daily-to-knowledge
description: 未処理daily一件を、背景と根拠を保った独立したknowledgeへ整理し、処理済みstatusだけを更新する。
---

# Dailyをknowledgeへ反映する

統合ワークフローから渡された一件のdailyを処理する。`AGENTS.md`と`knowledge-policy/`を読み、本文・status・入力由来を確認する。入力元アプリに依存せず、daily本文を改変しない。

## 意味判断

- 入力をfacts、principles、ideasに分け、独立して参照する主題だけを作成・更新する。雑談や長期価値のない断片は保存しない。
- factは確認可能な客観的情報に限る。外部仕様は可能なら公式一次情報で確認し、URLと確認日を記録する。確認できない主張は事実として作らない。
- principle/ideaは、人間の入力に表れた意思と背景を記録する。曖昧な意思を支持・反対に数えない。AI reportは数えない。
- 5回連続の支持/反対条件を検討するとき、関連する人間由来入力だけを順に見る。無関係topicの入力は数えず、連続性も中断しない。履歴不明だけを理由に既存principleを降格しない。
- 既存knowledgeの直接関係、安定ID、topic、関連/反対リンクを確認する。既存topicを優先し、細分化や重複作成を避ける。
- 一入力を複数knowledgeへ反映するときは各主題を単独で読めるようにする。元の文章を全文複製せず、複数入力の背景と根拠は失わない。
- 既存knowledgeの本文を要約・訂正して置き換える場合は、`evidence`/`history`/`sources`の既存prefixをそのまま保持し、追記する`history` entryに`previous_body`（置換前の本文全文）と`previous_path`（置換前のknowledge path）を記録する。単なるMarkdownリンク先変更の移動では本文を保持した扱いにできる。

## 反映計画

1. 新規作成・更新・分類移動が必要なknowledgeの意味と根拠を整理する。既存ファイルを上書きせず、安定IDと期待digestを用いる。
2. 新しいknowledge frontmatterとoperation planを、実装済みCLI契約に合わせて作成する。`evidence`、`history`、`sources`、支持/反対カウンターは確認済みの入力だけから作る。不明履歴は0かつ不明として保持する。
3. dailyの更新は処理済みstatusだけとし、operation planのdaily status欄で指定する。本文その他のfrontmatterは変更しない。
4. CLIのplan検証・適用を使い、source digestや履歴検証の失敗時は変更を強行しない。indexがCLI適用時に生成される場合は別途生成しない。
5. 適用結果とknowledge間リンクを確認する。完了できない場合は未完了理由を統合親へ返し、failureをreportへ記録する。

topic keyは安定した英語識別子、表示名は利用者向けの名称とする。タイトル・ファイル移動と標準相対リンクのルールはknowledge-policyに従う。
