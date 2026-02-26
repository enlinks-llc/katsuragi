import type {
  CanvasSize,
  CellRange,
  LayoutConfig,
  LayoutRect,
} from '../types.js';

const LONGEST_EDGE = 1280;
const DEFAULT_PADDING = 16;

export function calculateCanvasSize(ratio: [number, number]): CanvasSize {
  const [w, h] = ratio;

  if (w >= h) {
    // Landscape or square: width is longest edge
    return {
      width: LONGEST_EDGE,
      height: Math.round((LONGEST_EDGE * h) / w),
    };
  }
  // Portrait: height is longest edge
  return {
    width: Math.round((LONGEST_EDGE * w) / h),
    height: LONGEST_EDGE,
  };
}

/**
 * Calculate individual cell sizes from ratio-based widths/heights.
 * If ratios is undefined, returns equal sizes.
 */
export function calculateSizes(
  totalSize: number,
  count: number,
  gap: number,
  ratios?: number[],
): number[] {
  const totalGap = gap * (count - 1);
  const available = totalSize - totalGap;

  if (!ratios) {
    const size = available / count;
    return Array.from({ length: count }, () => size);
  }

  const totalRatio = ratios.reduce((a, b) => a + b, 0);
  return ratios.map((r) => (available * r) / totalRatio);
}

export interface GridSizes {
  colSizes: number[];
  rowSizes: number[];
}

export function calculateCellRect(
  range: CellRange,
  grid: [number, number],
  canvas: CanvasSize,
  config: LayoutConfig = { gap: 0, padding: DEFAULT_PADDING },
  cellPadding?: number,
  gridSizes?: GridSizes,
): LayoutRect {
  const [cols, rows] = grid;
  const { gap } = config;

  const colSizes =
    gridSizes?.colSizes ?? calculateSizes(canvas.width, cols, gap);
  const rowSizes =
    gridSizes?.rowSizes ?? calculateSizes(canvas.height, rows, gap);

  // Calculate position by summing preceding cell sizes + gaps
  let x = 0;
  for (let i = 0; i < range.start.col; i++) {
    x += colSizes[i] + gap;
  }

  let y = 0;
  for (let i = 0; i < range.start.row; i++) {
    y += rowSizes[i] + gap;
  }

  // Calculate span width/height
  let width = 0;
  for (let i = range.start.col; i <= range.end.col; i++) {
    width += colSizes[i];
    if (i < range.end.col) width += gap;
  }

  let height = 0;
  for (let i = range.start.row; i <= range.end.row; i++) {
    height += rowSizes[i];
    if (i < range.end.row) height += gap;
  }

  return {
    x,
    y,
    width,
    height,
    padding: cellPadding ?? config.padding,
  };
}
