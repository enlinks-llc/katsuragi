# Katsuragi

テキストベースのUIワイヤーフレーム生成ツール。シンプルなグリッドベースのDSLでレイアウトを定義し、SVG/PNGに出力します。

## 特徴

- グリッドベースのレイアウトシステム（Excelのセル参照のような記法）
- シンプルなJSON風のコンポーネント定義
- SVG/PNG出力対応（長辺1280px）
- 技術者から非技術者へのUI共有に最適
- LLMとの協調的なUI開発に適したフォーマット

## インストール

```bash
npm install -g katsuragi
```

## 使い方

```bash
# SVG出力
katsuragi input.kui -o output.svg

# PNG出力
katsuragi input.kui -o output.png
```

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

### コメント

`//` でコメントを記述できます：

```kui
// これはコメントです
A1: { type: txt, value: "Hello" }  // 行末コメント
```

### コンポーネント（MVP）

| タイプ | 説明 | プロパティ | デフォルト |
|--------|------|------------|------------|
| `txt` | テキストラベル | `value`, `align`, `bg`, `border` | `align: left` |
| `box` | 空のボックス/コンテナ | `bg`, `border` | `bg: #e0e0e0` |
| `btn` | ボタン | `value`, `bg`, `border` | `bg: #e0e0e0` |
| `input` | 入力フィールド | `label`, `bg`, `border` | `bg: white`, `border: black` |
| `img` | 画像プレースホルダー | `src`, `alt`, `bg`, `border` | `bg: #f0f0f0`, `border: #ccc` |

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

## ロードマップ

- [x] MVP: 基本コンポーネント（txt, box, btn, input, img）
- [x] SVG/PNG出力
- [ ] Markdown埋め込み対応（` ```kui ` コードブロック）
- [ ] HTML出力
- [ ] VS Code拡張機能
- [ ] Webエディタ

## ライセンス

- **オープンソース利用**: AGPL-3.0（ソースコードを公開するなら無料）
- **商用利用**: SaaS組み込み・クローズドソースは商用ライセンスが必要

商用ライセンスについては [En-Links LLC](https://github.com/enlinks-llc) までお問い合わせください。
