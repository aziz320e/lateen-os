import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module.js';
import { SalesController } from './sales.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [SalesController],
})
export class SalesApiModule {}
