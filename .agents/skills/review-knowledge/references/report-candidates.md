# 候補登録と再開

## 候補の根拠

- 対象ID・パス
- 現在の証拠
- policyとの差、または未確定の判断
- 影響
- 次の確認・修正案

## 既存reportとの照合

| 状態 | 処理 |
| --- | --- |
| 同じstable ID/fingerprintがactive/archiveにある | 重複追加しない |
| 新しい根拠でcompleted問題が再発 | 同じpath/IDのままpendingへ戻すplanを作る |
| 人間がrequest/bodyを変更した | CLIの`reopened`として再開する |
| 未承認のpolicy/Skill提案だけが残る | 既存reportを保ち、入力変更を待つ |
| 新規候補 | 種類に応じてreport-addで登録する |

- 再発時はrequest/bodyを保持し、resultへ新しい根拠を追記してupdatedを更新する。
- 人間判断が必要な提案は`deferred`にし、後続workflowの反復を防ぐ。
- AI生成候補を人間の意思や支持/反対の履歴に含めない。
- report形式と適用は[CLI契約](../../../../docs/workflow-contract.md)を使う。

## 評価終了

- 新規の実行可能候補なし: 現在の入力fingerprintで`review-complete`する。
- `--input-empty`は、親がNotion未処理ビューを取得して空と確認した実行だけに付ける。
- 次回は入力変更を確認し、変更なしなら再探索しない。
