# 入力の選択と完了通知

## nextの分岐

| kind | 処理 |
| --- | --- |
| `resume` | `node scripts/brain.mjs resume`。保存済みjournalを再開し、同じ主対象の完了通知まで行う |
| `input_ack` | 下記の完了通知だけ再試行する |
| `input` | Notionを再取得し、`input-verify`後に[input整理Skill](../../input-to-knowledge/SKILL.md)を使う |
| `input_fetch` | 下記の未処理取得へ進む |
| `input_duplicate` | receiptの反映先を確認し、Notionを完了へ更新・再取得する。knowledgeを再適用しない |
| `report` | [report対応Skill](../../handle-knowledge-report/SKILL.md)を使う |
| `review` | [全体評価Skill](../../review-knowledge/SKILL.md)を使う |
| `null` | 変更せず終了する |

## 未処理取得

1. [接続設定](../../../../config/notion-input.json)の`pending_view_url`を使う。
2. `query_data_sources`へ`data: {mode: "view", view_url: <pending_view_url>, page_size: 1}`を渡す。
3. 空ページでも`has_more`なら`next_cursor`で続ける。SQL・検索だけで空と判断しない。
4. 最古の一件をpage IDでfetchし、[対象範囲](input-scope.md)を確認する。
5. 対象外・関係不明・未知の入力元・原文/日時不足はNotionで保留にし、理由を記録して終了する。snapshotは作らない。
6. 対象なら本文の唯一のJSON記録を`input-record`へ渡し、返却snapshotを`input-stage`する。
7. stage後にNotionを処理中へ更新する。返却kindが`input_duplicate`なら上表へ戻る。
8. 未処理なしと取得で確認できた実行だけ`next --input-empty`を実行する。

## snapshot

- `input-record`の引数: `page_id`と`markdown`を持つJSON。
- 本文JSONを正本とする。表示用プロパティから原文を再構成しない。
- フィールドと整合性は[入力実装](../../../../scripts/lib/notion-input.mjs)で検証する。

## 完了通知

1. `next`が`input_ack`ならNotionをfetchし、同じ本文JSONを`input-verify`する。
2. 一致すれば次のプロパティを更新する。

| プロパティ | 値 |
| --- | --- |
| 状態 | 完了 |
| 反映先ID | `receipt.knowledge_ids` |
| 結果 | 処理説明。保存対象なしの場合は理由 |
| 完了日時 | 実際の日時 |

3. 再fetchで原文・日時・キー・完了状態を確認する。
4. `page_id/input_key/source_digest/status: 完了`のJSONを`input-ack`へ渡す。
5. 入力変更があれば自動完了せず、競合をreportへ残す。完了項目は削除しない。

## 失敗・保留

- 失敗を完了にせず、箇所・影響・再開方法をfailure reportへ残す。
- journal・snapshot・receiptを保持する。元temp planの探索・再生成や手動削除はしない。
- Notion取得失敗を空と扱わず、入力元を切り替えない。
- 保留中も未処理ビューを毎回確認する。
- 空なら`review-state --input-empty`で入力変更を確認する。
- 変更なしなら探索・書き込みをしない。
- 候補なしなら`review-complete FINGERPRINT --input-empty`で保留する。
- pending/in_progress/reopened reportがある間はreviewへ進まない。
