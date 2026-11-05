---
name: collect-conversation-input
description: 前日のCodex会話から開発に直接関係する本人の意思だけを抽出し、Notion inputへ重複なく登録する。knowledge整理は行わない。
---

# 会話からNotion inputへ収集する

実行日をAsia/Tokyoで求め、前日の00:00以上、当日00:00未満を対象にする。接続先はconfig/notion-input.json。Notionのガイドと有効Skillを確認し、全MCP呼出しに現在のinstructions_versionを付ける。

収集前に[対象範囲の判断基準](../curate-second-brain/references/input-scope.md)を読み、開発に関する本人の意思・考えだけを扱う。収集処理ではknowledge整理や既存項目の変更を行わない。

1. `node scripts/collect-codex-inputs.mjs --day YYYY-MM-DD --out <OSのtempのJSON>`を実行する。本人の発言だけを出力しguardian/subagent、AGENTS、Skill、システム注入を除く。元の発言日時で対象を判定する。終了コードとerrorsを確認し、失敗を成功と報告しない。未知のログ形式へ独断で対象を広げない。
2. 対象範囲に合う本人の発言を抽出する。AI回答、引用、例示、第三者の意見を本人の意思と扱わない。秘密情報は登録しない。
3. 本人の一発言を一inputとし、その発言内の開発に関する複数の意思を漏らさずまとめる。原文は開発に関する必要部分だけを原文のまま残す。「これ」「今回は」等は前後の本人発言から背景を補い、推定しかできない場合は不足を報告する。要約は確度・条件・肯定/否定を変えない。
4. 入力キーは`codex|<message_id>`。元メッセージIDで識別し、forkでも同じ発言を再登録しない。要約や収集日をキーにしない。keys_view_urlをviewモードでページ送りして既存キーと照合し、完了・保留も含め既存なら再作成しない。収集内も重複排除する。作成タイムアウト後は先にキー照会する。
5. DBをfetchし、create_pagesで「名前=短い主題」「状態=未処理」「入力キー」「入力元=codex」「発言日時=元日時」「原文」「要約」「背景」「会話参照=source_refとmessage_id」を保存する。DATEはschemaのdate:発言日時:startとdate:発言日時:is_datetimeを使い、「発言順」には元日時をUTC ISO文字列（秒を含む）にして保存する。既存項目の状態を変更しない。
6. 本文に`## 入力記録`とJSONコードブロック一つを置く。JSONはinput_key/source/source_ref/occurred_at/quote/summary/contextだけ。sourceはcodex。元の日時・原文・出典をそのまま格納し、Markdownとして加工しない。プロパティは一覧用、本文JSONは取り込みの正本とする。
7. 作成ページをfetchし本文JSONとプロパティの原文・日時・キー・未処理状態、および対象外の情報が混入していないことを検証する。候補がなければ作らない。対象期間、追加/重複/対象外の件数、取得不能な範囲を報告し、取得失敗を候補なしと扱わない。対象外の内容を報告へ転載せず、会話全文をリポジトリやNotionへコピーしない。

ChatGPT cloud用の同じ登録契約はprompts/collect-chatgpt-input.mdに置く。cloud側は実際に読めるChatGPT履歴を使い、このPCのsessionを読めると仮定しない。
