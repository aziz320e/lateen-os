import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module.js';
import { FinanceController } from './finance.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [FinanceController],
})
export class FinanceApiModule {}
