import type { CellRange, CanvasSize, LayoutRect } from '../types.js';

const LONGEST_EDGE = 1280;

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
  canvas: CanvasSize
): LayoutRect {
  const [cols, rows] = grid;
  const cellWidth = canvas.width / cols;
  const cellHeight = canvas.height / rows;

  const x = range.start.col * cellWidth;
  const y = range.start.row * cellHeight;
  const width = (range.end.col - range.start.col + 1) * cellWidth;
  const height = (range.end.row - range.start.row + 1) * cellHeight;

  return { x, y, width, height };
}
