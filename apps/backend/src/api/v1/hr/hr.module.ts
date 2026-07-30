import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module.js';
import { HrController } from './hr.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [HrController],
})
export class HrApiModule {}
