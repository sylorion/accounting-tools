// ==================================================
// File: services/accounting/src/signature/Signer.ts
// (Example digital signature; real PDF signing needs more advanced approach.)
// ==================================================
import crypto from 'crypto';
import { Buffer } from 'buffer';

export class Signer {
  static sign(data: Uint8Array, privateKey: string): Buffer {
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(data);
    sign.end();
    return sign.sign(privateKey);
  }

  static verify(data: Uint8Array, signature: Buffer, publicKey: string): boolean {
    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(data);
    verify.end();
    return verify.verify(publicKey, signature);
  }
}