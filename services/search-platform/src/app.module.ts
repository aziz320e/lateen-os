import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { AppConfig } from './config/index';
import { SearchController, HealthController } from './api/search/search.controller';
import { APP_CONFIG, SEARCH_SERVICE } from './api/tokens';
import type { SearchService } from './application/search.service';

export interface AppModuleOptions {
  config: AppConfig;
  searchService: SearchService;
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
      controllers: [HealthController, SearchController],
      providers: [
        { provide: APP_CONFIG, useValue: options.config },
        { provide: SEARCH_SERVICE, useValue: options.searchService },
      ],
    };
  }
}
