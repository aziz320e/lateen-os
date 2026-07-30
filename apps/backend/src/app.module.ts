import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { AppConfig } from './config/index.js';
import { ConfigModule } from './config/config.module.js';
import { DatabaseController } from './api/database/database.controller.js';
import { EnginesController } from './api/engines/engines.controller.js';
import { HealthController } from './api/health/health.controller.js';
import { PlatformController } from './api/platform/platform.controller.js';
import { VersionController } from './api/version/version.controller.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { ApiV1Module } from './api/v1/api-v1.module.js';
import { AuthModule } from './auth/auth.module.js';
import { DatabaseModule } from './database/database.module.js';
import { GatewayModule } from './gateway/gateway.module.js';
import { ObservabilityModule } from './observability/observability.module.js';
import { RuntimeRegistryModule } from './runtime-registry/runtime-registry.module.js';
import { SecurityModule } from './security/security.module.js';

export interface AppModuleOptions {
  config: AppConfig;
}

@Module({})
export class AppModule {
  static register(options: AppModuleOptions) {
    return {
      module: AppModule,
      imports: [
        ConfigModule.register(options.config),
        LoggerModule.forRoot({
          pinoHttp: {
            level: options.config.LOG_LEVEL,
            transport:
              options.config.NODE_ENV === 'development'
                ? { target: 'pino-pretty', options: { colorize: true } }
                : undefined,
          },
        }),
        RuntimeRegistryModule,
        SecurityModule,
        GatewayModule,
        ObservabilityModule,
        AnalyticsModule,
        DatabaseModule,
        AuthModule,
        ApiV1Module,
      ],
      controllers: [
        HealthController,
        PlatformController,
        EnginesController,
        VersionController,
        DatabaseController,
      ],
      providers: [],
    };
  }
}
