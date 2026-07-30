import { Module } from '@nestjs/common';
import { SecurityModule } from '../security/security.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PermissionsGuard } from './guards/permissions.guard.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { RolesGuard } from './guards/roles.guard.js';
import { PasswordService } from './password.service.js';
import { RbacService } from './rbac.service.js';
import { SessionService } from './session.service.js';
import { TokenService } from './token.service.js';

@Module({
  imports: [SecurityModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    SessionService,
    RbacService,
    JwtAuthGuard,
    RolesGuard,
    PermissionsGuard,
  ],
  exports: [AuthService, TokenService, JwtAuthGuard, RolesGuard, PermissionsGuard],
})
export class AuthModule {}
