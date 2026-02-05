import type {
  DomElement,
  GridPlacement,
  GridResult,
  ViewportConfig,
} from './types.js';

/** Maximum grid size (26 columns = A-Z) */
const MAX_GRID_SIZE = 26;

/** Minimum cell size in viewport percentage (base value) */
const BASE_MIN_CELL_PCT = 5; // 5% of viewport

/**
 * Calculate optimal grid size based on element positions and count
 */
function calculateOptimalGridSize(
  elements: DomElement[],
  viewport: ViewportConfig,
): { cols: number; rows: number } {
  if (elements.length === 0) {
    return { cols: 4, rows: 3 }; // Default grid
  }

  // Calculate minimum grid size based on element count
  // Ensure at least sqrt(n) x sqrt(n) grid to fit n elements
  const minSize = Math.ceil(Math.sqrt(elements.length));
  const minCols = Math.max(minSize, 4);
  const minRows = Math.max(minSize, 3);

  // Adjust MIN_CELL_PCT based on element count
  // More elements = smaller minimum cell size
  const adjustedMinCellPct =
    elements.length > 30 ? 3 : elements.length > 15 ? 4 : BASE_MIN_CELL_PCT;

  // Find all unique X and Y breakpoints
  const xBreaks = new Set<number>();
  const yBreaks = new Set<number>();

  for (const el of elements) {
    xBreaks.add(el.bounds.x);
    xBreaks.add(el.bounds.x + el.bounds.width);
    yBreaks.add(el.bounds.y);
    yBreaks.add(el.bounds.y + el.bounds.height);
  }

  // Filter out breakpoints that are too close together
  const minXGap = viewport.width * (adjustedMinCellPct / 100);
  const minYGap = viewport.height * (adjustedMinCellPct / 100);

  const sortedX = [...xBreaks].sort((a, b) => a - b);
  const sortedY = [...yBreaks].sort((a, b) => a - b);

  const filteredX = filterCloseValues(sortedX, minXGap);
  const filteredY = filterCloseValues(sortedY, minYGap);

  // Grid size is number of intervals (breakpoints - 1), clamped to MAX_GRID_SIZE
  // Ensure at least minCols x minRows
  const cols = Math.min(
    Math.max(filteredX.length - 1, minCols),
    MAX_GRID_SIZE,
  );
  const rows = Math.min(
    Math.max(filteredY.length - 1, minRows),
    MAX_GRID_SIZE,
  );

  return { cols, rows };
}

/**
 * Filter out values that are too close to each other
 */
function filterCloseValues(sorted: number[], minGap: number): number[] {
  if (sorted.length <= 1) return sorted;

  const result = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - result[result.length - 1] >= minGap) {
      result.push(sorted[i]);
    }
  }
  return result;
}

/**
 * Map an element's position to grid coordinates
 */
function mapToGridCoords(
  element: DomElement,
  cols: number,
  rows: number,
  totalHeight: number,
  viewportWidth: number,
): { col: number; row: number; colSpan: number; rowSpan: number } {
  const cellWidth = viewportWidth / cols;
  const cellHeight = totalHeight / rows;

  // Calculate start position (clamped to grid bounds)
  const col = Math.min(Math.floor(element.bounds.x / cellWidth), cols - 1);
  const row = Math.min(Math.floor(element.bounds.y / cellHeight), rows - 1);

  // Calculate end position
  const endX = element.bounds.x + element.bounds.width;
  const endY = element.bounds.y + element.bounds.height;

  const endCol = Math.min(Math.ceil(endX / cellWidth), cols);
  const endRow = Math.min(Math.ceil(endY / cellHeight), rows);

  // Calculate span (minimum 1)
  const colSpan = Math.max(endCol - col, 1);
  const rowSpan = Math.max(endRow - row, 1);

  return { col, row, colSpan, rowSpan };
}

/**
 * Check if two placements overlap
 */
function overlaps(a: GridPlacement, b: GridPlacement): boolean {
  const aEndCol = a.col + a.colSpan;
  const aEndRow = a.row + a.rowSpan;
  const bEndCol = b.col + b.colSpan;
  const bEndRow = b.row + b.rowSpan;

  return !(
    aEndCol <= b.col ||
    bEndCol <= a.col ||
    aEndRow <= b.row ||
    bEndRow <= a.row
  );
}

/**
 * Find nearest free cell to the target position
 */
