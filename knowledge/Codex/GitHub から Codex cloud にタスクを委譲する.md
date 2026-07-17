---
title: GitHub から Codex cloud にタスクを委譲する
tags:
  - Codex
  - GitHub
  - クラウド実行
updated: 2026-07-18
---

# GitHub から Codex cloud にタスクを委譲する

Codex cloud は、リポジトリごとに用意した隔離クラウド環境でタスクをバックグラウンド実行できる。GitHub 連携後は、GitHub の pull request や issue を起点として作業を委譲できる。

## 事前準備

1. Codex に ChatGPT アカウントでサインインする。
2. GitHub アカウントを接続し、Codex に許可するリポジトリを選ぶ。
3. 対象リポジトリのクラウド環境を作成する。
4. タスクに必要な依存関係、ツール、環境変数、シークレット、セットアップ手順を環境に設定する。

クラウド環境の再現性が低いとタスクも失敗しやすい。リポジトリを取得した直後から、ビルドやテストを実行できる状態を目指す。

## GitHub からの利用

Codex cloud の公式概要では、GitHub の pull request と issue からクラウド作業を開始できる。処理はバックグラウンドで進み、完了後に要約と差分を確認し、追加指示や pull request の作成につなげられる。

pull request では、コメントによる次の操作が明示されている。

- `@codex review` でコードレビューを依頼する。
- `@codex review for security regressions` のように観点を追加する。
- `@codex fix the P1 issue` のように修正を依頼する。
- `review` 以外の指示を `@codex` に続けると、その pull request をコンテキストにしたクラウドチャットを開始する。

issue も作業の起点として公式概要に含まれる。ただし、現行の GitHub 連携詳細ページは pull request の操作を中心に説明しており、issue コメントで使う正確な起動構文までは明示していない。issue から委譲する際は、Codex の設定画面や最新の公式ドキュメントに表示される手順を確認する。

## 運用上の注意

- Codex に必要最小限のリポジトリだけを許可する。
- シークレットはリポジトリに保存せず、クラウド環境の設定で管理する。
- Codex の結果はそのままマージせず、要約、差分、テスト結果を確認する。
- リポジトリ固有の指示やレビュー基準は `AGENTS.md` に記載する。
- GitHub 上で Codex が反応しない場合は、対象リポジトリの Codex cloud 設定と Code review 設定を確認する。

## 公式情報

- [Codex cloud](https://developers.openai.com/codex/cloud)
- [Codex code review in GitHub](https://developers.openai.com/codex/integrations/github)
