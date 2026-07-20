import { describe, expect, it } from 'vitest';
import { ScryptPasswordHasher } from '../../src/infrastructure/auth/password-hasher';
import { validatePassword, getPasswordPolicy } from '../../src/infrastructure/auth/password-policy';
import { loadConfig } from '../../src/config/index';

describe('PasswordHasher', () => {
  it('hashes and verifies passwords', async () => {
    const hasher = new ScryptPasswordHasher();
    const hash = await hasher.hash('SecurePass1');
    expect(await hasher.verify('SecurePass1', hash)).toBe(true);
    expect(await hasher.verify('WrongPass', hash)).toBe(false);
  });
});

describe('PasswordPolicy', () => {
  it('validates password requirements', () => {
    const config = loadConfig({ NODE_ENV: 'test', JWT_SECRET: 'test-secret-min-16-chars' });
    const policy = getPasswordPolicy(config);
    expect(validatePassword('short', policy).length).toBeGreaterThan(0);
    expect(validatePassword('ValidPass1', policy)).toEqual([]);
  });
});

describe('Config', () => {
  it('loads default port 4003', () => {
    const config = loadConfig({ NODE_ENV: 'test', JWT_SECRET: 'test-secret-min-16-chars' });
    expect(config.PORT).toBe(4003);
    expect(config.OTEL_SERVICE_NAME).toBe('identity-service');
  });
});
