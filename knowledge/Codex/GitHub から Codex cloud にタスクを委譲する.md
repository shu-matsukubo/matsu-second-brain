---
title: GitHub から Codex cloud にタスクを委譲する
category: Codex
tags:
  - Codex
  - GitHub
  - クラウド実行
updated: 2026-07-18
---

# GitHub から Codex cloud にタスクを委譲する

Codex cloud は、リポジトリごとに用意した隔離クラウド環境でタスクをバックグラウンド実行できる。GitHub 連携後は、pull request（PR）のレビューや修正を GitHub のコメントから委譲できる。

## 事前準備

1. Codex に ChatGPT アカウントでサインインする。
2. GitHub アカウントを接続し、Codex に許可するリポジトリを選ぶ。
3. 対象リポジトリのクラウド環境を作成する。
4. タスクに必要な依存関係、ツール、環境変数、シークレット、セットアップ手順を環境に設定する。

クラウド環境の再現性が低いとタスクも失敗しやすい。リポジトリを取得した直後から、ビルドやテストを実行できる状態を目指す。

環境変数はセットアップとエージェント実行の両方で利用できる。一方、シークレットはセットアップスクリプトでのみ利用でき、エージェント実行の前に取り除かれる。エージェント自身が実行時に必要とする値を、シークレットへ登録すれば直接参照できるとは限らない。

## GitHub からの利用

GitHub の PR では、コメントによる次の操作が明示されている。

- `@codex review` でコードレビューを依頼する。
- `@codex review for security regressions` のように観点を追加する。
- `@codex fix the P1 issue` のように修正を依頼する。
- `review` 以外の指示を `@codex` に続けると、その pull request をコンテキストにしたクラウドチャットを開始する。

Code review 設定で Automatic reviews を有効にすると、対象条件に合う新しい PR をコメントなしで自動レビューできる。GitHub 上の標準レビューでは、コメントを重要なリスクに絞るため、Codex は P0 と P1 の問題だけを報告する。

現行の GitHub 連携ページは PR コメントからの起動を説明しており、issue コメント用の起動構文は明示していない。issue から直接委譲できると決めつけず、最新の設定画面と公式ドキュメントで対応状況を確認する。

## 運用上の注意

- Codex に必要最小限のリポジトリだけを許可する。
- シークレットはリポジトリに保存せず、クラウド環境の設定で管理する。
- Codex の結果はそのままマージせず、要約、差分、テスト結果を確認する。
- リポジトリ固有の指示やレビュー基準は `AGENTS.md` に記載する。
- GitHub 上で Codex が反応しない場合は、対象リポジトリの Codex cloud 設定と Code review 設定を確認する。

## 公式情報

- [Codex cloud](https://developers.openai.com/codex/cloud)
- [Codex code review in GitHub](https://developers.openai.com/codex/integrations/github)
