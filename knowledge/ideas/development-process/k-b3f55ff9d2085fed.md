---
id: k-b3f55ff9d2085fed
title: 第2の脳に前日のCodex・ChatGPT会話から本人の意思を集める案
type: idea
topic: development-process
topic_label: 開発プロセス
tags:
  - 第2の脳
  - Codex
  - ChatGPT
  - 定期収集
updated: 2026-11-09
support_streak: 0
opposition_streak: 0
related:
  - k-7652ec730db0f40b
  - k-ab614d0c94cb9205
  - k-0e22ca83ac708e37
opposes: []
evidence:
  - source_id: notion:40f013b8-a22b-81a4-b2e8-eaa339382088
    input_digest: b3f55ff9d2085fed4bbf991ba507bb5d846fee6074e21d5d6db53950eb0cbb33
    input_key: codex|msg_01a1a75d-4343-7581-b702-0ca2839d671b
    quote: "メモのinputの人間由来もやめようと思っています。

      inputには、Codex側のチャットはCodexのスケジューラで。

      chatGPT\n"
    occurred_at: 2026-11-04T16:21:09.571Z
    source_ref: 01a1a6b3-fc3e-7223-ad16-b011c44d89cd
    origin: user
    direction: none
    background: 第2の脳の入力経路をNotionへ移す検討中の発言。CodexのチャットはCodexのスケジューラで集める意向を示した。末尾のChatGPTへの言及は未完だった。
    counted: false
  - source_id: notion:40f013b8-a22b-8135-b011-cc66cb0da663
    input_digest: 0e22ca83ac708e37febc423198f1bfec52423aa1217ff9ee50dcf4ef142e5a12
    input_key: codex|msg_01a1a761-50aa-7520-a521-45ef4e0473aa
    quote: "メモのinputの人間由来もやめようと思っています。

      inputには、Codex側のチャットはCodexのスケジューラで。

      chatGPT側のチャットはcloudのチャットGPT側のスケジューラから取得

      毎日動いて、前日の履歴から、人間側の意思、考えを抜き出してinputにいれる

      AWSのS3使って見たいと話していたら、AWSS3を使って見たいと話していた。みたいなinputをNotionに保存。

      って感じですね。

      あくまでこっちが言ったことだけをinputに保存。

      knowledgeの内容は、

      knowledge内容を簡潔に。

      その下に、そのknowledge内容の由来となったユーザーの会話、意思決定を日付とともに履歴みたいな感じで入れていく。

      って感じがいいかなって思ってる。履歴は一番最後とかで（関連リンクよりさらに下かな。）


      って感じにしようかなって思ってるんだけどどうだろう。

      あくまで人間意思だけ拾ってNotionにいれていく。それをもとにナレッジを入れる。根拠は一番最後に履歴みたいな感じで入れるって方針なんだけど。\n"
    occurred_at: 2026-11-04T16:25:35.146Z
    source_ref: 01a1a6b3-fc3e-7223-ad16-b011c44d89cd
    origin: user
    direction: none
    background: 本人は前の発言で途切れていたChatGPT側の方法を補い、CodexとChatGPTがそれぞれ前日の会話から本人の意思や考えを抽出してNotionへ集める案を説明した。AWS S3は入力の書き方を示す例だった。
    counted: false
