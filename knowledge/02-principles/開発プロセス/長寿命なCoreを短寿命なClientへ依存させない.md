---
title: 長寿命なCoreを短寿命なClientへ依存させない
type: principle
topic: 開発プロセス
tags:
  - アーキテクチャ
  - 正本
  - 依存関係
updated: 2026-08-31
---

# 長寿命なCoreを短寿命なClientへ依存させない

長期的に維持するデータ、構造、運用ルールをCoreとして、ViewerやEditorなどの利用ツールをClientとして分離する。Coreの正本を特定のClientに置かず、利用ツールが変わってもCoreを変更せずに済む構造を優先する。

第二の脳では、Markdownと運用ルールをCoreの正本とし、ViewerやEditorはClientとして扱う。

## 関連

- [AIチャットは永続状態の更新境界で切り替える](AIチャットは永続状態の更新境界で切り替える.md)
