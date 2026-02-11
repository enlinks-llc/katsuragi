/**
 * Types for the fetcher module
 */

/** Viewport type for responsive fetching */
export type ViewportType = 'desktop' | 'mobile' | 'tablet';

/** A visual element extracted from HTML */
export interface DomElement {
  /** HTML tag name (lowercase) */
  tagName: string;
  /** Bounding box in viewport coordinates (approximate) */
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Whether the element contains meaningful text */
  hasText: boolean;
  /** Text content if any (truncated) */
  textContent?: string;
  /** Additional attributes */
  attributes: {
    placeholder?: string;
    alt?: string;
    src?: string;
    type?: string;
  };
  /** Extracted colors from inline style */
  colors?: {
    bg?: string;
    border?: string;
  };
  /** Priority for placement (higher = more important) */
  priority?: number;
  /** Nesting depth in DOM tree */
  depth?: number;
}

/** Options for HTML parsing */
export interface ParseOptions {
  /** Maximum nesting depth to process (default: 4) */
  maxDepth?: number;
  /** Maximum number of elements to return (default: 50) */
  maxElements?: number;
}

/** Viewport configuration */
export interface ViewportConfig {
  width: number;
  height: number;
  userAgent: string;
  defaultRatio: [number, number];
}

/** Grid placement result */
export interface GridPlacement {
  element: DomElement;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

/** Result of HTML parsing */
export interface ParseResult {
  elements: DomElement[];
  themeColor?: string;
}

/** Grid calculation result */
export interface GridResult {
  cols: number;
  rows: number;
  placements: GridPlacement[];
}
