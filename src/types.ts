export interface SourceLocation {
  line: number; // 1-indexed
  column: number; // 1-indexed
  offset: number; // 0-indexed character position
}

export type ComponentType = 'txt' | 'box' | 'btn' | 'input' | 'img';
export type Align = 'left' | 'center' | 'right';
export type Style = 'default' | 'primary' | 'secondary';

export interface CellCoord {
  col: number; // 0-indexed (A=0, B=1, ...)
  row: number; // 0-indexed (1=0, 2=1, ...)
}

export interface CellRange {
  start: CellCoord;
  end: CellCoord;
}

export interface ComponentProps {
  value?: string;
  label?: string;
  align?: Align;
  style?: Style;
  src?: string;
  alt?: string;
  padding?: number;
}

export interface Component {
  type: ComponentType;
  range: CellRange;
  props: ComponentProps;
}

export interface Metadata {
  ratio: [number, number];
  grid: [number, number]; // [cols, rows]
  gap?: number;
  padding?: number;
}

export interface KuiDocument {
  metadata: Metadata;
  components: Component[];
}

export interface LayoutRect {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
}

export interface LayoutConfig {
  gap: number;
  padding: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface RenderContext {
  basePath?: string;
}
