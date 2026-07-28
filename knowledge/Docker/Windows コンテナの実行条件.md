---
title: Windows コンテナの実行条件
category: Docker
tags:
  - Docker
  - Windows
  - コンテナ
updated: 2026-07-28
---

# Windows コンテナの実行条件

Windows コンテナは Windows のカーネル機能を前提とするため、Linux の Docker Engine ではそのまま実行できない。Windows 10・11 の対応エディションでは、Docker Desktop を Windows コンテナモードへ切り替えて利用する。

Docker Desktop の Linux コンテナモードと Windows コンテナモードは、Docker CLI が接続するデーモンを切り替える仕組みである。同じ端末でも両方を扱えるが、同一のデーモン上で Linux イメージと Windows イメージを区別なく実行するものではない。

## ホスト側の主な条件

- Windows Server 2016 以降、または対応する Windows 10・11 Pro／Enterprise を使う
- Hyper-V 分離を使う場合は Hyper-V を有効にする
- Windows 10・11 では Docker Desktop を Windows コンテナモードへ切り替える
- ホストとコンテナイメージの Windows バージョン互換性を確認する

プロセス分離ではホストとコンテナがカーネルを共有するため、OS バージョンの組み合わせに制約がある。互換性がない場合は、対応するベースイメージへ変更するか、利用可能なら Hyper-V 分離を検討する。

## GUI アプリケーションの制約

Windows コンテナはデスクトップ GUI をサポートしない。これは単に GUI 付きの公開イメージがないという問題ではなく、デスクトップを必要とするアプリケーション自体が Windows コンテナの対象外であるためである。

GUI がインストール時だけ必要なアプリケーションは、サイレントインストールへ変更できればコンテナ化できる場合がある。実行時にデスクトップ操作が必要なら、コンテナではなく仮想マシンなどを検討する。

コンテナがホストのカーネルを利用する基本的な仕組みは、[[Docker コンテナの基本]]を参照する。

Windows コンテナの構築手順と起動条件をチームで共有する方法は、[[Dockerfile と Compose で開発環境を共有する]]を参照する。

## 公式情報

- [Install Docker Desktop on Windows](https://docs.docker.com/desktop/setup/install/windows-install/)
- [Windows container requirements](https://learn.microsoft.com/en-us/virtualization/windowscontainers/deploy-containers/system-requirements)
- [Windows container version compatibility](https://learn.microsoft.com/en-us/virtualization/windowscontainers/deploy-containers/version-compatibility)
- [Lift and shift to containers](https://learn.microsoft.com/en-us/virtualization/windowscontainers/quick-start/lift-shift-to-containers)
