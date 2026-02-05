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

export function calculateCellRect(
  range: CellRange,
  grid: [number, number],
  canvas: CanvasSize,
  config: LayoutConfig = { gap: 0, padding: DEFAULT_PADDING },
  cellPadding?: number,
): LayoutRect {
  const [cols, rows] = grid;
  const { gap } = config;

  // Calculate effective cell size accounting for gaps
  const totalGapX = gap * (cols - 1);
  const totalGapY = gap * (rows - 1);
  const cellWidth = (canvas.width - totalGapX) / cols;
  const cellHeight = (canvas.height - totalGapY) / rows;

  // Calculate position including gaps
  const x = range.start.col * (cellWidth + gap);
  const y = range.start.row * (cellHeight + gap);

  // Merged cell spans multiple gaps
  const spanCols = range.end.col - range.start.col + 1;
  const spanRows = range.end.row - range.start.row + 1;
  const width = spanCols * cellWidth + (spanCols - 1) * gap;
  const height = spanRows * cellHeight + (spanRows - 1) * gap;

  return {
    x,
    y,
    width,
    height,
    padding: cellPadding ?? config.padding,
  };
}
