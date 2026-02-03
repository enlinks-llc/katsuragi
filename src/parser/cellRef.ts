import type { CellCoord, CellRange } from '../types.js';

const CELL_REF_PATTERN = /^([A-Z])(\d+)$/;

export function parseCellRef(ref: string): CellCoord {
  const match = ref.toUpperCase().match(CELL_REF_PATTERN);
  if (!match) {
    throw new Error(`Invalid cell reference: ${ref}`);
  }
  const col = match[1].charCodeAt(0) - 'A'.charCodeAt(0);
  const row = parseInt(match[2], 10) - 1;
  if (row < 0) {
    throw new Error(`Invalid row number in cell reference: ${ref}`);
  }
  return { col, row };
}

export function parseCellRange(rangeStr: string): CellRange {
  const parts = rangeStr.split('..');

  if (parts.length === 1) {
    const coord = parseCellRef(parts[0]);
    return { start: coord, end: { ...coord } };
  }

  if (parts.length === 2) {
    const start = parseCellRef(parts[0]);
    const end = parseCellRef(parts[1]);

    // Normalize: ensure start <= end
    return {
      start: {
        col: Math.min(start.col, end.col),
        row: Math.min(start.row, end.row),
      },
      end: {
        col: Math.max(start.col, end.col),
        row: Math.max(start.row, end.row),
      },
    };
  }

  throw new Error(`Invalid cell range: ${rangeStr}`);
}
