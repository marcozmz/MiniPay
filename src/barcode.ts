import { BarcodeFormat, DecodeHintType } from '@zxing/library';

export function barcodeHints() {
  // Request EAN-13 without UPC_A: ZXing otherwise strips its leading zero.
  return new Map([[DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.ITF]]]);
}
