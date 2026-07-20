import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { AppConfig } from './config/index';
import { HealthController } from './api/health/health.controller';
import { ExtensionsController } from './api/extensions/extensions.controller';
import { PublishersController } from './api/publishers/publishers.controller';
import { ReleasesController } from './api/releases/releases.controller';
import { SearchController } from './api/search/search.controller';
import { InstallController } from './api/install/install.controller';
import { ReviewsController } from './api/reviews/reviews.controller';
import {
  APP_CONFIG,
  EXTENSION_SERVICE,
  INSTALL_SERVICE,
  PUBLISH_SERVICE,
  PUBLISHER_SERVICE,
  RELEASE_SERVICE,
  REVIEW_SERVICE,
  SEARCH_SERVICE,
} from './api/tokens';
import type {
  ExtensionService,
  InstallService,
  PublishService,
  PublisherService,
  ReleaseService,
  ReviewService,
  SearchService,
} from './application/marketplace.services';

export interface AppModuleOptions {
  config: AppConfig;
  publisherService: PublisherService;
  extensionService: ExtensionService;
  searchService: SearchService;
  releaseService: ReleaseService;
  publishService: PublishService;
  installService: InstallService;
  reviewService: ReviewService;
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
      controllers: [
        HealthController,
        ExtensionsController,
        PublishersController,
        ReleasesController,
        SearchController,
        InstallController,
        ReviewsController,
      ],
      providers: [
        { provide: APP_CONFIG, useValue: options.config },
        { provide: PUBLISHER_SERVICE, useValue: options.publisherService },
        { provide: EXTENSION_SERVICE, useValue: options.extensionService },
        { provide: SEARCH_SERVICE, useValue: options.searchService },
        { provide: RELEASE_SERVICE, useValue: options.releaseService },
        { provide: PUBLISH_SERVICE, useValue: options.publishService },
        { provide: INSTALL_SERVICE, useValue: options.installService },
        { provide: REVIEW_SERVICE, useValue: options.reviewService },
      ],
    };
  }
}