history:
  - from: idea
    to: idea
    at: 2026-11-09
    reason: 後続の本人発言でChatGPT側の取得経路と日次の抽出条件が具体化した。
    previous_body: "# 内容\r

      \r

      第2の脳へのメモの手入力をやめ、Codexのチャットから入力候補をスケジューラで集める案。Notionへの入力経路を検討していたときに、本人がこの案を挙げた。この発言ではChatGPT側の収集方法は具体化していない。\r

      \r

      ## 関連リンク\r

      \r

      - [第2の脳は入力窓口と整理済み知識の正本を分ける](../../principles/development-process/k-7652ec730db0f40b.md)\r

      - [Codexの開発作業完了時に知識候補を抽出する案](k-ab614d0c94cb9205.md)\r

      \r

      # 根拠・思考の履歴\r

      \r

      - 発言日時: 2026-11-04T16:21:09.571Z\r

      - 会話参照: 01a1a6b3-fc3e-7223-ad16-b011c44d89cd\r

      - 入力: notion:40f013b8-a22b-81a4-b2e8-eaa339382088\r

      - 入力キー: codex|msg_01a1a75d-4343-7581-b702-0ca2839d671b\r

      - 背景: 第2の脳の入力経路をNotionへ移す検討中の発言。CodexのチャットはCodexのスケジューラで集める意向を示した。末尾のChatGPTへの言及は未完だった。\r

      \r

      本人の原文\r

      \r

      ```text\r

      メモのinputの人間由来もやめようと思っています。\r

      inputには、Codex側のチャットはCodexのスケジューラで。\r

      chatGPT\r

      ```\r\n"
    previous_path: knowledge/ideas/development-process/k-b3f55ff9d2085fed.md
sources: []
---
# 内容

第2の脳へのメモの手入力をやめ、CodexとクラウドのChatGPTでそれぞれのスケジューラを毎日動かす案。前日の会話から本人が述べた意思や考えを抽出し、Notion inputへ入れて整理工程に渡す。

## 関連リンク

- [第2の脳は入力窓口と整理済み知識の正本を分ける](../../principles/development-process/k-7652ec730db0f40b.md)
- [Codexの開発作業完了時に知識候補を抽出する案](k-ab614d0c94cb9205.md)
- [第2の脳の知識ノート末尾に根拠の履歴を残す案](k-0e22ca83ac708e37.md)

# 根拠・思考の履歴

- 発言日時: 2026-11-04T16:21:09.571Z
- 会話参照: 01a1a6b3-fc3e-7223-ad16-b011c44d89cd
- 入力: notion:40f013b8-a22b-81a4-b2e8-eaa339382088
- 入力キー: codex|msg_01a1a75d-4343-7581-b702-0ca2839d671b
- 背景: 第2の脳の入力経路をNotionへ移す検討中の発言。CodexのチャットはCodexのスケジューラで集める意向を示した。末尾のChatGPTへの言及は未完だった。

本人の原文

```text
メモのinputの人間由来もやめようと思っています。
inputには、Codex側のチャットはCodexのスケジューラで。
chatGPT
```

- 発言日時: 2026-11-04T16:25:35.146Z
- 会話参照: 01a1a6b3-fc3e-7223-ad16-b011c44d89cd
- 入力: notion:40f013b8-a22b-8135-b011-cc66cb0da663
- 入力キー: codex|msg_01a1a761-50aa-7520-a521-45ef4e0473aa
- 背景: 本人は前の発言で途切れていたChatGPT側の方法を補い、CodexとChatGPTがそれぞれ前日の会話から本人の意思や考えを抽出してNotionへ集める案を説明した。AWS S3は入力の書き方を示す例だった。

本人の原文

```text
メモのinputの人間由来もやめようと思っています。
inputには、Codex側のチャットはCodexのスケジューラで。
chatGPT側のチャットはcloudのチャットGPT側のスケジューラから取得
毎日動いて、前日の履歴から、人間側の意思、考えを抜き出してinputにいれる
AWSのS3使って見たいと話していたら、AWSS3を使って見たいと話していた。みたいなinputをNotionに保存。
って感じですね。
あくまでこっちが言ったことだけをinputに保存。
knowledgeの内容は、
knowledge内容を簡潔に。
その下に、そのknowledge内容の由来となったユーザーの会話、意思決定を日付とともに履歴みたいな感じで入れていく。
って感じがいいかなって思ってる。履歴は一番最後とかで（関連リンクよりさらに下かな。）

って感じにしようかなって思ってるんだけどどうだろう。
あくまで人間意思だけ拾ってNotionにいれていく。それをもとにナレッジを入れる。根拠は一番最後に履歴みたいな感じで入れるって方針なんだけど。
```
