import sharp from 'sharp';
import { z } from 'zod';
import { maxPhotoBytes } from '../src/domain/scanning';

export const photoSchema = z.object({
  mime: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  data: z.string().min(4).max(4 * Math.ceil(maxPhotoBytes / 3)).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/),
}).strict();

export async function preparePhoto(input: z.infer<typeof photoSchema>) {
  const bytes = Buffer.from(input.data, 'base64');
  const invalid = () => Object.assign(new Error('Foto inválida. Use JPEG, PNG ou WebP de até 3 MiB e 16 megapixels.'), { statusCode: 400 });
  if (!bytes.length || bytes.length > maxPhotoBytes) throw invalid();
  try {
    const image = sharp(bytes, { limitInputPixels: 16_000_000, failOn: 'warning' });
    const metadata = await image.metadata();
    const formats = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
    if (metadata.format !== formats[input.mime] || (metadata.pages ?? 1) > 1) throw invalid();
    // Full decode + re-encode validates content and removes EXIF/location metadata.
    const result = await image.rotate().resize(1200, 1200, { fit: 'inside', withoutEnlargement: true }).flatten({ background: '#ffffff' }).jpeg({ quality: 82 }).toBuffer();
    if (result.length > maxPhotoBytes) throw invalid();
    return result;
  } catch { throw invalid(); }
}
