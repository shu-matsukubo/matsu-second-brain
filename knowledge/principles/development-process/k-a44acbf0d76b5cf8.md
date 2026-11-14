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
updated: 2026-11-15
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
    quote: |
      そうしましたらさらに、おそらくスケジューラのプロンプトに書きすぎな気がしています。
      スケジューラのプロンプトは基本的に簡潔に。skillsのほうに開発情報は寄せていく方針にしたいです。
      チャット用プロンプトは多少しょうがないですが。冗長にならないようにはしたいですね。
      フローはプロンプト（スケジューラのプロンプトも含む）ではなく、skillsなど見えるところに残したい。という方針です。
      可能でしょうか。すべてに言えると思います。
    occurred_at: 2026-11-05T13:39:32.698Z
    source_ref: 01a1a6b3-fc3e-7223-ad16-b011c44d89cd
    origin: user
    direction: support
    background: スケジューラのプロンプトに手順を書きすぎていると感じた本人が、継続的なフローを参照できる場所に残す方針を全般に適用したいと述べた。
    counted: true
  - source_id: notion:410013b8-a22b-8159-b757-d2b39160b9af
    input_digest: be7e42ad751c10fd43e680fae896cdcbf219c27fe9b7e4979f2af4c8f185ad30
    input_key: codex|msg_01a1ac7d-abf7-7f32-952f-b09e69105c82
    quote: |
      簡潔な、チャット用のプロンプトはどうしましょう
    occurred_at: 2026-11-05T16:14:39.607Z
    source_ref: 01a1a6b3-fc3e-7223-ad16-b011c44d89cd
    origin: user
    direction: none
    background: 同じ会話で先に示した簡潔な実行プロンプトの方針を受け、ChatGPT用の収集プロンプトの文面を再確認した。具体的な文面の相談の継続であり、新たな独立した方針支持や反対としては計数しない。
    counted: false
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

### ChatGPT用の簡潔な収集プロンプトの再確認

- 発言日時: 2026-11-05T16:14:39.607Z
- 会話参照: 01a1a6b3-fc3e-7223-ad16-b011c44d89cd
- 入力: notion:410013b8-a22b-8159-b757-d2b39160b9af
- 入力キー: codex|msg_01a1ac7d-abf7-7f32-952f-b09e69105c82
- 背景: 同じ会話の先行する本人発言で、ワークスペースが見えないChatGPT向けに、プロンプトとNotionプラグインだけで開発関連の意思をinput登録できる文面を希望している。また、実行プロンプトは簡潔にし、継続的なフローをSkillへ寄せたいと述べている。その流れでチャット用プロンプトを再確認した発言。
- 計数: 同じ会話での収集プロンプト相談の継続として記録し、新たな独立した方針支持や反対には計数しない。

本人の原文

```text
簡潔な、チャット用のプロンプトはどうしましょう
```
