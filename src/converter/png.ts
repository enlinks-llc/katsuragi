import sharp from 'sharp';

export async function convertToPng(svgString: string): Promise<Buffer> {
  const buffer = await sharp(Buffer.from(svgString)).png().toBuffer();
  return buffer;
}
