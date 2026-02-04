# Katsuragi Syntax Reference

Complete syntax specification for `.kui` files.

## File Structure

```kui
// Header (canvas settings)
ratio: <width>:<height>
grid: <columns>x<rows>
gap: <pixels>                    // optional, default: 0
padding: <pixels>                // optional, default: 0
colors: { <name>: "<color>" }    // optional

// Cell definitions
<cell-range>: { <properties> }
```

## Header Properties

### ratio (required)

Canvas aspect ratio. Longest edge fixed at 1280px.

```kui
ratio: 16:9   // → 1280×720
ratio: 4:3    // → 1280×960
ratio: 1:1    // → 1280×1280
ratio: 9:16   // → 720×1280
```

### grid (required)

Grid dimensions as `<columns>x<rows>`. Divides canvas into equal parts.

```kui
grid: 4x3    // 4 columns, 3 rows (each cell: 25% × 33.3%)
grid: 6x4    // 6 columns, 4 rows
grid: 3x5    // 3 columns, 5 rows (good for mobile)
```

### gap (optional)

Space between cells in pixels. Default: `0`.

```kui
gap: 8       // 8px between all cells
gap: 16      // 16px between all cells
```

### padding (optional)

Space around the canvas edge in pixels. Default: `0`.

```kui
padding: 16  // 16px padding around entire canvas
padding: 24  // 24px padding
```

### colors (optional)

Named color definitions. Reference with `$name` in cell properties.

```kui
colors: { primary: "#3B82F6", danger: "#EF4444" }
colors: { bg: "lightgray", accent: "orange" }
```

## Cell Notation

### Single Cell

```kui
A1: { type: txt, value: "Hello" }
B2: { type: box }
```

### Cell Range (Merge)

Use double dot (`..`) to merge cells into a single area.

```kui
A1..D1: { type: txt, value: "Header" }    // 4 cells wide, 1 tall
A1..B2: { type: box }                      // 2×2 merged area
A1..A3: { type: box }                      // 1 wide, 3 tall
```

### Column/Row Reference

- **Columns**: A, B, C, D, E, F... (left to right)
- **Rows**: 1, 2, 3, 4, 5... (top to bottom)

For grids larger than 26 columns, use AA, AB, AC...

## Components

### txt (Text Label)

Display text content.

```kui
A1: { type: txt, value: "Hello World" }
A1: { type: txt, value: "Centered", align: center }
A1: { type: txt, value: "Line 1\nLine 2" }  // Multi-line with \n
```

Properties:
- `value` (string): Text content
- `align`: `left` (default), `center`, `right`
- `bg`: Background color
- `border`: Border color
- `padding`: Cell padding

### box (Empty Container)

Container for layout purposes.

```kui
A1: { type: box }
A1: { type: box, bg: "#f0f0f0" }
A1: { type: box, border: "#333" }
```

Properties:
- `bg`: Background color
- `border`: Border color
- `padding`: Cell padding

### btn (Button)

Clickable button element.

```kui
A1: { type: btn, value: "Submit" }
A1: { type: btn, value: "Cancel", bg: "#EF4444" }
A1: { type: btn, value: "Outline", border: "#333" }
```

Properties:
- `value` (string): Button text
- `bg`: Background color
- `border`: Border color
- `padding`: Cell padding

### input (Form Input)

Form input field with label.

```kui
A1: { type: input, label: "Email" }
A1: { type: input, label: "Password" }
```

Properties:
- `label` (string): Input label text
- `bg`: Background color
- `border`: Border color
- `padding`: Cell padding

### img (Image Placeholder)

Placeholder for images.

```kui
A1: { type: img, alt: "Profile Photo" }
A1: { type: img, src: "logo.png", alt: "Logo" }
```

Properties:
- `alt` (string): Alt text (displayed in placeholder)
- `src` (string): Image source (optional, for reference)
- `bg`: Background color
- `border`: Border color
- `padding`: Cell padding

## Color Formats

### HEX Colors

```kui
bg: "#3B82F6"    // 6-digit hex
bg: "#F00"       // 3-digit hex (shorthand)
```

### CSS Color Names

```kui
bg: "red"
bg: "lightblue"
bg: "orange"
bg: "transparent"
```

### Theme References

Reference colors defined in the header `colors` block.

```kui
colors: { primary: "#3B82F6" }

A1: { type: btn, value: "Submit", bg: $primary }
```

## String Formats

### Single or Double Quotes

```kui
value: "Hello World"    // Double quotes
value: 'Hello World'    // Single quotes (equivalent)
```

### Multi-line Text

Using escape sequences:

```kui
value: "Line 1\nLine 2\nLine 3"
```

Using backticks:

```kui
value: `
First line
Second line
Third line
`
```

## Comments

```kui
// This is a line comment

A1: { type: txt, value: "Hello" }  // End-of-line comment

// Use comments to organize sections
// Header
A1..D1: { type: txt, value: "Title" }

// Content
A2..D2: { type: box }
```

## Multi-line Definitions

Cell definitions can span multiple lines. Trailing commas allowed.

```kui
A1..B2: {
  type: txt,
  value: "Long text here",
  align: center,
  bg: "#f0f0f0",
}
```

## Error Conditions

### Cell Overlap

Overlapping cell ranges cause an error.

```kui
// ERROR: A1..B2 and B1..C2 overlap at B1 and B2
A1..B2: { type: box }
B1..C2: { type: box }
```

### Invalid Cell Reference

Cell references outside grid bounds cause an error.

```kui
grid: 4x3

// ERROR: E1 doesn't exist in 4-column grid
E1: { type: txt, value: "Out of bounds" }
```

## Default Values

| Property | Default |
|----------|---------|
| `align` | `left` |
| `bg` | `#e0e0e0` |
| `border` | none |
| `padding` | `0` (or global padding if set) |
| `gap` | `0` |
