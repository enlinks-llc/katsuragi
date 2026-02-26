import { calculateCanvasSize } from '../layout/calculator.js';
import type { Component, KuiDocument } from '../types.js';
import { getTheme, type Theme } from '../svg/themes.js';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function gridArea(c: Component): string {
  const { start, end } = c.range;
  // CSS grid is 1-indexed
  return `${start.row + 1} / ${start.col + 1} / ${end.row + 2} / ${end.col + 2}`;
}

function alignStyle(align?: string): string {
  switch (align) {
    case 'center':
      return 'justify-content: center; text-align: center;';
    case 'right':
      return 'justify-content: flex-end; text-align: right;';
    default:
      return '';
  }
}

function renderComponent(c: Component, theme: Theme): string {
  const area = gridArea(c);
  const bg = c.props.bg ?? theme.defaultBg;
  const border = c.props.border;
  const borderStyle = border
    ? `border: ${theme.strokeWidth}px solid ${border};`
    : '';
  const paddingStyle = c.props.padding
    ? `padding: ${c.props.padding}px;`
    : '';
  const baseStyle = `grid-area: ${area}; border-radius: ${theme.borderRadius}px; font-size: ${theme.fontSize}px; ${paddingStyle}`;

  switch (c.type) {
    case 'txt': {
      const value = escapeHtml(c.props.value ?? '').replace(/\n/g, '<br>');
      const hasBg = c.props.bg || c.props.border;
      const bgStyle = hasBg ? `background: ${c.props.bg ?? 'transparent'}; ${borderStyle}` : '';
      return `    <div class="kui-txt" style="${baseStyle} ${alignStyle(c.props.align)} ${bgStyle}">${value}</div>`;
    }
    case 'box':
      return `    <div class="kui-box" style="${baseStyle} background: ${bg}; ${borderStyle}"></div>`;
    case 'btn': {
      const value = escapeHtml(c.props.value ?? '').replace(/\n/g, '<br>');
      return `    <button class="kui-btn" style="${baseStyle} background: ${bg}; ${borderStyle}">${value}</button>`;
    }
    case 'input': {
      const label = escapeHtml(c.props.label ?? '');
      const inputBg = c.props.bg ?? 'white';
      const inputBorder = c.props.border ?? 'black';
      return `    <div class="kui-input" style="${baseStyle}">
      <label style="font-size: ${theme.fontSize * 0.75}px;">${label}</label>
      <div class="field" style="border: ${theme.strokeWidth}px solid ${inputBorder}; background: ${inputBg}; border-radius: ${theme.borderRadius / 2}px;"></div>
    </div>`;
    }
    case 'img': {
      const alt = escapeHtml(c.props.alt ?? c.props.src ?? 'image');
      return `    <div class="kui-img" style="${baseStyle} background: ${c.props.bg ?? '#f0f0f0'}; border: ${theme.strokeWidth}px solid ${c.props.border ?? '#ccc'};">[IMG: ${alt}]</div>`;
    }
    default:
      return '';
  }
}

function gridTemplateSizes(count: number, ratios?: number[]): string {
  if (!ratios) {
    return `repeat(${count}, 1fr)`;
  }
  return ratios.map((r) => `${r}fr`).join(' ');
}

export function generateHtml(doc: KuiDocument): string {
  const theme = getTheme(doc.metadata.theme);
  const canvas = calculateCanvasSize(doc.metadata.ratio);
  const [cols, rows] = doc.metadata.grid;
  const gap = doc.metadata.gap ?? 0;
  const padding = doc.metadata.padding ?? 16;

  const gridCols = gridTemplateSizes(cols, doc.metadata.colWidths);
  const gridRows = gridTemplateSizes(rows, doc.metadata.rowHeights);

  const components = doc.components
    .map((c) => renderComponent(c, theme))
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Katsuragi Wireframe</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f5f5f5; }
    .kui-canvas { background: white; font-family: system-ui, sans-serif; }
    .kui-txt { display: flex; align-items: center; overflow-wrap: break-word; word-break: break-word; overflow: hidden; }
    .kui-box { }
    .kui-btn { display: flex; align-items: center; justify-content: center; cursor: default; border: none; font-size: inherit; overflow-wrap: break-word; word-break: break-word; overflow: hidden; }
    .kui-input { display: flex; flex-direction: column; justify-content: center; }
    .kui-input label { margin-bottom: 4px; }
    .kui-input .field { padding: 8px; height: 40px; }
    .kui-img { display: flex; align-items: center; justify-content: center; color: #666; }
  </style>
</head>
<body>
  <div class="kui-canvas" style="width: ${canvas.width}px; height: ${canvas.height}px; display: grid; grid-template-columns: ${gridCols}; grid-template-rows: ${gridRows}; gap: ${gap}px; padding: ${padding}px;">
${components}
  </div>
</body>
</html>`;
}
