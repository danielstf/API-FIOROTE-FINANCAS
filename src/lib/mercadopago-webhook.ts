import { createHmac, timingSafeEqual } from "node:crypto";

interface MercadoPagoSignatureParams {
  dataId: string;
  requestId: string | undefined;
  signature: string | undefined;
  secret: string;
}

export function verifyMercadoPagoSignature({
  dataId,
  requestId,
  signature,
  secret,
}: MercadoPagoSignatureParams) {
  if (!dataId || !requestId || !signature || !secret) {
    return false;
  }

  const signatureParts = signature.split(",").reduce<Record<string, string>>(
    (acc, part) => {
      const [key, value] = part.split("=");

      if (key && value) {
        acc[key.trim()] = value.trim();
      }

      return acc;
    },
    {},
  );

  const ts = signatureParts.ts;
  const hash = signatureParts.v1;

  if (!ts || !hash) {
    return false;
  }

  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${ts};`;
  const expectedHash = createHmac("sha256", secret)
    .update(manifest)
    .digest("hex");

  const expectedBuffer = Buffer.from(expectedHash);
  const receivedBuffer = Buffer.from(hash);

  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, receivedBuffer);
}
