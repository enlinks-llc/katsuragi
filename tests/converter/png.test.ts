import { describe, expect, test } from 'vitest';
import { convertToPng } from '../../src/converter/png.js';

describe('convertToPng', () => {
  test('converts SVG string to PNG buffer', async () => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="white"/>
</svg>`;

    const pngBuffer = await convertToPng(svg);

    expect(pngBuffer).toBeInstanceOf(Buffer);
    // PNG magic bytes: 0x89 0x50 0x4E 0x47 (‰PNG)
    expect(pngBuffer[0]).toBe(0x89);
    expect(pngBuffer[1]).toBe(0x50);
    expect(pngBuffer[2]).toBe(0x4e);
    expect(pngBuffer[3]).toBe(0x47);
  });

  test('produces valid PNG with expected dimensions', async () => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100" viewBox="0 0 200 100">
  <rect width="200" height="100" fill="blue"/>
</svg>`;

    const pngBuffer = await convertToPng(svg);
    expect(pngBuffer.length).toBeGreaterThan(0);
  });
});
