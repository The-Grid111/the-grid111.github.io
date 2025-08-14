// THEGRID Signature Verification (pseudo-code / starter)
import crypto from 'crypto';

export function verifySignature(payloadJson, signatureHex, secret) {
  const h = crypto.createHmac('sha256', secret).update(payloadJson).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(h, 'hex'), Buffer.from(signatureHex, 'hex'));
}

// Example usage:
// const ok = verifySignature(JSON.stringify(body), body.sig, process.env.THEGRID_SECRET);