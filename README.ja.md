# Katsuragi

[English README](./README.md)

[![npm version](https://badge.fury.io/js/katsuragi.svg)](https://www.npmjs.com/package/katsuragi)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

## 半分のトークン。2倍の明確さ。

AIが本当に理解できるテキスト形式で、UIアイデアをワイヤーフレームに。

### 誰のためのツール？

- 非エンジニアのステークホルダーとUIを議論する開発者
- AIコーディングアシスタント（Claude Code, Cursor, Aider）を使うエンジニア
- git diffで追跡できるUI仕様が欲しいチーム

### なぜ .kui？

```mermaid
---
config:
  themeVariables:
    xyChart:
      plotColorPalette: "#9CA3AF, #3B82F6, #F87171"
---
xychart-beta
    title "ワイヤーフレームあたりのトークン数（login例）"
    x-axis ["自然言語", "ASCII", ".kui", "HTML"]
    y-axis "トークン" 0 --> 400
    bar [102, 84, 0, 0]
    bar [0, 0, 120, 0]
    bar [0, 0, 0, 330]
```

.kuiは効率と信頼性の最適解:

| 形式 | トークン | 正確性 | 安定性 |
|------|----------|------|------|
| 自然言語 | 102 | ❌ | ❌ |
| ASCIIアート | 84 | ⚠️ | ❌ |
| **.kui** | **120** | **✓** | **✓** |
| HTML | 330 | ✓ | ✓ |

**HTMLの50%のトークン**で、同等の正確さ。

[→ 3パターンでの詳細比較](./docs/analysis/README.ja.md)

### 使い方

`.kui` ファイルを書く：

```kui
ratio: 16:9
grid: 4x3
colors: { primary: "#3B82F6" }

A1..D1: { type: txt, value: "Login", align: center }
A2..D2: { type: input, label: "Email" }
A3..C3: { type: input, label: "Password" }
D3: { type: btn, value: "Login", bg: $primary }
```

コマンドを1つ実行：

```bash
npx ktr login.kui -o login.png
```

こうなる：

![ログイン画面のワイヤーフレーム](./docs/images/login.png)

---

時間が節約できたら：

[![Buy Me A Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://buymeacoffee.com/enlinks)

[Starで応援](https://github.com/enlinks-llc/katsuragi)してくれると嬉しいです！

---

## クイックスタート

### インストール

```bash
# インストール不要で試す
npx ktr input.kui -o output.png

# グローバルインストール
npm install -g katsuragi
```

> **Tips:** `ktr` は `katsuragi` の短縮エイリアスです。お好みで使い分けてください。

### 試してみる

```bash
# サンプルファイルを作成
cat > hello.kui << 'EOF'
ratio: 16:9
grid: 2x2
A1: { type: txt, value: "Hello Katsuragi!", align: center }
A2..B2: { type: btn, value: "はじめる" }
EOF

# 画像生成
katsuragi hello.kui -o hello.png
```

### 使い方

```bash
# 標準出力にSVGを出力
ktr input.kui

# ファイルに保存（拡張子でフォーマット自動判定）
ktr input.kui -o output.svg
ktr input.kui -o output.png

# フォーマット明示
ktr input.kui -f png -o output.png

# 一括変換
ktr *.kui -d ./output -f png

# 標準入力から読み込み
cat input.kui | ktr -o output.png
```

**CLIオプション:**

| オプション | 説明 |
|------------|------|
| `-o, --output <file>` | 出力ファイル（デフォルト: SVGは標準出力） |
| `-d, --output-dir <dir>` | 一括変換時の出力ディレクトリ |
| `-f, --format <format>` | 出力フォーマット: `svg` または `png`（デフォルト: `svg`） |
| `-V, --version` | バージョン表示 |
| `-h, --help` | ヘルプ表示 |

## なぜテキストベース？

Katsuragiがテキスト形式なのは、**AIが読み書きできる**からです。

| 従来のツール | Katsuragi |
|-------------|-----------|
| Figmaでデザイン → エクスポート → 共有 | テキストで記述 → 画像生成 |
| AIはデザインファイルを編集できない | AIは.kuiファイルを生成・修正できる |
| 「ボタンを大きく」は手作業 | AIがコードを理解して更新 |

### なぜプレーンテキストがAIと相性がいいのか

- **コピペが簡単** - バイナリ形式も専用ツールも不要
- **コンテキストウィンドウに収まる** - .kuiファイルは小さく、AIがレイアウト全体を保持可能
- **diffフレンドリー** - gitで変更追跡可能、レビューも簡単
- **ベンダーロックインなし** - どのLLMでも動作（ChatGPT、Claude、Gemini、ローカルモデル）

### AIとのワークフロー

1. **プロジェクトに.kui仕様を追加**（`AGENTS.md`、システムプロンプト、プロジェクトドキュメントなど）
2. AIに依頼：「ログイン画面のワイヤーを.kui形式で」
3. AIが.kuiファイルを生成
4. `ktr login.kui -o login.png` で画像化
5. 画像を共有、議論、改善
6. フィードバックをもとにAIが.kuiを更新

### LLM系CLIツールとの連携

- **Claude Code** - CLAUDE.mdに仕様を追加
- **Cursor** - プロジェクトルールに追加
- **Aider** - コンテキストに含める
- **その他のLLM CLI** - システムプロンプトやAGENTS.mdにペースト

### プロンプト例

```
以下は.kuiファイルの形式仕様です：
[下記の構文セクションをペースト]

タスク管理アプリのモバイル画面ワイヤーフレームを作成してください。
2x5グリッド（ratio 9:16）を使用。
ヘッダー（タイトル）、タスクリストエリア、フローティングアクションボタンを配置。
```

AIが仕様を理解すれば、.kuiコードを正確に生成・修正できます。

## .kui ファイル形式

```kui
ratio: 16:9
grid: 4x3
colors: { primary: "#3B82F6" }

// ヘッダー
A1..D1: { type: txt, value: "ログイン", align: center }

// フォーム
A2..D2: { type: input, label: "メールアドレス" }
A3..C3: { type: input, label: "パスワード" }
D3: { type: btn, value: "送信", bg: $primary }
```

### グリッドシステム

- `ratio` - キャンバスのアスペクト比（例: `16:9`, `4:3`, `1:1`, `9:16`）
- `grid` - グリッド分割数 `列数x行数`（例: `4x3` で A-D列、1-3行を作成）
- セル参照はExcel形式: `A1`, `B2`, `C3`
- 範囲指定: `A1..B3`（左上から右下）

### 間隔とパディング

```kui
ratio: 16:9
grid: 3x2
gap: 8
padding: 24

A1: { type: box }
B1: { type: box }
C1: { type: box }
A2..C2: { type: txt, value: "コンテンツエリア", padding: 16 }
```

- `gap` - セル間の間隔（ピクセル単位、デフォルト: `0`）
- `padding` - キャンバスの余白（ピクセル単位、デフォルト: `0`）
- セル単位の `padding` - 個別セルのコンテンツパディングを上書き

### コメント

`//` でコメントを記述できます：

```kui
// これはコメントです
A1: { type: txt, value: "Hello" }  // 行末コメント
```

### コンポーネント

| タイプ | 説明 | プロパティ | デフォルト |
|--------|------|------------|------------|
| `txt` | テキストラベル | `value`, `align`, `bg`, `border`, `padding` | `align: left` |
| `box` | 空のボックス/コンテナ | `bg`, `border`, `padding` | `bg: #e0e0e0` |
| `btn` | ボタン | `value`, `bg`, `border`, `padding` | `bg: #e0e0e0` |
| `input` | 入力フィールド | `label`, `bg`, `border`, `padding` | `bg: white`, `border: black` |
| `img` | 画像プレースホルダー | `src`, `alt`, `bg`, `border`, `padding` | `bg: #f0f0f0`, `border: #ccc` |

### カラー

カラーテーマを定義し、`$name` で参照できます：

```kui
colors: { primary: "#3B82F6", danger: "#EF4444", accent: "orange" }

A1: { type: btn, value: "送信", bg: $primary }
A2: { type: btn, value: "削除", bg: $danger, border: $accent }
B1: { type: box, bg: "#f0f0f0", border: "#ccc" }
B2: { type: box, bg: lightblue }
```

| プロパティ | 説明 | デフォルト |
|------------|------|------------|
| `bg` | 背景色 | コンポーネントごとに異なる |
| `border` | ボーダー色（幅2px固定） | なし |

対応する色形式：
- HEX: `#RGB` または `#RRGGBB`（例: `#f00`, `#3B82F6`）
- CSS色名: `red`, `blue`, `lightblue`, `orange` など
- テーマ参照: `$name`（`colors:` での定義が必要）

### 配置

- `align`: `left`（デフォルト）, `center`, `right`

### 複数行テキスト

テキストに改行を入れるには `\n` を使用します：

```kui
A1: { type: txt, value: "1行目\n2行目\n3行目" }
```

またはバッククォートで複数行文字列を記述できます：

```kui
A1: { type: txt, value: `
  ようこそ
  Katsuragiへ
` }
```

> **注意:** 自動テキスト折り返しには対応していません。長いテキストは手動で `\n` を挿入してください。

### 出力サイズ

長辺が1280pxに固定され、短辺はratioから計算されます：

- `16:9` → 1280 × 720
- `4:3` → 1280 × 960
- `1:1` → 1280 × 1280
- `9:16` → 720 × 1280（モバイル向け）

## その他の例

![ダッシュボードのワイヤーフレーム](./docs/images/dashboard.png)

![モバイルのワイヤーフレーム](./docs/images/mobile.png)

## ロードマップ

- [x] 基本コンポーネント（txt, box, btn, input, img）
- [x] SVG/PNG出力
- [ ] Markdown埋め込み対応（` ```kui ` コードブロック）
- [ ] HTML出力
- [ ] VS Code拡張機能
- [ ] Webエディタ

## ライセンス

- **オープンソース利用**: AGPL-3.0（ソースコードを公開するなら無料）
- **商用製品の開発**: 無料で利用可能
- **商用ライセンスが必要なケース**: SaaSへの組み込み、クローズドソースでの配布のみ

> **例**: 商用アプリのワイヤーフレーム作成に使う → 無料。デザインツールSaaSにKatsuragiを組み込む → 商用ライセンスが必要。

商用ライセンスについては [En-Links LLC](https://github.com/enlinks-llc) までお問い合わせください。

## サードパーティライセンス

本ソフトウェアは以下のオープンソースライブラリを使用しています：

| ライブラリ | ライセンス | 説明 |
|-----------|-----------|------|
| [sharp](https://sharp.pixelplumbing.com/) | Apache-2.0 | 高性能画像処理 |
| [libvips](https://github.com/libvips/libvips) | LGPL-3.0-or-later | 画像処理ライブラリ（sharpの依存） |
| [commander](https://github.com/tj/commander.js) | MIT | CLIパーサー |

## 謝辞

Katsuragiは多くの素晴らしいオープンソースプロジェクトの上に成り立っています：

- **[libvips](https://github.com/libvips/libvips)** (John Googley-Fletcherほかコントリビューター) - PNG生成を支える高速画像処理エンジン
- **[sharp](https://github.com/lovell/sharp)** (Lovell Fuller) - libvipsを使いやすいNode.js APIで提供
- **[commander.js](https://github.com/tj/commander.js)** (TJ Holowaychuk) - Node.js CLIツールのスタンダード

---

Copyright © 2025 [合同会社エン・リンクス (En-Links LLC)](https://github.com/enlinks-llc)
