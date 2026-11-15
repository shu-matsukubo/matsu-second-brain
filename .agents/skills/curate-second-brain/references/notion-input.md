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
5. 対象外・関係不明はNotionで保留にし、理由を記録して終了する。snapshotは作らない。入力記録の不備は下記の対応不要へ進む。
6. 対象なら本文の唯一のJSON記録を`input-record`へ渡す。入力データの検証に通れば返却snapshotを`input-stage`する。本文JSONの欠落・複数存在・形式不正・必須情報不足・未知の入力元は下記の対応不要へ進む。
7. stage後にNotionを処理中へ更新する。返却kindが`input_duplicate`なら上表へ戻る。
8. 未処理なしと取得で確認できた実行だけ`next --input-empty`を実行する。

## snapshot

- `input-record`の引数: `page_id`と`markdown`を持つJSON。
- 本文JSONを正本とする。表示用プロパティから原文を再構成しない。
- フィールドと整合性は[入力実装](../../../../scripts/lib/notion-input.mjs)で検証する。

## 入力記録の不備による対応不要

- 対象はstage前の未着手入力と、同じ不備を理由に保留した未反映入力とする。snapshot・journal・receiptがある入力はこの手順で破棄せず、既存処理の再開・競合対応へ戻る。
- fetchが成功し、本文の省略や未取得部分がないことを確認してから、保存された入力記録の不備を判断する。会話参照は本文JSONの`source_ref`で確認し、表示用プロパティが空という理由だけでは除外しない。
- 更新直前にページを再取得し、対象・状態・不備が変わっていないことを確認する。本文・原文・要約・背景・入力キーを保持し、状態を`対応不要`にして、`結果`へ確認した不備とknowledgeへ未反映であることを記録する。過去の保留理由があれば履歴として残し、新方針で補完待ちを終了したことを明記する。
- 再fetchし、対応不要・除外理由・元記録の保持を確認して終了する。snapshot・receipt・input-ackは作らない。次回は未処理ビューから別の主対象を選ぶ。
- 本人へ元会話の探索や手動補完を依頼しない。表示用プロパティから本文JSONを再構成しない。対応不要を自動で未処理へ戻さず、再収集でも同じ入力キーを登録しない。
- 通信・権限・取得の失敗、取得本文の省略、CLIの起動・依存・ファイル読み取りの失敗は不備が確認できたことにならない。対応不要にせず、失敗・保留の手順で再開情報を保持する。対応不要への更新・読み戻しに失敗した場合も、除外済みと扱わない。

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
