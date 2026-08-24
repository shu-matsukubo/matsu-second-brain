---
name: sync-knowledge-viewer
description: 第二の脳のknowledgeとChatGPT Site「第二の脳 — Knowledge Viewer」を同期する。Knowledge Viewerの同期・更新や、knowledgeの変更時だけViewerを最新化する定期処理を依頼されたときに使用する。Siteの新規作成や一般的なデザイン・機能変更だけの依頼には使用しない。
---

# Knowledge Viewerを同期する

## 原則

- 同期元は現在のコミットに含まれる `knowledge` とし、未コミットの内容を公開しない。
- 対象は `knowledge-viewer/.openai/hosting.json` の `project_id` が示す既存Siteとする。別のSiteを作成しない。
- 現在バージョンには `git rev-parse HEAD:knowledge` で得るGit tree SHAを使用する。
- 前回同期バージョンは、Git管理された `.deploy/knowledge-viewer-tree.txt` の1行に保持する。
- Automationは状態コミットが次回実行からも見えるローカルプロジェクトで実行し、分離worktreeを使用しない。
- Siteの作成・編集・検証は公式の `sites-building`、公開と公開結果の確認は公式の `sites-hosting` に委ねる。このSkillへ同じ操作手順を重複して定義しない。
- `knowledge`、Viewerの機能、デザイン、公開範囲を同期の都合で変更しない。

## 変更を判定する

1. リポジトリルートで実行し、`knowledge-viewer/.openai/hosting.json` と既存の `project_id` を確認する。見つからない場合はSiteを作成せず終了する。
2. `knowledge` に未コミットまたは未追跡の変更がないことを確認する。変更がある場合は同期せず終了する。
3. `git rev-parse HEAD:knowledge` で現在のtree SHAを取得する。取得できない場合は同期せず終了する。
4. 前回値は `git show HEAD:.deploy/knowledge-viewer-tree.txt` でコミット済みの状態ファイルから読む。`.deploy` または状態ファイルがまだ存在しない場合は未同期として扱う。
5. 前回値と現在値が同じなら、Site、状態ファイル、コミットを変更せず終了する。

## Viewerを更新する

1. 公式の `sites-building` を使用し、`knowledge-viewer` の既存生成処理で現在の `knowledge` を反映してビルドを検証する。内容の同期に不要な変更は行わない。
2. ビルドが成功した場合だけ、公式の `sites-hosting` を使用して同じ `project_id` のSiteへ公開する。
3. 公式の公開確認が成功を返すまで、同期成功として扱わない。
4. ビルド、公開、公開確認のいずれかが失敗した場合は、状態ファイルを変更せず終了する。

## 同期状態を確定する

1. 公開確認が成功した後だけ、`.deploy` がなければ作成し、現在のtree SHAと改行を `.deploy/knowledge-viewer-tree.txt` へ書き込む。
2. この状態ファイルだけをステージし、同期状態の更新としてコミットする。既存の無関係な変更を含めない。
3. 状態の書き込みまたはコミットに失敗した場合は、Siteは更新済みでも同期状態は未確定として報告する。前回コミット済みの値は進めない。
4. 前回値、現在値、Siteを更新したか、成功時は公開URLを簡潔に報告する。変更がない場合は更新不要だったことだけを報告する。
