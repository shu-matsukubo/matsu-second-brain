---
title: 外部依存のリスクはUpstream Issueも確認する
type: principle
topic: 開発プロセス
tags:
  - 外部依存
  - OSS
  - Upstream Issue
updated: 2026-10-27
---

# 外部依存のリスクはUpstream Issueも確認する

OSSのアップグレードやEOSL対応では、公式ドキュメントに加えて対象バージョン範囲のUpstream Issueも調査する。報告された不具合のうち、Upstream起因と判断され、自システムへ大きく影響する可能性があるものを優先して確認する。

Issue探索は網羅性を保証せず、既存調査を補う観測チャネルとして扱う。大量のIssueはAgentに探索と一次選別を任せ、人は高リスク候補の影響判断に集中する。
