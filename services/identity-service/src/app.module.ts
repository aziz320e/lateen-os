import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { AppConfig } from './config/index';
import { AuthController } from './api/auth/auth.controller';
import { HealthController } from './api/health/health.controller';
import {
  API_KEY_SERVICE,
  APP_CONFIG,
  AUTH_SERVICE,
  SERVICE_ACCOUNT_SERVICE,
} from './api/tokens';
import type { ApiKeyService } from './application/api-key.service';
import type { AuthService } from './application/auth.service';
import type { ServiceAccountService } from './application/service-account.service';

export interface AppModuleOptions {
  config: AppConfig;
  authService: AuthService;
  apiKeyService: ApiKeyService;
  serviceAccountService: ServiceAccountService;
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
      controllers: [AuthController, HealthController],
      providers: [
        { provide: APP_CONFIG, useValue: options.config },
        { provide: AUTH_SERVICE, useValue: options.authService },
        { provide: API_KEY_SERVICE, useValue: options.apiKeyService },
        { provide: SERVICE_ACCOUNT_SERVICE, useValue: options.serviceAccountService },
      ],
    };
  }
}
