import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module.js';
import { CustomerSuccessController } from './customer-success.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [CustomerSuccessController],
})
export class CustomerSuccessApiModule {}
