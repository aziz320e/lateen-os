import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module.js';
import { SecurityModule } from '../../../security/security.module.js';
import { InventoryController } from './inventory.controller.js';

// `SecurityModule` is required alongside `AuthModule` because
// `PermissionsGuard` depends on `AuthorizationService` (from
// `SecurityModule`), which `AuthModule` does not re-export — the same
// pattern already used by `CrmApiModule`/`FinanceApiModule`.
@Module({
  imports: [AuthModule, SecurityModule],
  controllers: [InventoryController],
})
export class InventoryApiModule {}
