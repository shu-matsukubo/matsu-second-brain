---
name: input-to-knowledge
description: Notion input一件をknowledgeへ整理し、末尾に本人の発言履歴を残して完了状態へ進める。
---

# Notion inputをknowledgeへ反映する

統合親から渡された一件を扱い、AGENTSとknowledge-policyに従う。Notionの原文を再取得し、同じ本文JSONからsnapshotを作り`node scripts/brain.mjs input-verify SNAPSHOT.json`してから計画を適用する。途中の内容変更は保留し、snapshotをすり替えない。

- 開発との直接の関係を再確認し、対象外・関係不明ならknowledgeへ反映しない。収集前の混入や旧入力はNotionを保留にして理由を記録し、無断で削除しない。開発と無関係な原文や背景を新しいknowledgeへ転載しない。
- 本人の希望・比較・否定・保留・決定を確度のまま整理する。AIの推測を追加しない。主題ごとに既存knowledgeを更新するか新規作成し、一入力を複数ノートに分けてもよい。
- 開発に関する雑談・感想・疑問形の評価も扱う。「gitってあんま良くないよねー？」のような未確定の考えはideaとして確度を保ち、客観的事実や確定した不採用判断へ変えない。発言だけでは曖昧な支持・反対は計数しない。
- 本文は`# 内容`、簡潔な現在の内容、`## 関連リンク`、最後に`# 根拠・思考の履歴`。末尾にはsnapshotのoccurred_at/quote/source_refをそのまま含め、必要な背景を添える。既存の発言履歴は残して追記する。外部事実は一次情報で確認してfactsに分け、内部リンクで結ぶ。一次出典URLはfacts末尾へ置く。
- evidence追加分にはsource_id: notion:<page UUID>、input_digest（CLIのdigest）、origin: user、input_key、quote、occurred_at、source_ref、direction、background、countedを記録する。AIが収集したかと引用元が本人かを混同しない。曖昧な意思は支持・反対に計数しない。
- 既存evidence/history/sourcesはappend-only。本文を置き換えるときはhistoryにfrom/to/at/reason/previous_body/previous_pathを追記して旧本文を保全する。分類変更・安定ID・連続支持/反対はpolicyとCLI検証に従う。

planはversion: 1、kind: input、source_id、source_digest、writes（path/content/expected_digest）、daily_status_path: nullと必要なmoves。一時JSONはOSのtempへ置き`apply PLAN.json`する。失敗したらplanを作り直さずresumeする。indexはcoreが生成する。

反映後は統合親へ返す。Notion完了更新とローカルackは親が行う。knowledgeへの保存対象がない場合もNotionの結果へ理由を残す。snapshotやjournalを手動削除しない。
