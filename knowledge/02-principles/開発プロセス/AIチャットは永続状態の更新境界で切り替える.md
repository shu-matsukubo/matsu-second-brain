---
title: AIチャットは永続状態の更新境界で切り替える
type: principle
topic: 開発プロセス
tags:
  - AIチャット
  - 永続状態
  - Source of Truth
updated: 2026-09-01
---

# AIチャットは永続状態の更新境界で切り替える

AIチャット自体をSource of Truthにせず、Requirement、Design、コード、PRなどの永続状態を正本として扱う。これらの状態が更新されたら、必要に応じてチャットを終了し、新しいチャットで最新の永続状態を読み直してから作業計画を立てる。

チャットを切り替える基準は会話の長さではなく、永続状態だけから安全に作業を再開できるかどうかとする。特に設計変更後は、設計をmergeし、最新のRequirement・コード・Designを読み直して実装へ進む。

## 関連

- [長寿命なCoreを短寿命なClientへ依存させない](長寿命なCoreを短寿命なClientへ依存させない.md)
