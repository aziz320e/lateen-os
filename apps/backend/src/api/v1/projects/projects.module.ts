import { Module } from '@nestjs/common';
import { AuthModule } from '../../../auth/auth.module.js';
import { ProjectsController } from './projects.controller.js';

@Module({
  imports: [AuthModule],
  controllers: [ProjectsController],
})
export class ProjectsApiModule {}
