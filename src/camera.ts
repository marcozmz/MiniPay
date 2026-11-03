import { createReadGate } from './domain/scanning';

type Controls = { stop(): void };
type CameraDependencies = {
  getStream(): Promise<MediaStream>;
  decode(stream: MediaStream, video: HTMLVideoElement, read: (code: string) => void): Promise<Controls>;
};
const browserCamera: CameraDependencies = {
  async getStream() {
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) throw Error('Câmera indisponível. Acesse por HTTPS ou digite o código.');
    return navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } } });
  },
  async decode(stream, video, read) {
    const [{ BrowserMultiFormatReader }, { barcodeHints }] = await Promise.all([import('@zxing/browser'), import('./barcode')]);
    const reader = new BrowserMultiFormatReader(barcodeHints(), { delayBetweenScanAttempts: 150 });
    return reader.decodeFromStream(stream, video, result => { if (result) read(result.getText()); });
  },
};

export function startCamera(video: HTMLVideoElement, onRead: (code: string) => void, dependencies: CameraDependencies = browserCamera) {
  const gate = createReadGate(); gate.arm();
  let stopped = false;
  let stream: MediaStream | undefined;
  let controls: Controls | undefined;
  const stop = () => {
    stopped = true; gate.pause(); controls?.stop();
    stream?.getTracks().forEach(track => track.stop());
    video.srcObject = null;
  };
  const ready = (async () => {
    try {
      stream = await dependencies.getStream();
      if (stopped) { stop(); return; }
      controls = await dependencies.decode(stream, video, code => {
        if (!gate.take(code)) return;
        stop(); onRead(code);
      });
      if (stopped) stop();
    } catch (error) { stop(); throw error; }
  })();
  return { stop, ready };
}

export function cameraError(error: unknown) {
  if (error instanceof Error && ['NotAllowedError', 'SecurityError'].includes(error.name)) return 'Permissão da câmera negada. Libere nas configurações do navegador ou digite o código.';
  return error instanceof Error && error.message.startsWith('Câmera indisponível') ? error.message : 'Não foi possível abrir a câmera. Digite o código ou tente abrir a câmera novamente.';
}
