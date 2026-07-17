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
- [git restore](https://git-scm.com/docs/git-restore)
- [git remote](https://git-scm.com/docs/git-remote)
- [git fetch](https://git-scm.com/docs/git-fetch)
