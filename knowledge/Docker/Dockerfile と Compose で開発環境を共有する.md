---
title: Dockerfile と Compose で開発環境を共有する
category: Docker
tags:
  - Docker
  - Dockerfile
  - Docker Compose
  - 開発環境
updated: 2026-07-19
---

# Dockerfile と Compose で開発環境を共有する

Dockerfile と Compose ファイルをリポジトリで共有すると、開発環境の構築手順と起動設定をコードとして管理できる。開発者が同じ定義を使うことで、手作業による環境差を減らし、プロジェクトへの参加や環境の作り直しを容易にできる。

## Dockerfile の役割

Dockerfile は、ベースイメージ、パッケージの導入、ファイルの配置、既定の起動コマンドなど、1つのコンテナイメージを構築する手順を記述する。

Dockerfile 自体は完成したイメージではない。Dockerfile とビルド対象のファイルからイメージを構築し、そのイメージをもとにコンテナを起動する。イメージとコンテナの関係は [[Docker コンテナの基本]] を参照する。

## Compose の役割

Compose ファイルは、アプリケーションを構成するサービスと、その実行条件をまとめて定義する。たとえば、Web アプリ、データベース、キャッシュをそれぞれ別のサービスとして定義し、ネットワーク、ボリューム、環境変数、依存関係などを1つの YAML ファイルで管理できる。

`docker compose up` を使うと、定義された複数のサービスをまとめて作成・起動できる。Compose は単一コンテナでも利用でき、長い `docker run` オプションをファイルに残す用途にも使える。

## 再現性を高める条件

同じ Dockerfile と Compose ファイルを共有しても、常に完全に同じ結果になるとは限らない。再現性を高めるには、次のような外部条件も管理する。

- ベースイメージや依存パッケージのバージョンを固定する
- 必要な環境変数を文書化し、シークレットは定義ファイルへ直接書かない
- CPU アーキテクチャなど、ホスト側の前提を明示する
- データベースなどの永続データを初期化する手順を用意する
- 外部サービスへの依存と必要な接続条件を明示する

## 公式情報

- [Dockerfile reference](https://docs.docker.com/reference/dockerfile/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Why use Compose?](https://docs.docker.com/compose/intro/features-uses/)
- [Dockerfile と Compose ファイルの違い](https://docs.docker.com/guides/docker-compose/common-questions/#what-is-the-difference-between-docker-compose-and-dockerfile)
