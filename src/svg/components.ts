import type { Align, Component, LayoutRect, RenderContext } from '../types.js';
import type { Theme } from './themes.js';
import { loadImageAsDataUri, resolveImagePath } from '../utils/image.js';

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

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

const LINE_HEIGHT = 1.2;
const MIN_FONT_SIZE = 8;

function isCjk(char: string): boolean {
  const cp = char.codePointAt(0) ?? 0;
  return (
    (cp >= 0x4e00 && cp <= 0x9fff) || // CJK統合漢字
    (cp >= 0x3040 && cp <= 0x309f) || // ひらがな
    (cp >= 0x30a0 && cp <= 0x30ff) || // カタカナ
    (cp >= 0xff01 && cp <= 0xff60) || // 全角英数記号
    (cp >= 0xac00 && cp <= 0xd7af) // ハングル
  );
}

function estimateCharWidth(char: string, fontSize: number): number {
  if (isCjk(char)) return fontSize * 1.0;
  const cp = char.codePointAt(0) ?? 0;
  if (cp < 0x80) return fontSize * 0.55;
  return fontSize * 0.7;
}

function estimateTextWidth(text: string, fontSize: number): number {
  let width = 0;
  for (const char of text) width += estimateCharWidth(char, fontSize);
  return width;
}

function tokenize(text: string): string[] {
  const tokens: string[] = [];
  let current = '';
  for (const char of text) {
    if (isCjk(char)) {
      if (current !== '') {
        tokens.push(current);
        current = '';
      }
      tokens.push(char);
    } else {
      current += char;
      if (char === ' ') {
        tokens.push(current);
        current = '';
      }
    }
  }
  if (current !== '') tokens.push(current);
  return tokens;
}

export function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
  const hardLines = text.split('\n');
  const result: string[] = [];

  for (const hardLine of hardLines) {
    if (hardLine === '') {
      result.push('');
      continue;
    }
    let currentLine = '';
    let currentWidth = 0;

    for (const token of tokenize(hardLine)) {
      const tokenWidth = estimateTextWidth(token, fontSize);
      if (currentWidth + tokenWidth <= maxWidth) {
        currentLine += token;
        currentWidth += tokenWidth;
      } else if (currentWidth === 0) {
        // Single token exceeds maxWidth — force-add to avoid infinite loop
        result.push(token);
      } else {
        result.push(currentLine);
        currentLine = token;
        currentWidth = tokenWidth;
      }
    }
    if (currentLine !== '') result.push(currentLine);
  }
  return result;
}

export function fitTextToRect(
  text: string,
  cellWidth: number,
  cellHeight: number,
  padding: number,
  themeFontSize: number,
): { lines: string[]; fontSize: number } {
  const availableWidth = cellWidth - padding * 2;
  const availableHeight = cellHeight - padding * 2;

  let fontSize = themeFontSize;
  while (fontSize >= MIN_FONT_SIZE) {
    const lines = wrapText(text, availableWidth, fontSize);
    if (lines.length * fontSize * LINE_HEIGHT <= availableHeight) {
      return { lines, fontSize };
    }
    fontSize -= 2;
  }
  // Still doesn't fit at minimum size — return minimum anyway
  return { lines: wrapText(text, availableWidth, MIN_FONT_SIZE), fontSize: MIN_FONT_SIZE };
}

