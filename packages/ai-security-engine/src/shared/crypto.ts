/**
 * Real, deterministic-when-injected cryptography, built entirely on
 * Node's built-in `node:crypto` — no third-party dependency, no mock.
 * Every function that needs randomness accepts an injectable source
 * (mirroring this codebase's injectable `now()` clock convention) so
 * tests remain deterministic without weakening production behavior,
 * which defaults to real `crypto.randomBytes`.
 *
 * @module shared/crypto
 */
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export type RandomBytesFn = (size: number) => Buffer;

const defaultRandomBytes: RandomBytesFn = (size) => randomBytes(size);

/** Real SHA-256 hex digest — used for one-way hashing of tokens and API keys (never store the plaintext). */
export function hashValue(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

/** Real, cryptographically-strong random token, hex-encoded. Injectable for deterministic tests. */
export function generateRandomToken(byteLength = 32, randomBytesFn: RandomBytesFn = defaultRandomBytes): string {
  return randomBytesFn(byteLength).toString('hex');
}

/** Real 256-bit AES symmetric key, hex-encoded. Injectable for deterministic tests. */
export function generateEncryptionKey(randomBytesFn: RandomBytesFn = defaultRandomBytes): string {
  return randomBytesFn(32).toString('hex');
}

export interface EncryptedValue {
  readonly ciphertext: string;
  readonly iv: string;
  readonly authTag: string;
}

/** Real AES-256-GCM encryption. `key` must be a 32-byte hex string (see {@link generateEncryptionKey}). */
export function encryptValue(key: string, plaintext: string, randomBytesFn: RandomBytesFn = defaultRandomBytes): EncryptedValue {
  const iv = randomBytesFn(12);
  const cipher = createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    ciphertext: ciphertext.toString('hex'),
    iv: iv.toString('hex'),
    authTag: cipher.getAuthTag().toString('hex'),
  };
}

/** Real AES-256-GCM decryption. Throws if `key`/`iv`/`authTag` don't match (real integrity check — never silently returns garbage). */
export function decryptValue(key: string, encrypted: EncryptedValue): string {
  const decipher = createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), Buffer.from(encrypted.iv, 'hex'));
  decipher.setAuthTag(Buffer.from(encrypted.authTag, 'hex'));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(encrypted.ciphertext, 'hex')), decipher.final()]);
  return plaintext.toString('utf8');
}

/** Real HMAC-SHA256 signature, hex-encoded — deterministic for a given key and value. */
export function signHmac(value: string, signingKey: string): string {
  return createHmac('sha256', signingKey).update(value, 'utf8').digest('hex');
}

/** Real, timing-safe HMAC-SHA256 signature verification. */
export function verifyHmac(value: string, signature: string, signingKey: string): boolean {
  const expected = signHmac(value, signingKey);
  const expectedBuffer = Buffer.from(expected, 'hex');
  const actualBuffer = Buffer.from(signature, 'hex');
  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
