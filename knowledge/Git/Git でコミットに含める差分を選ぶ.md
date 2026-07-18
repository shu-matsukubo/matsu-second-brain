---
title: Git でコミットに含める差分を選ぶ
category: Git
tags:
  - Git
  - バージョン管理
  - コミット
updated: 2026-07-18
---

# Git でコミットに含める差分を選ぶ

コミットの単位を整えるには、ファイル単位または差分のまとまり（hunk）単位でステージする。ステージ後は、インデックスと `HEAD` の差分を確認してからコミットする。

## ファイル単位で選ぶ

```bash
git add path/to/file
git diff --staged
```

`git add <file>` は、その時点のファイル内容をインデックスへ追加する。ファイルをさらに編集した場合、その後の変更は自動では追加されないため、必要なら再度 `git add` を実行する。

## hunk 単位で選ぶ

```bash
git add -p
git diff --staged
```

`git add -p` は、作業ツリーとインデックスの差分を順に表示し、選んだ hunk だけをインデックスへ追加する。同じファイルに複数の作業内容が混在した場合でも、コミットに含める変更を分けながらセルフレビューできる。

## ステージから外す

```bash
git restore --staged path/to/file
```

`git restore --staged <file>` は、通常はインデックスを `HEAD` の状態へ戻し、変更を次のコミット対象から外す。作業ツリーの編集内容は残る。

対して、`--staged` を付けない `git restore <file>` は作業ツリーをインデックスの内容へ戻し、未コミットの変更を失う可能性があるため区別する。

## 広く追加する場合の確認

```bash
git add .
git status
git diff --staged
```

`git add .` は、実行したディレクトリ以下の追加・変更・削除をまとめてインデックスへ反映する。意図しないファイルを含める可能性があるため、直後に `git status` と `git diff --staged` で対象と内容を確認する。

ローカル専用ファイルが恒常的に不要なら、毎回ステージから外す運用ではなく `.gitignore` などで追跡対象を整理する。

## 関連ナレッジ

- [[Git の作業領域とリモートの全体像]]: 作業ツリー、インデックス、コミットの関係を確認する。
- [[Git の commit・merge・rebase の使い分け]]: commit と履歴統合・再構成の役割を比較する。

## 公式情報

- [git add](https://git-scm.com/docs/git-add)
- [git diff](https://git-scm.com/docs/git-diff)
- [git restore](https://git-scm.com/docs/git-restore)