function findNearestFreeCell(
  targetCol: number,
  targetRow: number,
  placed: GridPlacement[],
  cols: number,
  rows: number,
): { col: number; row: number } | null {
  // BFS to find nearest free cell
  const visited = new Set<string>();
  const queue: Array<{ col: number; row: number }> = [
    { col: targetCol, row: targetRow },
  ];

  while (queue.length > 0) {
    const { col, row } = queue.shift()!;
    const key = `${col},${row}`;

    if (visited.has(key)) continue;
    visited.add(key);

    // Check if this cell is free
    const test: GridPlacement = {
      element: {} as DomElement,
      col,
      row,
      colSpan: 1,
      rowSpan: 1,
    };

    if (!placed.some((existing) => overlaps(existing, test))) {
      return { col, row };
    }

    // Add adjacent cells (prioritize same row, then nearby rows)
    const directions = [
      { dc: 1, dr: 0 }, // right
      { dc: -1, dr: 0 }, // left
      { dc: 0, dr: 1 }, // down
      { dc: 0, dr: -1 }, // up
    ];

    for (const { dc, dr } of directions) {
      const nc = col + dc;
      const nr = row + dr;
      if (nc >= 0 && nc < cols && nr >= 0 && nr < rows) {
        queue.push({ col: nc, row: nr });
      }
    }
  }

  return null;
}

/**
 * Resolve overlapping placements by adjusting positions
 * Uses priority-based placement and nearest-cell search
 */
function resolveOverlaps(
  placements: GridPlacement[],
  cols: number,
  rows: number,
): { placements: GridPlacement[]; skipped: number } {
  // Sort by priority (high priority first)
  const sorted = [...placements].sort(
    (a, b) => (b.element.priority ?? 0) - (a.element.priority ?? 0),
  );

  const result: GridPlacement[] = [];
  let skipped = 0;

  for (const placement of sorted) {
    let adjusted = { ...placement };

    // Check if current position is free
    if (!result.some((existing) => overlaps(existing, adjusted))) {
      result.push(adjusted);
      continue;
    }

    // Try to keep original span and find nearby position
    let placed = false;

    // First: try moving down within a few rows
    for (let rowOffset = 1; rowOffset <= 3 && !placed; rowOffset++) {
      const newRow = Math.min(adjusted.row + rowOffset, rows - adjusted.rowSpan);
      const test = { ...adjusted, row: newRow };
      if (!result.some((existing) => overlaps(existing, test))) {
        adjusted = test;
        placed = true;
      }
    }

    // Second: reduce to 1x1 and find nearest free cell
    if (!placed) {
      const nearest = findNearestFreeCell(
        placement.col,
        placement.row,
        result,
        cols,
        rows,
      );

      if (nearest) {
        adjusted = {
          ...adjusted,
          col: nearest.col,
          row: nearest.row,
          colSpan: 1,
          rowSpan: 1,
        };
        placed = true;
      }
    }

    if (placed) {
      result.push(adjusted);
    } else {
      // Grid is full, skip this element (low priority elements get skipped)
      skipped++;
    }
  }

  // Re-sort result by position for consistent output
  result.sort((a, b) => {
    if (a.row !== b.row) return a.row - b.row;
    return a.col - b.col;
  });

  return { placements: result, skipped };
}

export interface GridOptions {
  /** Override grid columns */
  cols?: number;
  /** Override grid rows */
  rows?: number;
}

/**
 * Calculate grid layout for DOM elements
 */
export function calculateGrid(
  elements: DomElement[],
  viewport: ViewportConfig,
  options: GridOptions = {},
): GridResult {
  if (elements.length === 0) {
    return {
      cols: options.cols ?? 4,
      rows: options.rows ?? 3,
      placements: [],
    };
  }

  // Calculate total content height
  const maxY = Math.max(
    ...elements.map((el) => el.bounds.y + el.bounds.height),
  );
  const totalHeight = Math.max(maxY, viewport.height);

  // Determine grid size
  const autoGrid = calculateOptimalGridSize(elements, {
    ...viewport,
    height: totalHeight,
  });

  const cols = options.cols ?? autoGrid.cols;
  const rows = options.rows ?? autoGrid.rows;

  // Map elements to grid positions
  const placements: GridPlacement[] = elements.map((element) => {
    const coords = mapToGridCoords(
      element,
      cols,
      rows,
      totalHeight,
      viewport.width,
    );
    return {
      element,
      ...coords,
    };
  });

  // Resolve overlapping placements
  const { placements: resolvedPlacements, skipped } = resolveOverlaps(
    placements,
    cols,
    rows,
  );

  // Warn if elements were skipped due to grid overflow
  if (skipped > 0) {
    console.warn(
      `Warning: ${skipped} element(s) could not be placed in the ${cols}x${rows} grid and were skipped.`,
    );
  }

  return {
    cols,
    rows,
    placements: resolvedPlacements,
  };
}

/**
 * Parse grid string (e.g., "4x3") to cols and rows
 */
export function parseGridString(
  gridStr: string,
): { cols: number; rows: number } | null {
  const match = gridStr.match(/^(\d+)x(\d+)$/i);
  if (!match) return null;

  const cols = parseInt(match[1], 10);
  const rows = parseInt(match[2], 10);

  if (cols < 1 || cols > MAX_GRID_SIZE || rows < 1 || rows > MAX_GRID_SIZE) {
    return null;
  }

  return { cols, rows };
}
