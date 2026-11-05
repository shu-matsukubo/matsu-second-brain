# SkillとREADMEの記述

## 参照元

- [plugin-skill-authoring](https://github.com/shu-matsukubo/matsu-artifact-delivery/blob/main/.agents/skills/plugin-skill-authoring/SKILL.md)
- [Skill設計の方針](https://github.com/shu-matsukubo/matsu-artifact-delivery/blob/main/.agents/skills/plugin-skill-authoring/references/design-policy.md)
- 参照日: 2026-11-05

## 配置

| 場所 | 内容 |
| --- | --- |
| `SKILL.md` | 用途・責務・フローの入口 |
| `references/` | そのSkillだけが使う詳細手順 |
| `docs/` | 複数Skillで共有する契約・方針 |
| `scripts/` | 決定的な選択・変換・検証・適用 |
| `README.md` | 利用者向けの構成・起動・操作の入口 |

## 表現

- 一項目一責務。短い箇条書きを組み合わせる。
- 順序は番号、対応関係は表、配置はファイル構造で示す。
- 見出しが示す意味を本文で繰り返さない。
- 例: `# 前提`の下では「○○を前提とする」より「○○とする」。
- 詳細は一箇所に置き、利用する段階でリンクする。
- 機械検査できる条件は既存schema・実装・テスト・CIを優先する。
- 同じ条件を別の検証器へ再実装しない。
- 意味判断・承認範囲・会話上の責務は自然言語で残す。

## Skillの構造

```text
YAML frontmatter: name / description
# タイトル
## 概要
## 制約と責務範囲
## フロー
```

- 詳細手順はフローから参照する。
- `name`はディレクトリ名と一致する英小文字・数字・ハイフン、64文字以内。
- `description`は用途と使用条件を含む1〜1024文字。

## 検証

```powershell
npm run check:skills
node scripts/check-skills.mjs .agents/skills/input-to-knowledge/SKILL.md
```

- 全Skillのメタデータ・見出し構造を検査する。
- Skill、reference、docs、root/Viewer READMEのローカルリンクとMarkdownアンカーを検査する。
- Skill配下の補助ファイルが入口から辿れることを検査する。
- コード例のリンク文字列は参照として扱わない。
- CIで実行する。失敗は非ゼロ終了とする。
- 文意・責務境界・リンク名・箇条書きの自然さはレビューする。
- 動作保証の対応は[CLI契約](workflow-contract.md)を参照する。
