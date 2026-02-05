import type {
  DomElement,
  GridPlacement,
  GridResult,
  ViewportConfig,
} from './types.js';

/** Maximum grid size (26 columns = A-Z) */
const MAX_GRID_SIZE = 26;

/** Minimum cell size in viewport percentage */
const MIN_CELL_PCT = 5; // 5% of viewport

/**
 * Calculate optimal grid size based on element positions
 */
function calculateOptimalGridSize(
  elements: DomElement[],
  viewport: ViewportConfig,
): { cols: number; rows: number } {
  if (elements.length === 0) {
    return { cols: 4, rows: 3 }; // Default grid
  }

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
  const minXGap = viewport.width * (MIN_CELL_PCT / 100);
  const minYGap = viewport.height * (MIN_CELL_PCT / 100);

  const sortedX = [...xBreaks].sort((a, b) => a - b);
  const sortedY = [...yBreaks].sort((a, b) => a - b);

  const filteredX = filterCloseValues(sortedX, minXGap);
  const filteredY = filterCloseValues(sortedY, minYGap);

  // Grid size is number of intervals (breakpoints - 1), clamped to MAX_GRID_SIZE
  const cols = Math.min(Math.max(filteredX.length - 1, 1), MAX_GRID_SIZE);
  const rows = Math.min(Math.max(filteredY.length - 1, 1), MAX_GRID_SIZE);

  // Ensure reasonable defaults
  return {
    cols: Math.max(cols, 2),
    rows: Math.max(rows, 2),
  };
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
 * Resolve overlapping placements by adjusting positions
 * Returns placements that fit and warnings for elements that couldn't be placed
 */
function resolveOverlaps(
  placements: GridPlacement[],
  cols: number,
  rows: number,
): { placements: GridPlacement[]; skipped: number } {
  const result: GridPlacement[] = [];
  let skipped = 0;

  for (const placement of placements) {
    let adjusted = { ...placement };
    let placed = false;

    // Find non-overlapping position
    let attempts = 0;
    while (
      result.some((existing) => overlaps(existing, adjusted)) &&
      attempts < rows * 2
    ) {
      // Move down by one row
      adjusted.row = Math.min(adjusted.row + 1, rows - adjusted.rowSpan);
      attempts++;
    }

    // Check if current position is free
    if (!result.some((existing) => overlaps(existing, adjusted))) {
      placed = true;
    } else {
      // Reduce span and try to find any free cell
      adjusted.colSpan = 1;
      adjusted.rowSpan = 1;

      // Search all cells for a free spot
      outerLoop: for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const test = { ...adjusted, col: c, row: r };
          if (!result.some((existing) => overlaps(existing, test))) {
            adjusted = test;
            placed = true;
            break outerLoop;
          }
        }
      }
    }

    if (placed) {
      result.push(adjusted);
    } else {
      // Grid is full, skip this element
      skipped++;
    }
  }

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