function renderMultilineText(
  lines: string[],
  x: number,
  baseY: number,
  fontSize: number,
  textAnchor: string,
  fill: string,
  lineHeight = LINE_HEIGHT,
): string {
  if (lines.length === 1) {
    return `<text x="${x}" y="${baseY}" font-size="${fontSize}" text-anchor="${textAnchor}" fill="${fill}">${escapeXml(lines[0])}</text>`;
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

export function renderTxt(component: Component, rect: LayoutRect, theme: Theme): string {
  const align = component.props.align ?? 'left';
  const value = component.props.value ?? '';
  const bg = component.props.bg;
  const border = component.props.border;

  const { lines, fontSize } = fitTextToRect(
    value,
    rect.width,
    rect.height,
    rect.padding,
    theme.fontSize,
  );
  const textX = getTextX(rect, align);
  const textY = rect.y + rect.height / 2 + fontSize / 3;

  const parts: string[] = [];

  // Add background rect if bg or border is specified
  if (bg || border) {
    const strokeAttr = border
      ? `stroke="${border}" stroke-width="${theme.strokeWidth}"`
      : '';
    parts.push(
      `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${theme.borderRadius}" fill="${bg ?? 'transparent'}" ${strokeAttr}/>`,
    );
  }

  parts.push(renderMultilineText(lines, textX, textY, fontSize, getTextAnchor(align), 'black'));

  if (parts.length === 1) {
    return parts[0];
  }
  return `<g>\n  ${parts.join('\n  ')}\n</g>`;
}

export function renderBox(component: Component, rect: LayoutRect, theme: Theme): string {
  const fill = component.props.bg ?? theme.defaultBg;
  const border = component.props.border;
  const strokeAttr = border
    ? `stroke="${border}" stroke-width="${theme.strokeWidth}"`
    : '';

  return `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${theme.borderRadius}" fill="${fill}" ${strokeAttr}/>`;
}

export function renderBtn(component: Component, rect: LayoutRect, theme: Theme): string {
  const value = component.props.value ?? '';
  const fill = component.props.bg ?? theme.defaultBg;
  const border = component.props.border;
  const strokeAttr = border
    ? `stroke="${border}" stroke-width="${theme.strokeWidth}"`
    : '';

  const { lines, fontSize } = fitTextToRect(
    value,
    rect.width,
    rect.height,
    rect.padding,
    theme.fontSize,
  );
  const textX = rect.x + rect.width / 2;
  const textY = rect.y + rect.height / 2 + fontSize / 3;

  const textElement = renderMultilineText(lines, textX, textY, fontSize, 'middle', 'black');

  return `<g>
  <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${theme.borderRadius}" fill="${fill}" ${strokeAttr}/>
  ${textElement}
</g>`;
}

export function renderInput(component: Component, rect: LayoutRect, theme: Theme): string {
  const label = component.props.label ?? '';
  const fill = component.props.bg ?? 'white';
  const border = component.props.border ?? 'black';
  const padding = rect.padding;
  const labelY = rect.y + padding + theme.fontSize / 2;
  const inputY = rect.y + padding + theme.fontSize + 8;
  const inputHeight = rect.height - padding * 2 - theme.fontSize - 8;

  return `<g>
  <text x="${rect.x + padding}" y="${labelY}" font-size="${theme.fontSize * 0.75}" fill="black">${escapeXml(label)}</text>
  <rect x="${rect.x + padding}" y="${inputY}" width="${rect.width - padding * 2}" height="${Math.max(inputHeight, 40)}" rx="${theme.borderRadius / 2}" fill="${fill}" stroke="${border}" stroke-width="${theme.strokeWidth}"/>
</g>`;
}

function renderImgPlaceholder(
  rect: LayoutRect,
  alt: string,
  theme: Theme,
  bg?: string,
  border?: string,
): string {
  const textX = rect.x + rect.width / 2;
  const textY = rect.y + rect.height / 2 + theme.fontSize / 3;
  const fill = bg ?? '#f0f0f0';
  const stroke = border ?? '#ccc';

  return `<g>
  <rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" rx="${theme.borderRadius}" fill="${fill}" stroke="${stroke}" stroke-width="${theme.strokeWidth}"/>
  <text x="${textX}" y="${textY}" font-size="${theme.fontSize}" text-anchor="middle" fill="#666">[IMG: ${escapeXml(alt)}]</text>
</g>`;
}

export function renderImg(
  component: Component,
  rect: LayoutRect,
  theme: Theme,
  context?: RenderContext,
): string {
  const { src, alt, bg, border } = component.props;
  const altText = alt ?? src ?? 'image';

  // If no src or context, render placeholder
  if (!src || !context?.basePath) {
    return renderImgPlaceholder(rect, altText, theme, bg, border);
  }

  try {
    const imagePath = resolveImagePath(src, context.basePath);
    const { dataUri } = loadImageAsDataUri(imagePath);

    return `<image x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" href="${dataUri}" preserveAspectRatio="xMidYMid meet"/>`;
  } catch {
    // Fallback to placeholder on error
    return renderImgPlaceholder(rect, altText, theme, bg, border);
  }
}
