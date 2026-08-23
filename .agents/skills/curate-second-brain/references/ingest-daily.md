# daily整理

## 制約

- 1回の実行で主対象にするdailyを1ファイルに限定する。
- 対象が見つからない場合は変更せず終了する。
- `AGENTS.md` を分類と正しい状態の基準にし、条件付きの操作は `SKILL.md` から必要なreferenceだけを読む。

## 手順

1. 最も古い未処理dailyを1ファイル選ぶ。
2. 入力に含まれる独立した主題と主張を確認し、既存knowledgeとsignalsに同じ意味がないか検索する。現在の配置へまだ整えられていないknowledgeも検索対象にする。
3. `AGENTS.md` に従い、各部分をknowledge（fact・principle・idea）、signal、保存不要のいずれかへ振り分ける。分類に迷うことを理由に異なる性質を1ファイルへ混在させない。
4. knowledgeにする部分は、同じ主題のファイルがあれば1ファイル1主題を壊さない範囲で更新し、なければ現在のtypeとtopicへ小さなファイルを作成する。frontmatterは `AGENTS.md` の現在形に合わせる。
5. ideaに必要なfactは、まず既存のfactsと内容からfactと確認できる既存knowledgeを探す。見つからず、信頼できる情報源から確認でき、ideaの理解に有用な場合だけ、必要最小限のfactを別ファイルとして作成する。既存factで足りる場合や検証できない場合は作らず、大量の事実説明をidea本文へ埋め込まない。
6. knowledgeを作成または変更した場合は、その時点で `SKILL.md` のreference選択に従ってIndexとリンクの更新手順を読み、関連リンクとIndexを整える。signal候補が生じた場合だけ、同じ選択に従ってsignalsの保存手順を読んで記録する。
7. 入力の意味をknowledgeまたはsignalsへ反映したか、保存不要と根拠をもって判断できた場合だけ、dailyを `status: processed` にする。

対象dailyに複数の独立した主題が含まれる場合、処理完了に直接必要な複数の小さなknowledgeを作ってよい。別のdailyや無関係な改善へ作業を広げない。

未検証の事実主張をfactにもsignalにも安全に振り分けられず、意味を失わず処理できない場合は、dailyのstatusを変更せず理由を報告する。
