import type { Component, LayoutRect, Align, Style } from '../types.js';

const STROKE_WIDTH = 2;
const BORDER_RADIUS = 8;
const FONT_SIZE = 24;
const PADDING = 16;

function getTextAnchor(align: Align): string {
  switch (align) {
    case 'center':
      return 'middle';
    case 'right':
      return 'end';
    default:
      return 'start';
  }
}

function getTextX(rect: LayoutRect, align: Align): number {
  switch (align) {
    case 'center':
      return rect.x + rect.width / 2;
    case 'right':
      return rect.x + rect.width - PADDING;
    default:
      return rect.x + PADDING;
  }
}

function getStyleFill(style: Style): string {
  switch (style) {
    case 'primary':
      return 'black';
    case 'secondary':
      return 'white';
    default:
      return '#e0e0e0';
  }
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function renderTxt(component: Component, rect: LayoutRect): string {
  const align = component.props.align ?? 'left';
  const value = component.props.value ?? '';
  const textX = getTextX(rect, align);
  const textY = rect.y + rect.height / 2 + FONT_SIZE / 3;

  return `<text x="${textX}" y="${textY}" font-size="${FONT_SIZE}" text-anchor="${getTextAnchor(align)}" fill="black">${escapeXml(value)}</text>`;
}

export function renderBox(component: Component, rect: LayoutRect): string {
  const style = component.props.style ?? 'default';
  const fill = getStyleFill(style);
  const stroke = style === 'secondary' ? `stroke="black" stroke-width="${STROKE_WIDTH}"` : '';

  return `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${BORDER_RADIUS}" fill="${fill}" ${stroke}/>`;
}

export function renderBtn(component: Component, rect: LayoutRect): string {
  const style = component.props.style ?? 'default';
  const value = component.props.value ?? '';
  const fill = getStyleFill(style);
  const textColor = style === 'primary' ? 'white' : 'black';
  const stroke = style === 'secondary' ? `stroke="black" stroke-width="${STROKE_WIDTH}"` : '';

  const textX = rect.x + rect.width / 2;
  const textY = rect.y + rect.height / 2 + FONT_SIZE / 3;

  return `<g>
  <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${BORDER_RADIUS}" fill="${fill}" ${stroke}/>
  <text x="${textX}" y="${textY}" font-size="${FONT_SIZE}" text-anchor="middle" fill="${textColor}">${escapeXml(value)}</text>
</g>`;
}

export function renderInput(component: Component, rect: LayoutRect): string {
  const label = component.props.label ?? '';
  const labelY = rect.y + PADDING + FONT_SIZE / 2;
  const inputY = rect.y + PADDING + FONT_SIZE + 8;
  const inputHeight = rect.height - PADDING * 2 - FONT_SIZE - 8;

  return `<g>
  <text x="${rect.x + PADDING}" y="${labelY}" font-size="${FONT_SIZE * 0.75}" fill="black">${escapeXml(label)}</text>
  <rect x="${rect.x + PADDING}" y="${inputY}" width="${rect.width - PADDING * 2}" height="${Math.max(inputHeight, 40)}" rx="${BORDER_RADIUS / 2}" fill="white" stroke="black" stroke-width="${STROKE_WIDTH}"/>
</g>`;
}

export function renderImg(component: Component, rect: LayoutRect): string {
  const alt = component.props.alt ?? component.props.src ?? 'image';
  const textX = rect.x + rect.width / 2;
  const textY = rect.y + rect.height / 2 + FONT_SIZE / 3;

  return `<g>
  <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${BORDER_RADIUS}" fill="#f0f0f0" stroke="#ccc" stroke-width="${STROKE_WIDTH}"/>
  <text x="${textX}" y="${textY}" font-size="${FONT_SIZE}" text-anchor="middle" fill="#666">[IMG: ${escapeXml(alt)}]</text>
</g>`;
}
