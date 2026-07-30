import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module.js';
import { InventoryController } from './inventory.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [InventoryController],
})
export class InventoryApiModule {}
