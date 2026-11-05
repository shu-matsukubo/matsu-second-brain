# Workflow CLI契約

## 責務

| 担当 | 内容 |
| --- | --- |
| Skill | 対象範囲・意味分類・主題分割・根拠の妥当性・保留判断 |
| [brain.mjs](../scripts/brain.mjs) | 対象選択・plan検証・適用・journal再開・index生成 |
| [notion-input.mjs](../scripts/lib/notion-input.mjs) | 本文JSON・snapshot・digest・receipt・ack検証 |
| Notion MCP | 取得・状態更新・読み戻し |

## 実行

```powershell
node scripts/brain.mjs <command> [FILE.json|-]
```

- `input-record`・`input-stage`・`input-verify`・`input-ack`・`apply`: JSONファイルまたは標準入力`-`。
- `report-add`: JSONファイル。
- 一時JSONはOSのtempへ置く。作成と利用は同じshell呼出しで行う。
- 依存がなければrootと`app/viewer`でlockfileに基づき`npm ci`する。
- 依存導入の失敗を別方式で迂回しない。

## Operation plan

- 形式の正本: [validateOperationPlan](../scripts/lib/schema.mjs)。
- 適用時の意味・競合検証: [brain.mjs](../scripts/brain.mjs)。

| キー | 内容 |
| --- | --- |
| version | `1` |
| kind | `input` / `report` / `review` |
| source_id | CLIが返した主対象 |
| source_digest | CLIが返したdigest |
| writes | `path/content/expected_digest`の配列 |
| daily_status_path | `null`。旧daily journalの再開はCLIに任せる |
| moves | 必要時のみ`from_path/to_path/id/expected_digest`の配列 |

- `expected_digest`: 変更前のUTF-8内容のSHA-256。新規ファイルは空文字列のdigest。
- 移動先・関連リンクの修正を同じplanへ含める。
- `apply`が根拠・分類・履歴・競合を検証し、indexも生成する。
- journalが残ったら`resume`する。新しいplanで上書きしない。
- journal作成前の検証エラーは、原因を直して再検証する。

## Knowledgeの記述

```text
# 内容
現在の内容
## 関連リンク
直接関係するknowledgeへの相対リンク
# 根拠・思考の履歴
元日時・本人の原文・会話参照・必要な背景
```

- input由来の本文は上記の順序とする。
- 原文・日時・出典はsnapshotの値をそのまま使う。既存履歴は残して追記する。
- evidence追加分は主対象の`source_id`・`source_digest`を参照する。
- inputのevidence: `origin: user`とsnapshotの`input_key/quote/occurred_at/source_ref`を保持する。
- `direction/background/counted`は本人の意思に基づき判断する。AI収集とAI由来の意思を混同しない。
- 既存`evidence/history/sources`はappend-only。
- 本文置換時はhistoryへ`from/to/at/reason/previous_body/previous_path`を追記する。
- `previous_body`は置換前の本文全文、`previous_path`は置換前のknowledge path。
- 移動だけのMarkdownリンク更新はCLIの検証に従う。

## Report

- 形式の正本: [validateReport](../scripts/lib/schema.mjs)。
- 必須キー: `id/fingerprint/origin/kind/status/request/result/created/updated`。
- `request/result`はfrontmatterを正本とし、本文へ重複させない。
- 新規登録は`report-add`でstable ID/fingerprintを照合する。
- report planは元report自身をwritesへ含める。
- `request/body/id/fingerprint/origin/kind/created`を保持し、結果・状態・更新日を更新する。
- 不正確・重複・解消済みなら理由と確認対象を記録する。
- 失敗は箇所・影響・再開情報をfailure reportへ残す。

## 保証と限界

| 条件 | 検証元 |
| --- | --- |
| snapshot整合性・二重反映・ack順序 | [Notion入力テスト](../scripts/test/notion-input.test.mjs) |
| plan・安定ID・履歴保全・昇降格・report再開 | [CLIテスト](../scripts/test/cli.test.mjs) |
| メタデータ・plan形式 | [schemaテスト](../scripts/test/schema.test.mjs) |
| Skill形式・参照グラフ・アンカー | [構造検証](../scripts/check-skills.mjs)、[テスト](../scripts/test/skills.test.mjs) |
| Viewer indexと実データの一致 | `npm run index:check` |
| 本人の意思・開発との関係・文意・根拠の妥当性 | Skillによるレビュー |
| Notion未処理ビューが空・更新が成功 | MCP取得と読み戻し。CLIのフラグだけでは証明できない |

- 検証は非ゼロ終了で失敗を示す。
- Secrets非公開とViewerのデータ取得は[Viewer CI](../.github/workflows/viewer-ci.yml)で確認する。
