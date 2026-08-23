# Indexとリンク

knowledgeの作成・移動・改名・分類変更に伴ってIndexまたはリンクを変更するときと、両者の整合性を評価するときに読む共有仕様。knowledgeの分類判断やsignalsの保存形式は扱わない。

## 正とする情報

knowledge本文とそのメタデータを情報の正とする。Indexは閲覧入口であり、knowledgeにない説明、判断、事実、案を書かない。

## Indexの構造

```text
indexes/
├─ index.md
└─ topics/
   └─ <テーマ>.md
```

`indexes/index.md` は、存在するtopic Indexへのリンクをテーマ名で並べる。topic Indexは、該当テーマのknowledgeを情報の性質ごとに整理する。

```markdown
# テーマ名

## Facts

- [主題](<../../knowledge/01-facts/テーマ/主題.md>) — 短い識別情報

## Principles

- [主題](<../../knowledge/02-principles/テーマ/主題.md>) — 短い識別情報

## Ideas

- [主題](<../../knowledge/03-ideas/テーマ/主題.md>) — 短い識別情報
```

短い識別情報はリンク先を選ぶための補助に限定し、本文の要約や新しい知識をIndexへ蓄積しない。

## 更新

- Indexは現在存在するknowledgeをすべて対象にする。現在の配置やメタデータがまだ情報モデルと一致しないknowledgeも、内容から判断できる現在の区分へリンクし、Indexから意図的に除外しない。
- knowledgeを作成、移動、改名、分類変更、削除した作業では、対応するtopic Indexと `indexes/index.md` を同時に整える。
- topic Indexや親Indexがまだない場合は、最初の実データと同時に作る。
- 対応するknowledgeがなくなったtopic Indexと親Indexの項目は削除する。空のIndexを維持しない。
- Indexの各リンク先が存在し、knowledgeの `type` と見出し区分、`topic` とtopic Index名が一致することを確認する。
- Indexを手作業だけに依存させず、通常の日次整理とメンテナンスの完了条件に含める。

## knowledge間のリンク

- 標準Markdownの相対リンクを使い、ファイル名の拡張子まで記述する。空白を含むリンク先は山括弧で囲む。
- 特定のノートアプリだけが解釈するリンク記法を新しく追加しない。
- 前提、判断材料、実行手順など、直接の関係がある場合だけリンクする。同じテーマという理由だけで増やさない。
- 相互に辿る価値がある関係は相互リンクにする。
- ファイルを移動または改名したら、リポジトリ内の参照元を検索し、主対象に直接関係するリンクを同じ作業で修正する。
- 既存の非標準リンクは、関係するファイルをメンテナンスするときに標準Markdownへ整える。
