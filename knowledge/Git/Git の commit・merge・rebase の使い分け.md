---
title: Git の commit・merge・rebase の使い分け
category: Git
tags:
  - Git
  - バージョン管理
  - ブランチ
updated: 2026-07-18
---

# Git の commit・merge・rebase の使い分け

`commit` は変更を履歴へ記録し、`merge` と `rebase` は分岐した履歴を扱う。3つは対になる同期コマンドではなく、それぞれ役割が異なる。

## commit

`git commit` は、原則としてインデックスに準備した内容から新しいコミットを作り、現在のブランチをそのコミットへ進める。リモートリポジトリは更新しないため、共有するには別途 `git push` が必要になる。また、通常のコミットは作業ツリーのファイル内容を書き換えない。

`git commit -a` は、追跡済みファイルの変更と削除を自動的にステージしてからコミットする。インデックスを使わずにコミットする機能ではなく、未追跡の新規ファイルも対象にならない。

## merge

`git merge <branch>` は、指定したブランチの履歴を現在のブランチへ統合する。

- 現在のブランチを単純に進められる場合は、既定では fast-forward となり、新しいマージコミットを作らない。
- 履歴が分岐していて自動統合できる場合は、通常は Git がマージコミットまで作成する。常に手動の `git commit` が必要なわけではない。
- 競合した場合は処理が停止する。作業ツリーで競合を直し、`git add` で解消結果をインデックスへ登録してから、`git merge --continue` または `git commit` でマージを完了する。
- 統合を取り消す場合は `git merge --abort` を使う。ただし、開始前から未コミットの変更があると元の状態を完全に復元できない場合がある。

merge は既存コミットを残したまま履歴を統合するため、共有済みブランチでも使いやすい。

## rebase

`git rebase <upstream>` は、現在のブランチに固有のコミットを一度取り出し、`upstream` の先頭を新しい起点として順番に適用し直す。適用後のコミットは内容が同じでも新しいコミットになるため、コミット ID が変わる。

```text
変更前:  A---B---C  main
             \
              D---E  topic

rebase後: A---B---C  main
                  \
                   D'---E'  topic
```

競合すると、rebase は適用中のコミットで停止する。作業ツリーで競合を直し、`git add` で解消済みと示してから `git rebase --continue` で次へ進む。通常は利用者が別途 `git commit` を実行するのではなく、rebase が置き換え後のコミットを作る。中止する場合は `git rebase --abort`、問題のコミットを除外する場合は `git rebase --skip` を使う。

rebase は履歴を直線的にできる一方、コミット ID を書き換える。すでに他の人が利用している共有済みコミットを安易に rebase すると履歴が食い違うため、原則として未共有の自分の作業履歴を整える用途で使う。

## 選び方

- 作業内容を新しい履歴として記録するなら `commit` を使う。
- 共有済みの分岐履歴を保持したまま統合するなら `merge` を使う。
- 未共有の自分のコミットを新しい起点へ並べ直し、履歴を直線的にするなら `rebase` を使う。

## 関連ナレッジ

- [[Git でコミットに含める差分を選ぶ]]: ファイル単位・hunk 単位で変更をステージし、commit の対象を確認する。
- [[Git の作業領域とリモートの全体像]]: commit が参照するインデックスや、push・fetch の更新方向を確認する。

## 公式情報

- [git commit](https://git-scm.com/docs/git-commit)
- [git merge](https://git-scm.com/docs/git-merge)
- [git rebase](https://git-scm.com/docs/git-rebase)
