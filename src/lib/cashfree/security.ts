import * as crypto from 'crypto';

/**
 * Generates an RSA-SHA256 signature for the Cashfree API.
 * The signature is Base64 encoded.
 *
 * @param payload - The request payload object to be signed.
 * @returns The Base64 encoded signature string.
 * @throws Will throw an error if the private key is not configured.
 */
export function generateCashfreeSignature(payload: Record<string, any>): string {
  const privateKey = process.env.CASHFREE_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('CASHFREE_PRIVATE_KEY environment variable is not set.');
  }

  // The payload must be stringified without whitespace
  const payloadString = JSON.stringify(payload);

  const signer = crypto.createSign('RSA-SHA256');
  signer.update(payloadString);
  signer.end();

  const signature = signer.sign(privateKey, 'base64');

  return signature;
} 