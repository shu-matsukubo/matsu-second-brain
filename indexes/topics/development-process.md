# 開発プロセス

## 事実

（なし）

## 思想

- [Agentは必要最小限にし専門性は知識で拡張する](../../knowledge/principles/development-process/k-3953b9c0e4266be4.md) (k-3953b9c0e4266be4)
- [AI Workflowは探索量と完了時間で評価する](../../knowledge/principles/development-process/k-cb4b907775bc93a7.md) (k-cb4b907775bc93a7)
- [AIエージェントには覚えておく仕事を任せる](../../knowledge/principles/development-process/k-f51a362201719cec.md) (k-f51a362201719cec)
- [AIセキュリティは入力経路と実行権限をセットで考える](../../knowledge/principles/development-process/k-c2677cc313efd69a.md) (k-c2677cc313efd69a)
- [AIチャットは永続状態の更新境界で切り替える](../../knowledge/principles/development-process/k-ed9431132a1300be.md) (k-ed9431132a1300be)
- [AIツールは認知コストの削減で投資判断する](../../knowledge/principles/development-process/k-53b874d26fbc1ddd.md) (k-53b874d26fbc1ddd)
- [AIに設計を依頼するときは現在の構成を共有する](../../knowledge/principles/development-process/k-b6bac51054c079bf.md) (k-b6bac51054c079bf)
- [AIの実行場所は責務から決める](../../knowledge/principles/development-process/k-cff4d20a9bc43e30.md) (k-cff4d20a9bc43e30)
- [AIの操作制約はPolicyで結果を制限する](../../knowledge/principles/development-process/k-c7312886320ad33f.md) (k-c7312886320ad33f)
- [AIフローでは能力・制御・判断知識を分離する](../../knowledge/principles/development-process/k-1c336721577e40fb.md) (k-1c336721577e40fb)
- [AIへの依頼は実装結果とともに保存する](../../knowledge/principles/development-process/k-d00d5434cb5bb73e.md) (k-d00d5434cb5bb73e)
- [Issueは現在の実装に照合してから設計する](../../knowledge/principles/development-process/k-a9b0faffeeed8800.md) (k-a9b0faffeeed8800)
- [Review単位とIntegration単位を分ける](../../knowledge/principles/development-process/k-3e976cb288ac805d.md) (k-3e976cb288ac805d)
- [エージェントのモデルは責務に応じて選ぶ](../../knowledge/principles/development-process/k-f1b6da308d1daaf7.md) (k-f1b6da308d1daaf7)
- [ツールは継続的な価値で採用を判断する](../../knowledge/principles/development-process/k-1c9d5e44b0d5304d.md) (k-1c9d5e44b0d5304d)
- [パフォーマンス改善は発生頻度と影響度で優先順位を決める](../../knowledge/principles/development-process/k-e4905c42b314c4c4.md) (k-e4905c42b314c4c4)
- [マルチエージェントの並列度はタスク構造で決める](../../knowledge/principles/development-process/k-cace147d56d039c9.md) (k-cace147d56d039c9)
- [上位Agentへの相談は必要時の共通能力にする](../../knowledge/principles/development-process/k-284229ca7cd4221b.md) (k-284229ca7cd4221b)
- [不採用アーキテクチャは前提が変わったら再評価する](../../knowledge/principles/development-process/k-faeac1f2745de751.md) (k-faeac1f2745de751)
- [仕様を詰める対話と実装エージェントは分ける](../../knowledge/principles/development-process/k-12ebb55403b0808f.md) (k-12ebb55403b0808f)
- [品質ゲートは追加価値で増やす](../../knowledge/principles/development-process/k-18cd4b4f19159d05.md) (k-18cd4b4f19159d05)
- [品質保証レベルは入口で選ぶ](../../knowledge/principles/development-process/k-1fd2110eaa47e4f6.md) (k-1fd2110eaa47e4f6)
- [外部依存のリスクはUpstream Issueも確認する](../../knowledge/principles/development-process/k-7c01507f86f46660.md) (k-7c01507f86f46660)
- [安全策は脅威モデルから選ぶ](../../knowledge/principles/development-process/k-0c0c7182767c137a.md) (k-0c0c7182767c137a)
- [定期処理は停止時間を抑える頻度で実行する](../../knowledge/principles/development-process/k-55e0d5d013745fda.md) (k-55e0d5d013745fda)
- [局所品質が十分なら検証対象を上位へ移す](../../knowledge/principles/development-process/k-7edd2b79c450ab07.md) (k-7edd2b79c450ab07)
- [承認ゲートは責任境界として設計する](../../knowledge/principles/development-process/k-bd28870e8387958e.md) (k-bd28870e8387958e)
- [抽象化は複数の具体例から行う](../../knowledge/principles/development-process/k-c8c18cc4a6746b87.md) (k-c8c18cc4a6746b87)
- [改善バックログは現在状態から再評価する](../../knowledge/principles/development-process/k-5c5789a9053c209a.md) (k-5c5789a9053c209a)
- [暫定対応は恒久対応までの総コストで判断する](../../knowledge/principles/development-process/k-3f83490d1cf6bf02.md) (k-3f83490d1cf6bf02)
- [標準規格は相互運用性の最低境界として使う](../../knowledge/principles/development-process/k-37ea96230a1cf568.md) (k-37ea96230a1cf568)
- [汎用Workflowは解決する問題を一般化する](../../knowledge/principles/development-process/k-8f683f6261a605b6.md) (k-8f683f6261a605b6)
- [状態管理方式は現在の不変条件で選ぶ](../../knowledge/principles/development-process/k-dd48dc1f30a5dbac.md) (k-dd48dc1f30a5dbac)
- [自己レビューと独立レビューで異なる失敗を検出する](../../knowledge/principles/development-process/k-12584bf597c40b01.md) (k-12584bf597c40b01)
- [複雑な計算の不具合は計算経路から調べる](../../knowledge/principles/development-process/k-95ab8cac0e648a55.md) (k-95ab8cac0e648a55)
- [観測と改善を分離する](../../knowledge/principles/development-process/k-082f394197334891.md) (k-082f394197334891)
- [設計では技術以外の制約条件も明示する](../../knowledge/principles/development-process/k-18612ffa4bd0558c.md) (k-18612ffa4bd0558c)
- [設計原則は将来の変更で検証可能にする](../../knowledge/principles/development-process/k-d24184b6e646329f.md) (k-d24184b6e646329f)
- [長寿命なCoreを短寿命なClientへ依存させない](../../knowledge/principles/development-process/k-3ddb79c59977a9f0.md) (k-3ddb79c59977a9f0)

## アイディア

- [AI処理はキャッシュ効率を運用データで検証する](../../knowledge/ideas/development-process/k-d8c1f72c69667e83.md) (k-d8c1f72c69667e83)
- [AI判断とWorkflow分岐を分けてテストする案](../../knowledge/ideas/development-process/k-68d79effd0909df6.md) (k-68d79effd0909df6)
- [ドキュメントを読者と参照頻度で分ける案](../../knowledge/ideas/development-process/k-9b3a81a9daaf7d5a.md) (k-9b3a81a9daaf7d5a)
- [独立した手続きにSkillを絞る案](../../knowledge/ideas/development-process/k-f36bc045f746da9e.md) (k-f36bc045f746da9e)
