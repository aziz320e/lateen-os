import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module.js';
import { SecurityModule } from '../../../security/security.module.js';
import { FinanceController } from './finance.controller.js';

// `SecurityModule` is required alongside `AuthModule` because
// `PermissionsGuard` depends on `AuthorizationService` (from
// `SecurityModule`), which `AuthModule` does not re-export — the same
// pattern already used by `DatabaseModule`.
@Module({
  imports: [AuthModule, SecurityModule],
  controllers: [FinanceController],
})
export class FinanceApiModule {}
