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
}

export interface Component {
  type: ComponentType;
  range: CellRange;
  props: ComponentProps;
}

export interface Metadata {
  ratio: [number, number];
  grid: [number, number]; // [cols, rows]
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
}

export interface CanvasSize {
  width: number;
  height: number;
}
