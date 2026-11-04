---
name: curate-second-brain
description: Notion input・report対応・knowledge評価を優先順に一件処理し、反映とNotion完了通知を安全に再開する。
---

# 第2の脳の統合ワークフロー

意味判断はAGENTS.mdとknowledge-policy、選択・検証・適用は `node scripts/brain.mjs` を使う。接続先は `config/notion-input.json`。Notionのガイドを読み、全MCP呼出しに現在のinstructions_versionを付ける。

## 入力の選択と再開

1. `next` を実行する。resumeなら `node scripts/brain.mjs resume` でjournalから同じ処理を再開する。元temp planを探したり内容を再生成したりしない。再開した主対象の完了通知まで行って終了する。
2. input_ackならローカル反映済み。以下のNotion完了通知だけ再試行し、knowledgeや支持回数を再適用しない。
3. inputなら処理中snapshotがある。Notionを再取得し、同じ内容から作るsnapshotを `input-verify FILE.json` で確認して[input-to-knowledge](../input-to-knowledge/SKILL.md)へ進む。
4. input_fetchなら `query_data_sources` の `data: {mode: "view", view_url: <pending_view_url>, page_size: 1}` で最古の未処理を取得する。SQLや検索の結果だけに依存しない。空ページでもhas_moreならnext_cursorで進む。取得失敗を対象なしと扱わない。
5. 一件あればpage IDでfetchし、本文の唯一のJSON入力記録にpage_idを添えたsnapshotを作り `input-stage FILE.json` する。snapshotはpage_id/input_key/source/source_ref/occurred_at/quote/summary/contextだけ。プロパティのMarkdown表示から原文を再構成しない。`input-record`はpage_id/markdownのJSONを受けてsnapshotを返す。stage後にNotionを処理中へ更新する。未知の入力元や原文・日時不足は保留し理由を残す。
6. input_duplicateならreceiptの反映先を確認し、そのNotion項目を完了にするだけで終了する。失敗しても次回同じreceiptで再試行できる。更新後fetchで確認する。
7. 未処理がないと取得で確認できた実行だけ `next --input-empty` を使う。report一件は[handle-knowledge-report](../handle-knowledge-report/SKILL.md)、reviewは[review-knowledge](../review-knowledge/SKILL.md)へ進む。旧dailyは選ばない。

## 計画と完了通知

JSONを受けるCLIコマンドはファイルの代わりに`-`を指定して標準入力から渡せる。tempを使う場合は、その作成とCLI実行を同じshell呼出しで行う。別shellから同じsandbox tempへアクセスできると仮定しない。

operation planはversion: 1、kind（input/report/review）、source_id、source_digest、writes（path/content/expected_digest）、daily_status_path: nullと必要なmoves。report planは元report自身をwritesへ含め、request/bodyとid/fingerprint/origin/kind/createdを保持する。移動は安定IDと移動元expected_digestを付け、移動先と関連リンクを同じplanへ含める。一時JSONはOSのtempへ置く。`apply PLAN.json` が根拠・分類・履歴・競合を検証しindexも生成する。任意ファイルやinput本文はplanで変更しない。

nextがinput_ackを返したらNotionをfetchしてinput-verifyする。同じ内容なら「状態=完了」「反映先ID=receipt.knowledge_ids」「結果=処理説明」「完了日時=実際の日時」を更新する。再fetchで原文・日時・キー・完了状態を確認してから、page_id/input_key/source_digest/status: 完了のJSONで `input-ack FILE.json` する。入力が変わっていたら自動完了せず競合をreportへ残す。完了項目は削除しない。

失敗時は完了にせずfailure reportへ箇所・影響・再開方法を残し、journal/snapshot/receiptを保全する。Notionが使えなくてもdaily等の代替へ戻さない。依存がなければrootとapp/viewerでlockfileに基づきnpm ciし、失敗したら方式を変えない。

## 保留と評価

保留中でもNotionの未処理ビューを毎回確認する。空なら `review-state --input-empty` でローカル入力を確認し、変更がなければ探索も書き込みもしない。候補がなければ `review-complete FINGERPRINT --input-empty` で保留する。AI自身のindexやstatus/resultだけで再探索しない。pending/in_progress/reopened reportがある間はreviewへ進まない。

report-addは安定ID/fingerprintで重複排除する。request/resultはfrontmatterを正本とする。未承認のpolicy/Skill変更はdeferredにし、曖昧な判断を独自ルールで補わない。主対象の完了時にSkill改善の必要性を確認し、必要な場合だけreportに提案する。自動commit/push/deployは通常運用に含めない。
