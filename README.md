# 第2の脳

```text
本人の会話 → Notion input → knowledge Markdown → index → Viewer
               収集             一件ずつ整理
```

## 構成

| 場所 | 責務 |
| --- | --- |
| [Notion input](https://app.notion.com/p/9e7aaa31478844e0b828515a8df463fb) | 入力キュー。未処理・処理中・完了・保留・エラー |
| [knowledge/](knowledge/) | 整理済み知識の正本 |
| [knowledge-policy/](knowledge-policy/) | 人間が定める整理・改善方針 |
| [report/](report/) | 改善候補・依頼・対応結果 |
| [state/](state/) | 処理中の一件・反映台帳・再開情報 |
| [indexes/](indexes/) | Markdownから再生成する閲覧・検索データ |
| [app/viewer/](app/viewer/README.md) | knowledge閲覧アプリ |
| [daily/](daily/) | 旧入力の保全用アーカイブ |

## 入力範囲

- 開発に直接関係する本人の希望・比較・否定・迷い・保留・撤回。
- 開発に関する雑談・感想・疑問形の評価も含む。
- 資産運用・投資判断など対象外の情報は、原文・要約・背景にも含めない。
- [対象範囲の判断基準](.agents/skills/curate-second-brain/references/input-scope.md)を収集・整理で共用する。
- 完了inputは未処理ビューから除外し、削除せず保持する。

## 定期処理

| 処理 | 実行 | 入口 |
| --- | --- | --- |
| Codex収集 | 毎日07:00、Asia/Tokyo。`codex-notion-input`。PC・アプリの起動が必要 | [プロンプト](prompts/collect-codex-input.md) / [Skill](.agents/skills/collect-conversation-input/SKILL.md) |
| ChatGPT cloud収集 | 毎日07:10を推奨。既存の履歴取得タスクへ設定 | [コピー用プロンプト](prompts/collect-chatgpt-input.md) |
| 整理 | 既存の「第二の脳の継続改善」。間隔・通知・実行先はアプリ設定を参照 | [プロンプト](prompts/curate-second-brain.md) / [Skill](.agents/skills/curate-second-brain/SKILL.md) |

- cloud側タスクは未作成。ローカル用ツールからは作成しない。
- 実行プロンプトは作業場所・目的・Skill呼出しに絞る。
- cloud用だけは、単独実行に必要な手順を含める。

## 手動実行

```powershell
npm ci
npm --prefix app/viewer ci
node scripts/brain.mjs next
```

| nextの結果 | 次の処理 |
| --- | --- |
| resume | 保存済みjournalを再開 |
| input / input_ack | 固定中inputの整理 / Notion完了通知 |
| input_fetch | Notion未処理ビューを取得 |
| report | 改善候補一件へ対応 |
| review | knowledge全体を評価し候補を登録 |
| null | 変更なしで終了 |

- 未処理ビューが空と確認できた実行だけ`next --input-empty`へ進む。
- 取得失敗を空と扱わない。
- [選択と完了通知](.agents/skills/curate-second-brain/references/notion-input.md) / [CLI契約](docs/workflow-contract.md)を使う。

## 保存と再開

| 条件 | 処理 |
| --- | --- |
| Notion登録 | [接続設定](config/notion-input.json)の保存済みビューで照合・ページ送り |
| 原文・日時・出典 | ページ本文の唯一のJSONコードブロックを正本とする |
| 日時順 | 「発言順」のUTC ISO文字列を使用。DATE表示の丸めを避ける |
| 処理開始 | `input-stage`で一件を固定 |
| ローカル反映 | `apply`でknowledge・根拠・履歴を検証し、indexとreceiptを生成 |
| Notion完了 | 更新を読み戻してから`input-ack` |
| journalあり | `node scripts/brain.mjs resume`。planを再生成しない |
| input_ack待ち | knowledgeを再適用せず、完了通知だけ再試行 |
| input変更 | 競合を記録し、journal・snapshot・receiptを保持 |

- Codex collectorは対話用Desktop/CLIの本人発言を対象とする。
- 非対話exec・内部エージェント・システム指示・Skill注入は除外する。
- 元発言日時で前日を判定し、fork等の再掲を重複排除する。
- 原文の一時出力はリポジトリ外へ置き、収集と読み取りを同じshell呼出しで行う。

## 変更の統合

```text
最新main → codex/ブランチ → 一件の変更・検証
         → commit・push → PR → 最新headのCI成功 → マージ
```

- [GitHub連携手順](.agents/skills/curate-second-brain/references/github-flow.md)に従う。
- CI失敗は同じブランチで修正する。差分なしならcommit・PRを作らない。
- Skill・READMEの変更は[記述方針](docs/skill-design.md)を使う。

## 旧入力

- 未処理58件はNotionへ移行済み。
- 対応・元ファイルdigest: [移行台帳](state/legacy-input-migration.json)。
- daily本文は保全済み。旧`status: new`ではなくNotionの状態を参照する。
- 再移行時は台帳と入力キーを照合し、再登録しない。

## 検証

```powershell
npm run check:skills
npm test
node scripts/brain.mjs validate
npm run index:check
npm --prefix app/viewer run check
npm --prefix app/viewer run typecheck
npm --prefix app/viewer test
npm --prefix app/viewer run build
```
