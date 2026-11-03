import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startCamera, cameraError } from '../src/camera';
import { createReadGate } from '../src/domain/scanning';
import { barcodeHints } from '../src/barcode';
import { BinaryBitmap, HybridBinarizer, MultiFormatReader, RGBLuminanceSource } from '@zxing/library';

test('decoder real preserva os dois zeros iniciais de EAN-13', () => {
  // Synthetic, valid EAN-13 0012345678905; the first digit selects all L patterns.
  const code = '0012345678905';
  const patterns = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  const left = [...code.slice(1, 7)].map(digit => patterns[Number(digit)]).join('');
  const right = [...code.slice(7)].map(digit => [...patterns[Number(digit)]].map(bit => bit === '0' ? '1' : '0').join('')).join('');
  const bits = '00000000000' + '101' + left + '01010' + right + '101' + '00000000000';
  const width = bits.length * 3, height = 100;
  const pixels = Uint8ClampedArray.from({ length: width * height }, (_, i) => bits[Math.floor(i % width / 3)] === '1' ? 0 : 255);
  const bitmap = new BinaryBitmap(new HybridBinarizer(new RGBLuminanceSource(pixels, width, height)));
  assert.equal(new MultiFormatReader().decode(bitmap, barcodeHints()).getText(), code);
});

test('leitura aceita código textual uma vez e só retoma quando rearmada', () => {
  const gate = createReadGate();
  assert.equal(gate.take('00123456'), false);
  gate.arm(); assert.equal(gate.take('invalid'), false);
  assert.equal(gate.take('00123456'), true);
  assert.equal(gate.take('00123456'), false); assert.equal(gate.take('99999999'), false);
  gate.arm(); assert.equal(gate.take('00123456'), true);
});

test('câmera libera tracks, ignora callbacks repetidos e permite nova sessão explícita', async () => {
  const codes: string[] = []; let stopped = 0; let decoderStopped = 0;
  let read!: (value: string) => void;
  const dependencies = {
    async getStream() { return { getTracks: () => [{ stop() { stopped++; } }] } as unknown as MediaStream; },
    async decode(_stream: MediaStream, _video: HTMLVideoElement, callback: (value: string) => void) { read = callback; return { stop() { decoderStopped++; } }; },
  };
  const video = { srcObject: null } as HTMLVideoElement;
  const camera = startCamera(video, code => codes.push(code), dependencies); await camera.ready;
  read('00123456'); read('00123456'); read('99999999');
  assert.deepEqual(codes, ['00123456']); assert(stopped > 0); assert(decoderStopped > 0);
  const next = startCamera(video, code => codes.push(code), dependencies); await next.ready;
  read('00123456'); assert.deepEqual(codes, ['00123456', '00123456']); next.stop();
});

test('fechar durante permissão pendente libera stream tardio sem iniciar decoder', async () => {
  let resolve!: (stream: MediaStream) => void; let stopped = false;
  const session = startCamera({ srcObject: null } as HTMLVideoElement, () => assert.fail('leitura após fechar'), {
    getStream: () => new Promise(done => { resolve = done; }),
    async decode() { assert.fail('decoder iniciado após fechar'); },
  });
  session.stop(); resolve({ getTracks: () => [{ stop() { stopped = true; } }] } as unknown as MediaStream);
  await session.ready; assert(stopped);
});

test('permissão negada e câmera ausente informam alternativa manual', async () => {
  const denied = Object.assign(new Error('Denied'), { name: 'NotAllowedError' });
  const session = startCamera({ srcObject: null } as HTMLVideoElement, () => assert.fail(), {
    async getStream() { throw denied; }, async decode() { assert.fail(); },
  });
  await assert.rejects(session.ready, denied);
  assert.match(cameraError(denied), /negada.*digite o código/);
  assert.match(cameraError(Error('Device absent')), /Digite o código/);
});
