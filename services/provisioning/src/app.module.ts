import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { AppConfig } from './config/index';
import { HealthController } from './api/health/health.controller';
import { ProfilesController, ProvisionController } from './api/provision/provision.controller';
import { APP_CONFIG, PROVISIONING_SERVICE } from './api/tokens';
import type { ProvisioningService } from './application/provisioning.service';

export interface AppModuleOptions {
  config: AppConfig;
  provisioningService: ProvisioningService;
}

@Module({})
export class AppModule {
  static register(options: AppModuleOptions) {
    return {
      module: AppModule,
      imports: [
        LoggerModule.forRoot({
          pinoHttp: {
            level: options.config.LOG_LEVEL,
            transport:
              options.config.NODE_ENV === 'development'
                ? { target: 'pino-pretty', options: { colorize: true } }
                : undefined,
          },
        }),
      ],
      controllers: [HealthController, ProvisionController, ProfilesController],
      providers: [
        { provide: APP_CONFIG, useValue: options.config },
        { provide: PROVISIONING_SERVICE, useValue: options.provisioningService },
      ],
    };
  }
}
