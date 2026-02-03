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

// ヘッダー
A1..D1: { type: txt, value: "ログイン", align: center }

// フォーム
A2..D2: { type: input, label: "メールアドレス" }
A3..C3: { type: input, label: "パスワード" }
D3: { type: btn, value: "送信", style: primary }
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
| `txt` | テキストラベル | `value`, `align` | `align: left` |
| `box` | 空のボックス/コンテナ | `style` | `style: default` |
| `btn` | ボタン | `value`, `style` | `style: default` |
| `input` | 入力フィールド | `label` | - |
| `img` | 画像プレースホルダー | `src`, `alt` | - |

### スタイル

- `align`: `left`（デフォルト）, `center`, `right`
- `style`: `default`（薄グレー）, `primary`（黒塗り）, `secondary`（枠線のみ）

### 出力サイズ

長辺が1280pxに固定され、短辺はratioから計算されます：

- `16:9` → 1280 × 720
- `4:3` → 1280 × 960
- `1:1` → 1280 × 1280
- `9:16` → 720 × 1280（モバイル向け）

## ロードマップ

- [x] MVP: 基本コンポーネント（txt, box, btn, input, img）
- [ ] SVG/PNG出力
- [ ] Markdown埋め込み対応（` ```kui ` コードブロック）
- [ ] HTML出力
- [ ] VS Code拡張機能
- [ ] Webエディタ

## ライセンス

MIT
