import { DynamicModule, Global, Module } from '@nestjs/common';
import type { AppConfig } from './index.js';
import { APP_CONFIG } from '../api/tokens.js';

@Global()
@Module({})
export class ConfigModule {
  static register(config: AppConfig): DynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: APP_CONFIG, useValue: config }],
      exports: [APP_CONFIG],
    };
  }
}
