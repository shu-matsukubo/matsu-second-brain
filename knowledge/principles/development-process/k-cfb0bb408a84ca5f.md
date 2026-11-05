---
{
  "id": "k-cfb0bb408a84ca5f",
  "title": "Workflowは実行契機から独立させる",
  "type": "principle",
  "topic": "development-process",
  "topic_label": "開発プロセス",
  "tags": [
    "Workflow",
    "責務分離",
    "定期実行"
  ],
  "updated": "2026-11-05",
  "support_streak": 1,
  "opposition_streak": 0,
  "related": [
    "k-1c336721577e40fb"
  ],
  "opposes": [],
  "evidence": [
    {
      "source_id": "notion:40e013b8-a22b-8111-832c-e70004f82ca1",
      "input_digest": "d6e648e1bcea4f34930bc32b674c725d57e65ccb1ac9733eb639fbc2c30d36e2",
      "input_key": "legacy-1e681f4400d88e1625e8d7c14de9d5c40a0c83727393bf68eb58122dffb4aa9e",
      "quote": "## Workflowを実行契機から独立させる\r\n\r\n処理内容が同じなら、\r\n手動実行と定期実行でWorkflowを分けない。\r\n\r\n責務を次のように分離する。\r\n\r\n- Trigger：いつ実行するか\r\n- Scheduler：実行してよい状態か\r\n- Workflow：何をどの順序で実行するか\r\n- Skills：各工程をどう実行するか\r\n\r\n実行契機に固有の判断をWorkflowへ混ぜない。\r\n\r\n一方、作業対象や操作の安全性など、\r\n実行方法によらず必要な検証はWorkflow側で担保する。\r\n\r\n新しい実行方法を追加しても、\r\n既存の処理手順を複製しない構造を目指す。",
      "occurred_at": "2026-10-10T03:56:45+09:00",
      "source_ref": "daily/2026/10/10-035645.md",
      "origin": "user",
      "direction": "support",
      "background": "同じ処理の手動実行と定期実行では手順を共有し、実行契機と安全性検証の責務を分ける方針を本人が明示した。",
      "counted": true
    }
  ],
  "history": [],
  "sources": []
}
---
# 内容

処理内容が同じなら、手動実行と定期実行で同じWorkflowを使う。実行方法を追加するときも既存の処理手順を複製しない。

Triggerは実行契機、Schedulerは実行可能な状態かの判断、Workflowは処理内容と順序、Skillsは各工程の実行方法を担う。実行契機に固有の判断はWorkflowへ混ぜず、作業対象や操作の安全性など実行方法を問わず必要な検証はWorkflowで担保する。

## 関連リンク

- [AIフローでは能力・制御・判断知識を分離する](k-1c336721577e40fb.md)

# 根拠・思考の履歴

- 入力日時（旧dailyの登録日時。会話の発言時刻は未確認）: 2026-10-10T03:56:45+09:00
- 会話参照: daily/2026/10/10-035645.md
- 入力: notion:40e013b8-a22b-8111-832c-e70004f82ca1
- 入力キー: legacy-1e681f4400d88e1625e8d7c14de9d5c40a0c83727393bf68eb58122dffb4aa9e
- 背景: 旧入力を失わずNotionへ移行した。原文はdailyにも保全している。

本人の原文:

```text
## Workflowを実行契機から独立させる

処理内容が同じなら、
手動実行と定期実行でWorkflowを分けない。

責務を次のように分離する。

- Trigger：いつ実行するか
- Scheduler：実行してよい状態か
- Workflow：何をどの順序で実行するか
- Skills：各工程をどう実行するか

実行契機に固有の判断をWorkflowへ混ぜない。

一方、作業対象や操作の安全性など、
実行方法によらず必要な検証はWorkflow側で担保する。

新しい実行方法を追加しても、
既存の処理手順を複製しない構造を目指す。
```
