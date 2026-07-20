import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { PasswordHasher } from '../../domain/ports';

const scryptAsync = promisify(scrypt);

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    return `scrypt:${salt}:${derived.toString('hex')}`;
  }

  async verify(password: string, hash: string): Promise<boolean> {
    const [algo, salt, key] = hash.split(':');
    if (algo !== 'scrypt' || !salt || !key) return false;
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    const keyBuffer = Buffer.from(key, 'hex');
    if (keyBuffer.length !== derived.length) return false;
    return timingSafeEqual(keyBuffer, derived);
  }
}

export function hashToken(token: string): string {
  return Buffer.from(token).toString('base64url');
}

export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function generateApiKey(): { fullKey: string; prefix: string } {
  const raw = randomBytes(24).toString('base64url');
  const prefix = raw.slice(0, 8);
  return { fullKey: `lk_${prefix}_${raw}`, prefix };
}
