---
id: k-a44acbf0d76b5cf8
title: 実行プロンプトは簡潔にし、継続的な手順はSkillに置く
type: principle
topic: development-process
topic_label: 開発プロセス
tags:
  - プロンプト
  - Skill
  - スケジューラ
updated: 2026-11-10
support_streak: 1
opposition_streak: 0
related:
  - k-cfb0bb408a84ca5f
  - k-b3f55ff9d2085fed
opposes: []
evidence:
  - source_id: notion:40f013b8-a22b-81de-ab46-d971a3605315
    input_digest: a44acbf0d76b5cf8e01857d1941afbf177ee1dbcc33a373185be4293c70ee284
    input_key: codex|msg_01a1abef-a8da-7b80-a299-e695d752c077
    quote: "そうしましたらさらに、おそらくスケジューラのプロンプトに書きすぎな気がしています。\nスケジューラのプロンプトは基本的に簡潔に。skillsのほうに開発情報は寄せていく方針にしたいです。\nチャット用プロンプトは多少しょうがないですが。冗長にならないようにはしたいですね。\nフローはプロンプト（スケジューラのプロンプトも含む）ではなく、skillsなど見えるところに残したい。という方針です。\n可能でしょうか。すべてに言えると思います。\n"
    occurred_at: 2026-11-05T13:39:32.698Z
    source_ref: 01a1a6b3-fc3e-7223-ad16-b011c44d89cd
    origin: user
    direction: support
    background: スケジューラのプロンプトに手順を書きすぎていると感じた本人が、継続的なフローを参照できる場所に残す方針を全般に適用したいと述べた。
    counted: true
history: []
sources: []
---
# 内容

スケジューラを含む実行プロンプトは、目的、呼び出すSkill、作業場所、今回の指定に絞る。繰り返し使う手順や判断条件は、後から参照できるSkillやその参照資料に置く。Skillを参照できないチャット環境では、実行に必要な手順と接続情報をプロンプトに含める。

## 関連リンク

- [Workflowは実行契機から独立させる](k-cfb0bb408a84ca5f.md)
- [第2の脳に前日のCodex・ChatGPT会話から本人の意思を集める案](../../ideas/development-process/k-b3f55ff9d2085fed.md)

# 根拠・思考の履歴

- 発言日時: 2026-11-05T13:39:32.698Z
- 会話参照: 01a1a6b3-fc3e-7223-ad16-b011c44d89cd
- 入力: notion:40f013b8-a22b-81de-ab46-d971a3605315
- 入力キー: codex|msg_01a1abef-a8da-7b80-a299-e695d752c077
- 背景: スケジューラのプロンプトに手順を書きすぎていると感じた本人が、継続的なフローを参照できる場所に残す方針を全般に適用したいと述べた。

本人の原文

```text
そうしましたらさらに、おそらくスケジューラのプロンプトに書きすぎな気がしています。
スケジューラのプロンプトは基本的に簡潔に。skillsのほうに開発情報は寄せていく方針にしたいです。
チャット用プロンプトは多少しょうがないですが。冗長にならないようにはしたいですね。
フローはプロンプト（スケジューラのプロンプトも含む）ではなく、skillsなど見えるところに残したい。という方針です。
可能でしょうか。すべてに言えると思います。
```
