import { Module } from '@nestjs/common';
import { RuntimeRegistryModule } from '../runtime-registry/runtime-registry.module.js';
import { AuditService } from './audit.service.js';
import { AuthenticationService } from './authentication.service.js';
import { AuthorizationService } from './authorization.service.js';
import { IdentityAdministrationService } from './identity-administration.service.js';

@Module({
  imports: [RuntimeRegistryModule],
  providers: [
    AuthenticationService,
    AuthorizationService,
    AuditService,
    IdentityAdministrationService,
  ],
  exports: [
    AuthenticationService,
    AuthorizationService,
    AuditService,
    IdentityAdministrationService,
  ],
})
export class SecurityModule {}
