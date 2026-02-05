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

/** Grid calculation result */
export interface GridResult {
  cols: number;
  rows: number;
  placements: GridPlacement[];
}
