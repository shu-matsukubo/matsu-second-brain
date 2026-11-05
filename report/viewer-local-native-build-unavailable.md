---
id: viewer-local-native-build-unavailable
fingerprint: viewer-local-node26-better-sqlite3-msvc-unavailable
origin: ai
kind: failure
status: pending
created: 2026-11-05
updated: 2026-11-05
request: Windowsの隔離worktreeでnpm --prefix app/viewer ciがbetter-sqlite3のnode-gyp
  rebuildに失敗。Node 26.13.0に必要なVisual Studio C++ビルド環境が見つからず、ローカルViewer検証を開始できない。
result: 対象inputのknowledge反映とreceiptは保存済み。証明書エラーはWindowsの信頼済みCAを利用した同じnpm
  ci再試行で解消したが、C++環境不足は残存。依存の差替えや検証省略で迂回しない。PRのLinux
  CI結果を別途確認する。ローカル復旧時はC++環境の整った状態で同じlockfileからnpm ciしViewer検証を再実行する。
---
