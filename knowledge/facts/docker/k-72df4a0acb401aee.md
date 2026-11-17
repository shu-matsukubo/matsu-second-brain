---
id: k-72df4a0acb401aee
title: Docker コンテナの基本
type: fact
topic: docker
topic_label: Docker
tags:
  - Docker
  - コンテナ
  - 開発環境
updated: 2026-11-17
support_streak: 0
opposition_streak: 0
history_status: unknown
related:
  - k-db6a704b4c1b4cca
  - k-5c212626fd61d868
opposes: []
evidence:
  - source_id: report/recheck-docker-basics-sources.md
    input_digest: 361604abaf7c5c2767cecb081de0b56dde5911776f0ed794d6d1146641f61486
    origin: ai
    direction: none
    counted: false
    background: Docker公式四件の説明を確認し、確認日と実行ホスト・分離・イメージの範囲を整理した。本人の採用意思や支持の追加ではない。
history:
  - from: fact
    to: fact
    at: 2026-11-17
    reason: 公式根拠の確認日を追加し、既存の留保を保って実行ホストと分離設定の説明を補足した。
    previous_body: "\r

      # Docker コンテナの基本\r

      \r

      Docker は、アプリケーションとその実行に必要なファイルをまとめ、コンテナという隔離された環境で動かすためのプラットフォームである。\r

      \r

      コンテナは「仮想サーバー」というより、ホスト上で動く隔離されたプロセスとして捉えると正確である。コンテナごとにファイルシステム、ネットワーク、プロセスツリーなどが分離される一方、仮想マシンとは異なり、通常はホストのカーネルを共有する。\r

      \r

      ## イメージとコンテナの関係\r

      \r

      イメージは、コンテナの実行に必要なファイル、ライブラリ、設定などをまとめた標準化されたパッケージである。コンテナは、そのイメージをもとに作成・起動される実行可能なインスタンスにあたる。\r

      \r

      ただし、コンテナ自体が常にサーバーになるわけではない。Web サーバーのような常駐プロセスだけでなく、バッチ処理やコマンドなどもコンテナで実行できる。コンテナの役割は、イメージや起動時に指定されたコマンドによって決まる。\r

      \r

      ## 環境を揃えやすい理由\r

      \r

      コンテナは、アプリケーション本体だけでなく、ライブラリやランタイムなどの依存関係も含めて実行できる。同じイメージと同じ起動時の設定を使えば、開発者ごとの端末や検証・本番環境の違いによる影響を減らし、同じ構成を再現しやすくなる。\r

      \r

      ただし、Docker を使えば無条件に完全に同一の動作が保証されるわけではない。CPU アーキテクチャ、永続データ、環境変数、外部サービス、Docker の実行基盤など、イメージの外にある条件も動作に影響する。\r

      \r

      開発チームでイメージの構築手順と複数サービスの起動設定を共有する方法は、[Dockerfile と Compose で開発環境を共有する](k-db6a704b4c1b4cca.md)を参照する。\r

      \r

      Linux コンテナと Windows コンテナでは必要な実行基盤が異なる。Windows コンテナをローカルで扱う際の条件は、[Windows コンテナの実行条件](k-5c212626fd61d868.md)を参照する。\r

      \r

      ## コンテナと仮想マシンの違い\r

      \r

      | 項目 | コンテナ | 仮想マシン |\r

      | --- | --- | --- |\r

      | 隔離の単位 | プロセス | OS 全体 |\r

      | カーネル | 通常はホストと共有 | ゲスト OS ごとに持つ |\r

      | 起動やサイズ | 比較的軽量 | 比較的大きい |\r

      | 主な用途 | アプリケーションと依存関係の配布・実行 | OS を含む環境全体の分離 |\r

      \r

      ## 公式情報\r

      \r

      - [What is Docker?](https://docs.docker.com/get-started/docker-overview/)\r

      - [What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/)\r

      - [What is an image?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/)\r

      - [Running containers](https://docs.docker.com/engine/containers/run/)\r\n"
    previous_path: knowledge/facts/docker/k-72df4a0acb401aee.md
sources:
  - url: https://docs.docker.com/get-started/docker-overview/
  - url: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/
  - url: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/
  - url: https://docs.docker.com/engine/containers/run/
  - url: https://docs.docker.com/get-started/docker-overview/
    checked_at: 2026-11-17
  - url: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/
    checked_at: 2026-11-17
  - url: https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/
    checked_at: 2026-11-17
  - url: https://docs.docker.com/engine/containers/run/
    checked_at: 2026-11-17
---

# 内容

Docker は、アプリケーションとその実行に必要なファイルをまとめ、コンテナという隔離された環境で動かすためのプラットフォームである。

コンテナは、ホスト上で動く隔離されたプロセスとして捉えられる。ファイルシステム、ネットワーク、プロセスツリーなどの分離は実行時の設定にも左右される。通常のプロセス分離では、仮想マシンとは異なりホストのカーネルを共有する。

ここでホストとは、実際にコンテナを動かす環境を指す。Docker CLIとDockerデーモンは別のマシンに置くこともできるため、CLIを操作する端末と実行ホストが同じとは限らない。

## イメージとコンテナの関係

イメージは、コンテナの実行に必要なファイル、ライブラリ、設定などをまとめた標準化されたパッケージである。作成済みのイメージは読み取り専用のテンプレートで、コンテナはそのイメージをもとに作成・起動される実行可能なインスタンスにあたる。

コンテナでは、Web サーバーのような常駐プロセスだけでなく、バッチ処理やコマンドなども実行できる。役割は、イメージの既定コマンドや起動時に指定されたコマンドによって決まる。

## 環境を揃えやすい理由

コンテナは、アプリケーション本体だけでなく、ライブラリやランタイムなどの依存関係も含めて実行できる。同じイメージと同じ起動時の設定を使えば、開発者ごとの端末や検証・本番環境の違いによる影響を減らし、同じ構成を再現しやすくなる。

Docker を使っても、CPU アーキテクチャ、永続データ、環境変数、外部サービス、Docker の実行基盤など、イメージの外にある条件も動作に影響するため、無条件に完全に同一の動作が保証されるわけではない。コンテナの削除時には、永続ストレージに保存していない変更が失われることにも注意する。

## コンテナと仮想マシンの違い

次の表は、通常のプロセス分離を使うコンテナと仮想マシンの概略比較である。

| 項目 | コンテナ | 仮想マシン |
| --- | --- | --- |
| 隔離の単位 | プロセス | OS 全体 |
| カーネル | 通常は実行ホストと共有 | ゲスト OS ごとに持つ |
| 起動やサイズ | 比較的軽量 | 比較的大きい |
| 主な用途 | アプリケーションと依存関係の配布・実行 | OS を含む環境全体の分離 |

コンテナを仮想マシン上で動かすこともあり、両者は併用できる。Windowsコンテナでは分離方式やホストとイメージの互換性にも条件があるため、下記の実行条件を参照する。

## 関連リンク

- [Dockerfile と Compose で開発環境を共有する](k-db6a704b4c1b4cca.md)：イメージの構築手順と複数サービスの起動設定を共有する方法。
- [Windows コンテナの実行条件](k-5c212626fd61d868.md)：Windowsの実行基盤、分離方式とバージョン互換性の条件。

# 根拠・思考の履歴

2026-11-17、次のDocker公式一次資料を確認した。旧本文の「通常はホストのカーネルを共有する」という留保と、環境再現性の条件を保持し、ホストの意味と分離設定の範囲を補足した。

- [What is Docker?](https://docs.docker.com/get-started/docker-overview/)（確認日：2026-11-17）：Dockerの役割、クライアントとデーモン、読み取り専用イメージとコンテナ、設定と永続データ。
- [What is a container?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-a-container/)（確認日：2026-11-17）：隔離されたプロセス、カーネル共有、仮想マシンとの比較と併用。
- [What is an image?](https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/)（確認日：2026-11-17）：ファイル・依存関係・設定を含むイメージと、その不変性。
- [Running containers](https://docs.docker.com/engine/containers/run/)（確認日：2026-11-17）：ローカル／リモートの実行ホスト、分離、イメージと実行時設定・コマンドの関係。

資料の読解による確認で、Dockerの導入・設定変更・イメージ取得・コンテナ起動・deployは行っていない。旧本文と元出典はメタデータの履歴に保持した。関連するWindows実行条件とDockerfile/Composeのノートは、今回その全体を再検証・更新したものではない。
