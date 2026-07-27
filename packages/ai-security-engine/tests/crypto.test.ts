import { describe, expect, it } from 'vitest';
import {
  decryptValue,
  encryptValue,
  generateEncryptionKey,
  generateRandomToken,
  hashValue,
  signHmac,
  verifyHmac,
} from '../src/shared/crypto.js';

describe('hashValue (real SHA-256)', () => {
  it('is deterministic for the same input', () => {
    expect(hashValue('hello')).toBe(hashValue('hello'));
  });

  it('produces different hashes for different inputs', () => {
    expect(hashValue('hello')).not.toBe(hashValue('world'));
  });

  it('produces a 64-character hex digest', () => {
    expect(hashValue('hello')).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('generateRandomToken (real crypto.randomBytes)', () => {
  it('produces distinct tokens across calls by default', () => {
    expect(generateRandomToken()).not.toBe(generateRandomToken());
  });

  it('is deterministic when a fixed random source is injected', () => {
    const fixed = () => Buffer.from('0'.repeat(64), 'hex');
    expect(generateRandomToken(32, fixed)).toBe(generateRandomToken(32, fixed));
  });

  it('produces a hex string of the requested byte length', () => {
    expect(generateRandomToken(16)).toHaveLength(32);
  });
});

describe('generateEncryptionKey (real crypto.randomBytes)', () => {
  it('produces a 64-character hex (256-bit) key', () => {
    expect(generateEncryptionKey()).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic when a fixed random source is injected', () => {
    const fixed = () => Buffer.from('1'.repeat(64), 'hex');
    expect(generateEncryptionKey(fixed)).toBe(generateEncryptionKey(fixed));
  });
});

describe('encryptValue / decryptValue (real AES-256-GCM)', () => {
  it('round-trips a plaintext value', () => {
    const key = generateEncryptionKey();
    const encrypted = encryptValue(key, 'super secret value');
    expect(decryptValue(key, encrypted)).toBe('super secret value');
  });

  it('produces different ciphertext across calls by default (random IV)', () => {
    const key = generateEncryptionKey();
    const a = encryptValue(key, 'hello');
    const b = encryptValue(key, 'hello');
    expect(a.ciphertext).not.toBe(b.ciphertext);
  });

  it('is fully deterministic when a fixed random source is injected', () => {
    const key = generateEncryptionKey();
    const fixedIv = () => Buffer.from('a'.repeat(24), 'hex');
    const a = encryptValue(key, 'hello', fixedIv);
    const b = encryptValue(key, 'hello', fixedIv);
    expect(a).toEqual(b);
  });

  it('throws a real authentication failure when decrypting with the wrong key', () => {
    const key = generateEncryptionKey();
    const wrongKey = generateEncryptionKey();
    const encrypted = encryptValue(key, 'hello');
    expect(() => decryptValue(wrongKey, encrypted)).toThrow();
  });

  it('throws when the ciphertext has been tampered with', () => {
    const key = generateEncryptionKey();
    const encrypted = encryptValue(key, 'hello');
    const tampered = { ...encrypted, ciphertext: encrypted.ciphertext.replace(/^../, '00') };
    expect(() => decryptValue(key, tampered)).toThrow();
  });
});

describe('signHmac / verifyHmac (real HMAC-SHA256)', () => {
  it('is deterministic for the same value and key', () => {
    expect(signHmac('hello', 'signing-key')).toBe(signHmac('hello', 'signing-key'));
  });

  it('verifies a genuine signature', () => {
    const signature = signHmac('hello', 'signing-key');
    expect(verifyHmac('hello', signature, 'signing-key')).toBe(true);
  });

  it('rejects a signature from a different key', () => {
    const signature = signHmac('hello', 'signing-key');
    expect(verifyHmac('hello', signature, 'other-key')).toBe(false);
  });

  it('rejects a signature for different content', () => {
    const signature = signHmac('hello', 'signing-key');
    expect(verifyHmac('goodbye', signature, 'signing-key')).toBe(false);
  });

  it('rejects a malformed signature without throwing', () => {
    expect(verifyHmac('hello', 'not-a-real-signature', 'signing-key')).toBe(false);
  });
});
