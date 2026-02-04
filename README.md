# Katsuragi

[日本語版 README](./README.ja.md)

Text-based UI wireframe generator. Define layouts with a simple grid-based DSL and export to SVG/PNG.

## Features

- Grid-based layout system (like Excel cell references)
- Simple JSON-style component definitions
- SVG/PNG export (1280px longest edge)
- Designed for developer-to-non-developer communication
- AI-friendly format for collaborative UI development with LLMs

## Installation

```bash
npm install -g katsuragi
```

## Usage

```bash
# Generate SVG
katsuragi input.kui -o output.svg

# Generate PNG
katsuragi input.kui -o output.png
```

## .kui File Format

```kui
ratio: 16:9
grid: 4x3

// Header
A1..D1: { type: txt, value: "Login", align: center }

// Form
A2..D2: { type: input, label: "Email" }
A3..C3: { type: input, label: "Password" }
D3: { type: btn, value: "Submit", style: primary }
```

### Grid System

- `ratio` - Aspect ratio of the canvas (e.g., `16:9`, `4:3`, `1:1`, `9:16`)
- `grid` - Grid divisions as `columns x rows` (e.g., `4x3` creates columns A-D and rows 1-3)
- Cell references use Excel-style notation: `A1`, `B2`, `C3`
- Range notation: `A1..B3` (top-left to bottom-right)

### Comments

Use `//` for comments:

```kui
// This is a comment
A1: { type: txt, value: "Hello" }  // End-of-line comment
```

### Components (MVP)

| Type | Description | Properties | Defaults |
|------|-------------|------------|----------|
| `txt` | Text label | `value`, `align` | `align: left` |
| `box` | Empty box/container | `style` | `style: default` |
| `btn` | Button | `value`, `style` | `style: default` |
| `input` | Input field | `label` | - |
| `img` | Image placeholder | `src`, `alt` | - |

### Styles

- `align`: `left` (default), `center`, `right`
- `style`: `default` (light gray), `primary` (black fill), `secondary` (stroke only)

### Multi-line Text

Use `\n` for line breaks in text values:

```kui
A1: { type: txt, value: "Line 1\nLine 2\nLine 3" }
```

Or use backticks for multi-line strings:

```kui
A1: { type: txt, value: `
  Welcome to
  Katsuragi
` }
```

> **Note:** Automatic text wrapping is not supported. For long text, manually insert `\n` at desired break points.

### Output Size

The longest edge is fixed at 1280px. The shorter edge is calculated from the ratio:

- `16:9` → 1280 × 720
- `4:3` → 1280 × 960
- `1:1` → 1280 × 1280
- `9:16` → 720 × 1280 (mobile)

## Roadmap

- [x] MVP: Core components (txt, box, btn, input, img)
- [ ] SVG/PNG export
- [ ] Markdown embedding (` ```kui ` code blocks)
- [ ] HTML export
- [ ] VS Code extension
- [ ] Web-based editor

## License

- **Open Source**: AGPL-3.0 (free if you open-source your code)
- **Commercial**: License required for SaaS integration or closed-source use

For commercial licensing, contact [En-Links LLC](https://github.com/enlinks-llc).
