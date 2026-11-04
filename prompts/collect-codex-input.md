# Codexの収集タスク

毎日07:00（Asia/Tokyo）にローカル実行する。

```text
C:/work/10_second-brain/matsu-second-brain を作業場所とし、$collect-conversation-input を使用する。現在のAGENTS.md、Skill、config/notion-input.jsonを確認し、Asia/Tokyoの前日の本人のCodex会話から、希望・比較・否定・保留・決定を広く抽出してNotion inputへ登録する。ローカルsessionの取得スクリプトを使い、内部エージェントや非対話CLIの記録を本人の発言に混ぜない。入力キーで既存・今回内の重複を除き、本文のJSON入力記録とプロパティを保存して読み戻す。knowledge整理は行わない。取得失敗を候補なしと扱わず、追加・重複件数と取得不能な範囲を報告する。
```
