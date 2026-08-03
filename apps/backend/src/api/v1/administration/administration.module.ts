import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module.js';
import { SecurityModule } from '../../../security/security.module.js';
import { AdministrationController } from './administration.controller.js';

// `SecurityModule` is imported directly (mirroring `DatabaseModule`'s
// existing `[RuntimeRegistryModule, SecurityModule]` pattern) because
// `PermissionsGuard` (from `AuthModule`) depends on `AuthorizationService`
// (from `SecurityModule`), and `AuthModule` does not re-export
// `SecurityModule` — importing `AuthModule` alone is not enough to make
// `AuthorizationService` resolvable for a guard bound in this module.
@Module({
  imports: [AuthModule, SecurityModule],
  controllers: [AdministrationController],
})
export class AdministrationApiModule {}
