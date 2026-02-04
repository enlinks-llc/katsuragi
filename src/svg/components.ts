import type { Component, LayoutRect, Align, Style, RenderContext } from '../types.js';
import { resolveImagePath, loadImageAsDataUri } from '../utils/image.js';

const STROKE_WIDTH = 2;
const BORDER_RADIUS = 8;
const FONT_SIZE = 24;

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
  const padding = rect.padding;
  switch (align) {
    case 'center':
      return rect.x + rect.width / 2;
    case 'right':
      return rect.x + rect.width - padding;
    default:
      return rect.x + padding;
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

function renderMultilineText(
  text: string,
  x: number,
  baseY: number,
  fontSize: number,
  textAnchor: string,
  fill: string,
  lineHeight = 1.2
): string {
  const lines = text.split('\n');

  if (lines.length === 1) {
    return `<text x="${x}" y="${baseY}" font-size="${fontSize}" text-anchor="${textAnchor}" fill="${fill}">${escapeXml(text)}</text>`;
  }

  // Multi-line with tspan elements
  const lineSpacing = fontSize * lineHeight;
  const totalHeight = (lines.length - 1) * lineSpacing;
  const startY = baseY - totalHeight / 2;

  const tspans = lines
    .map((line, i) => {
      const y = startY + i * lineSpacing;
      return `<tspan x="${x}" y="${y}">${escapeXml(line)}</tspan>`;
    })
    .join('');

  return `<text font-size="${fontSize}" text-anchor="${textAnchor}" fill="${fill}">${tspans}</text>`;
}

export function renderTxt(component: Component, rect: LayoutRect): string {
  const align = component.props.align ?? 'left';
  const value = component.props.value ?? '';
  const textX = getTextX(rect, align);
  const textY = rect.y + rect.height / 2 + FONT_SIZE / 3;

  return renderMultilineText(value, textX, textY, FONT_SIZE, getTextAnchor(align), 'black');
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

  const textElement = renderMultilineText(value, textX, textY, FONT_SIZE, 'middle', textColor);

  return `<g>
  <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${BORDER_RADIUS}" fill="${fill}" ${stroke}/>
  ${textElement}
</g>`;
}

export function renderInput(component: Component, rect: LayoutRect): string {
  const label = component.props.label ?? '';
  const padding = rect.padding;
  const labelY = rect.y + padding + FONT_SIZE / 2;
  const inputY = rect.y + padding + FONT_SIZE + 8;
  const inputHeight = rect.height - padding * 2 - FONT_SIZE - 8;

  return `<g>
  <text x="${rect.x + padding}" y="${labelY}" font-size="${FONT_SIZE * 0.75}" fill="black">${escapeXml(label)}</text>
  <rect x="${rect.x + padding}" y="${inputY}" width="${rect.width - padding * 2}" height="${Math.max(inputHeight, 40)}" rx="${BORDER_RADIUS / 2}" fill="white" stroke="black" stroke-width="${STROKE_WIDTH}"/>
</g>`;
}

function renderImgPlaceholder(rect: LayoutRect, alt: string): string {
  const textX = rect.x + rect.width / 2;
  const textY = rect.y + rect.height / 2 + FONT_SIZE / 3;

  return `<g>
  <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${BORDER_RADIUS}" fill="#f0f0f0" stroke="#ccc" stroke-width="${STROKE_WIDTH}"/>
  <text x="${textX}" y="${textY}" font-size="${FONT_SIZE}" text-anchor="middle" fill="#666">[IMG: ${escapeXml(alt)}]</text>
</g>`;
}

export function renderImg(
  component: Component,
  rect: LayoutRect,
  context?: RenderContext
): string {
  const { src, alt } = component.props;
  const altText = alt ?? src ?? 'image';

  // If no src or context, render placeholder
  if (!src || !context?.basePath) {
    return renderImgPlaceholder(rect, altText);
  }

  try {
    const imagePath = resolveImagePath(src, context.basePath);
    const { dataUri } = loadImageAsDataUri(imagePath);

    return `<image x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" href="${dataUri}" preserveAspectRatio="xMidYMid meet"/>`;
  } catch {
    // Fallback to placeholder on error
    return renderImgPlaceholder(rect, altText);
  }
}
