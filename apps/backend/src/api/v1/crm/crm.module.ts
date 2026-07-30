import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module.js';
import { CrmController } from './crm.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [CrmController],
})
export class CrmApiModule {}
