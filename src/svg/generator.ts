import {
  calculateCanvasSize,
  calculateCellRect,
  calculateSizes,
} from '../layout/calculator.js';
import type {
  Component,
  KuiDocument,
  LayoutConfig,
  LayoutRect,
  RenderContext,
} from '../types.js';
import {
  renderBox,
  renderBtn,
  renderImg,
  renderInput,
  renderTxt,
} from './components.js';
import { getTheme, type Theme } from './themes.js';

function renderComponent(
  component: Component,
  rect: LayoutRect,
  theme: Theme,
  context?: RenderContext,
): string {
  switch (component.type) {
    case 'txt':
      return renderTxt(component, rect, theme);
    case 'box':
      return renderBox(component, rect, theme);
    case 'btn':
      return renderBtn(component, rect, theme);
    case 'input':
      return renderInput(component, rect, theme);
    case 'img':
      return renderImg(component, rect, theme, context);
    default:
      return '';
  }
}

export function generateSvg(doc: KuiDocument, basePath?: string): string {
  const canvas = calculateCanvasSize(doc.metadata.ratio);
  const { width, height } = canvas;

  const config: LayoutConfig = {
    gap: doc.metadata.gap ?? 0,
    padding: doc.metadata.padding ?? 16,
  };

  const theme = getTheme(doc.metadata.theme);
  const context: RenderContext = { basePath };

  const [cols, rows] = doc.metadata.grid;
  const gridSizes = {
    colSizes: calculateSizes(canvas.width, cols, config.gap, doc.metadata.colWidths),
    rowSizes: calculateSizes(canvas.height, rows, config.gap, doc.metadata.rowHeights),
  };

  const componentsSvg = doc.components
    .map((component) => {
      const rect = calculateCellRect(
        component.range,
        doc.metadata.grid,
        canvas,
        config,
        component.props.padding,
        gridSizes,
      );
      return renderComponent(component, rect, theme, context);
    })
    .join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="white"/>
  ${componentsSvg}
</svg>`;
}
