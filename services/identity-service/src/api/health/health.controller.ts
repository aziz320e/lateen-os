import { Controller, Get } from '@nestjs/common';
import { getSecretRotationContracts } from '../../infrastructure/auth/password-policy';

@Controller()
export class HealthController {
  @Get('health')
  health() {
    return { status: 'ok', service: 'identity-service' };
  }

  @Get('metrics')
  metrics() {
    return { service: 'identity-service', metrics: 'enabled' };
  }

  @Get('api/v1/security/rotation-contracts')
  rotationContracts() {
    return { contracts: getSecretRotationContracts() };
  }
}
