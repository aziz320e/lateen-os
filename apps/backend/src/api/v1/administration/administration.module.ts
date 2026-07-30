import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module.js';
import { AdministrationController } from './administration.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [AdministrationController],
})
export class AdministrationApiModule {}
