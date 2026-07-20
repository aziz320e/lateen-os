import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { AppConfig } from './config/index';
import { HealthController } from './api/health/health.controller';
import { KnowledgeController, KnowledgeSearchController } from './api/knowledge/knowledge.controller';
import { APP_CONFIG, KNOWLEDGE_QUERIES, KNOWLEDGE_SERVICE } from './api/tokens';
import type { KnowledgeService } from './application/knowledge.service';
import type { KnowledgeQueries } from './queries/knowledge-queries';

export interface AppModuleOptions {
  config: AppConfig;
  knowledgeService: KnowledgeService;
  knowledgeQueries: KnowledgeQueries;
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
      controllers: [HealthController, KnowledgeController, KnowledgeSearchController],
      providers: [
        { provide: APP_CONFIG, useValue: options.config },
        { provide: KNOWLEDGE_SERVICE, useValue: options.knowledgeService },
        { provide: KNOWLEDGE_QUERIES, useValue: options.knowledgeQueries },
      ],
    };
  }
}
