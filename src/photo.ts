import { maxPhotoBytes, type PhotoInput } from './domain/scanning';

export async function readPhotoFile(file: File): Promise<PhotoInput> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw Error('Escolha uma foto JPEG, PNG ou WebP.');
  if (file.size > 20 * 1024 * 1024) throw Error('A foto deve ter até 20 MiB. Escolha uma imagem menor.');
  const source = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(Error('Não foi possível abrir a foto.'));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
  const image = new Image();
  await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(Error('Não foi possível abrir a foto. Use JPEG, PNG ou WebP.')); image.src = source; });
  if (image.naturalWidth * image.naturalHeight > 16_000_000) throw Error('Use uma foto de até 16 megapixels. Reduza a resolução da câmera.');
  const ratio = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio)); canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const context = canvas.getContext('2d');
  if (!context) throw Error('Não foi possível preparar a foto neste navegador.');
  context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const data = canvas.toDataURL('image/jpeg', 0.82).split(',')[1];
  if (!data || data.length > 4 * Math.ceil(maxPhotoBytes / 3)) throw Error('A foto preparada deve ter até 3 MiB. Escolha uma imagem menor.');
  return { mime: 'image/jpeg', data };
}
