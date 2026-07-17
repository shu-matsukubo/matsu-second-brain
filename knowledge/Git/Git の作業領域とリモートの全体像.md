---
title: Git の作業領域とリモートの全体像
category: Git
tags:
  - Git
  - バージョン管理
updated: 2026-07-18
---

# Git の作業領域とリモートの全体像

Git の基本的な流れは、作業ツリーで変更し、インデックスに次のコミットの内容を準備し、ローカルリポジトリにコミットとして記録した後、必要に応じてリモートリポジトリと履歴をやり取りする、というものになる。

```text
リモートリポジトリ
    │  fetch / push
    ▼
ローカルリポジトリ（コミット、ブランチ、リモート追跡ブランチ）
    │  commit
    ▼
インデックス（ステージングエリア）
    │  add / restore --staged
    ▼
作業ツリー（実際に編集するファイル）
```

矢印はデータの固定された一方向の流れではない。各コマンドが、どの領域を参照し、どこを更新するかを表すための概略である。

## 4つの要素

### 作業ツリー

実際にファイルを開いて編集する場所。通常は現在のコミットの内容に、まだコミットしていないローカルの変更が加わった状態になっている。

### インデックス（ステージングエリア）

次のコミットに含める内容を準備する領域。サーバーや一時環境ではなく、ローカルリポジトリ内で管理されるファイル内容の一覧である。

- `git add <file>` は、その時点のファイル内容をインデックスへ追加する。
- `git restore --staged <file>` は、通常はインデックスを `HEAD` の状態へ戻し、変更を次のコミット対象から外す。作業ツリーの編集内容は残る。
- `git commit` は、原則としてインデックスに準備された内容を新しいコミットとして記録する。

### ローカルリポジトリ

コミット、ブランチ、タグなどの履歴をローカルに保持する場所。`git commit` はここに新しいコミットを作る。`git merge` は別の開発履歴を現在のブランチへ統合する操作であり、インデックスからコミットへ移す操作ではない。

### リモートリポジトリと remote

リモートリポジトリは、GitHub など別の場所にあるリポジトリを指す。一方、`origin` や任意に追加した名前は、リモートリポジトリの URL や取得方法をローカルに記録した短縮名であり、「ローカルにあるリモートサーバー」ではない。

1つのローカルリポジトリには、`origin`、`upstream` など複数の remote を設定できる。名前は任意だが、`origin` は clone 元に自動で付くことが多い慣例的な名前である。

- `git fetch <remote>` はリモートのオブジェクトを取得し、設定に従って `origin/main` などのリモート追跡ブランチを更新する。ローカルの作業ブランチは自動では更新しない。
- `git push <remote> <branch>` はローカルのコミットと参照を送り、許可されればリモート側のブランチを更新する。
- `git pull` は fetch の後に merge または rebase で現在のブランチへ統合する複合操作である。

### fetch と push の向き

`fetch` と `push` は、ローカルリポジトリを基準に考えると分かりやすい。

```text
リモートリポジトリ ── fetch ──▶ ローカルのリモート追跡ブランチ
リモートリポジトリ ◀─ push ─── ローカルブランチ
```

引数を省略した `git push` は、常に `git push origin <現在のブランチ>` と同じになるわけではない。送信先は現在のブランチに設定された upstream、`branch.<name>.remote`、`remote.pushDefault` などから選ばれ、送信するブランチは `push.default` などの設定で決まる。既定の `simple` では、通常は現在のブランチを対応する同名の upstream ブランチへ送るが、upstream が未設定の場合などは失敗することがある。

複数の remote がある場合は、対象を明示すると安全である。

```bash
git fetch origin
git push origin main
git push remote2 main
```

## commit、merge、rebase の役割

`commit`、`merge`、`rebase` は対になる同期コマンドではなく、それぞれ役割が異なる。

### commit

`git commit` は、原則としてインデックスに準備した内容から新しいコミットを作り、現在のブランチをそのコミットへ進める。リモートリポジトリは更新しないため、共有するには別途 `git push` が必要になる。また、通常のコミットは作業ツリーのファイル内容を書き換えない。

`git commit -a` は、追跡済みファイルの変更と削除を自動的にステージしてからコミットする。インデックスを使わずにコミットする機能ではなく、未追跡の新規ファイルも対象にならない。

### merge

`git merge <branch>` は、指定したブランチの履歴を現在のブランチへ統合する。

- 現在のブランチを単純に進められる場合は、既定では fast-forward となり、新しいマージコミットを作らない。
- 履歴が分岐していて自動統合できる場合は、通常は Git がマージコミットまで作成する。常に手動の `git commit` が必要なわけではない。
- 競合した場合は処理が停止する。作業ツリーで競合を直し、`git add` で解消結果をインデックスへ登録してから、`git merge --continue` または `git commit` でマージを完了する。
- 統合を取り消す場合は `git merge --abort` を使う。ただし、開始前から未コミットの変更があると元の状態を完全に復元できない場合がある。

merge は既存コミットを残したまま履歴を統合するため、共有済みブランチでも使いやすい。

### rebase

`git rebase <upstream>` は、現在のブランチに固有のコミットを一度取り出し、`upstream` の先頭を新しい起点として順番に適用し直す。適用後のコミットは内容が同じでも新しいコミットになるため、コミットIDが変わる。

```text
変更前:  A---B---C  main
             \
              D---E  topic

rebase後: A---B---C  main
                  \
                   D'---E'  topic
```

競合すると、rebase は適用中のコミットで停止する。作業ツリーで競合を直し、`git add` で解消済みと示してから `git rebase --continue` で次へ進む。通常は利用者が別途 `git commit` を実行するのではなく、rebase が置き換え後のコミットを作る。中止する場合は `git rebase --abort`、問題のコミットを除外する場合は `git rebase --skip` を使う。

rebase は履歴を直線的にできる一方、コミットIDを書き換える。すでに他の人が利用している共有済みコミットを安易に rebase すると履歴が食い違うため、原則として未共有の自分の作業履歴を整える用途で使う。

## 状態を確認するコマンド

```bash
git status
git diff
git diff --staged
git log --oneline --graph --all
git remote -v
git branch -vv
```

- `git status` は作業ツリーとインデックスの状態を要約する。
- `git diff` は主に作業ツリーとインデックスの差分を表示する。
- `git diff --staged` はインデックスと `HEAD` の差分、つまり次のコミット候補を表示する。
- `git remote -v` は remote 名と接続先 URL を表示する。

## 公式情報

- [Git 用語集](https://git-scm.com/docs/gitglossary)
- [git add](https://git-scm.com/docs/git-add)
- [git commit](https://git-scm.com/docs/git-commit)
- [git merge](https://git-scm.com/docs/git-merge)
- [git rebase](https://git-scm.com/docs/git-rebase)
- [git restore](https://git-scm.com/docs/git-restore)
- [git remote](https://git-scm.com/docs/git-remote)
- [git fetch](https://git-scm.com/docs/git-fetch)
- [git push](https://git-scm.com/docs/git-push)
