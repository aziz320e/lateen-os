import type { AppConfig } from '../../config/index';
import type { PasswordPolicy, SecretRotationContract } from '../../domain/types';

export function getPasswordPolicy(config: AppConfig): PasswordPolicy {
  return {
    minLength: config.PASSWORD_MIN_LENGTH,
    requireUppercase: true,
    requireLowercase: true,
    requireDigit: true,
    requireSpecial: false,
  };
}

export function validatePassword(password: string, policy: PasswordPolicy): string[] {
  const errors: string[] = [];
  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain an uppercase letter');
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain a lowercase letter');
  }
  if (policy.requireDigit && !/\d/.test(password)) {
    errors.push('Password must contain a digit');
  }
  if (policy.requireSpecial && !/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain a special character');
  }
  return errors;
}

export function getSecretRotationContracts(): SecretRotationContract[] {
  return [
    {
      secretType: 'jwt',
      currentVersion: 1,
      rotateBefore: '90d',
      rotationProcedure: 'Issue new JWT_SECRET, dual-sign during overlap window, revoke old after 24h',
    },
    {
      secretType: 'api_key',
      currentVersion: 1,
      rotateBefore: '180d',
      rotationProcedure: 'Create new API key, update clients, revoke old key after grace period',
    },
    {
      secretType: 'service_account',
      currentVersion: 1,
      rotateBefore: '90d',
      rotationProcedure: 'Rotate client secret via POST /api/v1/auth/service-accounts/:id/rotate',
    },
    {
      secretType: 'keycloak_client',
      currentVersion: 1,
      rotateBefore: '365d',
      rotationProcedure: 'Rotate in Keycloak admin console, update KEYCLOAK_CLIENT_SECRET env',
    },
  ];
}

export function isIpAllowed(ip: string | undefined, allowedCidrs: string): boolean {
  if (!allowedCidrs || allowedCidrs.trim() === '') return true;
  if (!ip) return false;
  const cidrs = allowedCidrs.split(',').map((c) => c.trim()).filter(Boolean);
  return cidrs.some((cidr) => {
    if (cidr.includes('/')) {
      const [network] = cidr.split('/');
      return ip.startsWith(network!.slice(0, network!.lastIndexOf('.')));
    }
    return ip === cidr;
  });
}
