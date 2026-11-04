---
id: k-9b3a81a9daaf7d5a
title: ドキュメントを読者と参照頻度で分ける案
type: idea
topic: development-process
topic_label: 開発プロセス
tags:
  - ドキュメント設計
  - 情報設計
updated: 2026-11-04
support_streak: 2
opposition_streak: 0
history_status: known
related: []
opposes: []
evidence:
  - direction: support
    background: 入力では、READMEを利用者向け、AGENTS.mdを開発時に常時必要なルール、docsを必要時に読む詳細設計に分け、入口を軽くして必要な情報へ辿る認知コストを下げる考えが示されている。初回入力のためideaとして保持し、継続的なprincipleへの昇格は今後の人間入力に委ねる。
    source_id: daily/2026/09/28-013303.md
    origin: user
    input_digest: 9550268778e460685d7f626e9b8d460789b084628a65d7defa0a6c4aa144e63c
    counted: true
  - direction: support
    background: Repositoryの知識を設計資料とAgentの実行時知識へ分け、後者も入口・詳細reference・再利用assetsに分ける考えを示した。配置を読者だけでなく利用目的と参照タイミングから判断する既存案を具体化している。
    source_id: daily/2026/10/05-011649.md
    origin: user
    input_digest: 322c005752f7f99a98dc4415b62bb84e890c758f7be96849af9e643f452a6d38
    counted: true
history:
  - from: idea
    to: idea
    at: 2026-11-04
    reason: 人間のdailyから、設計を説明するdocsとAgentの実行時知識の分離、および入口・reference・assetsの役割を追記した。
sources: []
---

# ドキュメントを読者と参照頻度で分ける案

Repository内の文書を、読者と読み込み頻度に応じて別の入口へ配置する案。READMEには利用者向け情報、AGENTS.mdには作業時に繰り返し必要な規則、docsには必要なとき参照する詳細設計を置く。入口には頻出情報と詳細への導線を保ち、情報量ではなく必要情報へ到達する認知コストを下げる。

## 配置目的とAgentの実行知識

Repositoryの知識はすべてdocsへ集約せず、「なぜその設計なのか」を説明する資料と、Agentが作業時に参照する振る舞い・生成・検証の知識を用途で分ける。Agent向け知識は入口を薄く保ち、詳細手順はreferences、再利用する雛形はassetsへ分ける。同じ内容をdocsとAgent Instructionsへ重複させず、いつ何のために使うかに沿って配置する。
