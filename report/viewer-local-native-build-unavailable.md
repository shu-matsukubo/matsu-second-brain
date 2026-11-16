---
id: viewer-local-native-build-unavailable
fingerprint: viewer-local-node26-better-sqlite3-msvc-unavailable
origin: ai
kind: failure
status: deferred
created: 2026-11-05
updated: 2026-11-16
request: Windowsの隔離worktreeでnpm --prefix app/viewer ciがbetter-sqlite3のnode-gyp
  rebuildに失敗。Node 26.13.0に必要なVisual Studio C++ビルド環境が見つからず、ローカルViewer検証を開始できない。
result: |-
  対象inputのknowledge反映とreceiptは保存済み。証明書エラーはWindowsの信頼済みCAを利用した同じnpm ci再試行で解消したが、C++環境不足は残存。依存の差替えや検証省略で迂回しない。PRのLinux CI結果を別途確認する。ローカル復旧時はC++環境の整った状態で同じlockfileからnpm ciしViewer検証を再実行する。

  2026-11-16 再確認: Windows_NT 10.0.26300 / Node v26.13.0 / npm 11.20.0で、現行Viewerのpackage.jsonとpackage-lock.jsonを一時ディレクトリへコピーし、NODE_USE_SYSTEM_CA=1でnpm ciを再実行した。lockfile SHA-256: 7c06b94835a00c5b220a76cf178d40ecd024ca2c50d4237a0f398279bf6599a5。better-sqlite3 13.0.3のnode-gyp rebuildでVisual Studio C++ビルド環境を検出できず失敗し、同じ依存導入の問題を再現した。SQLite実行確認には未到達。一時インストール領域は検証した絶対パスの範囲内で削除し、現在の作業場所のnode_modulesとソースは変更していない。

  状態: 環境復旧待ちとして保留。既存依存環境で検証できることと、新しいWindows環境へlockfileから依存を導入できることを区別する。依存の差替え・インストールスクリプト省略で迂回せず、C++ビルド環境が準備された後に同じlockfileでnpm ciとネイティブSQLiteの実行、Viewerの検証を再確認して完了を判断する。今回の主対象は再現確認と再開条件の記録であり、システムのビルド環境の導入・変更は実施していない。
---
