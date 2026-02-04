import type { KuiDocument, Component, LayoutRect, LayoutConfig, RenderContext } from '../types.js';
import { calculateCanvasSize, calculateCellRect } from '../layout/calculator.js';
import {
  renderTxt,
  renderBox,
  renderBtn,
  renderInput,
  renderImg,
} from './components.js';

function renderComponent(
  component: Component,
  rect: LayoutRect,
  context?: RenderContext
): string {
  switch (component.type) {
    case 'txt':
      return renderTxt(component, rect);
    case 'box':
      return renderBox(component, rect);
    case 'btn':
      return renderBtn(component, rect);
    case 'input':
      return renderInput(component, rect);
    case 'img':
      return renderImg(component, rect, context);
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

  const context: RenderContext = { basePath };

  const componentsSvg = doc.components
    .map((component) => {
      const rect = calculateCellRect(
        component.range,
        doc.metadata.grid,
        canvas,
        config,
        component.props.padding
      );
      return renderComponent(component, rect, context);
    })
    .join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="white"/>
  ${componentsSvg}
</svg>`;
}
