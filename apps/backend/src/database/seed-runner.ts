import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { loadConfig } from '../config/index.js';

/**
 * Standalone Seed Runner CLI (`pnpm db:seed`). Boots the real application
 * module graph as an application context (no HTTP listener) so the exact
 * same `SeedRunnerService.onModuleInit()` the platform host runs on every
 * startup executes here too — there is no separate/duplicated seeding
 * logic to keep in sync.
 */
async function run(): Promise<void> {
  const config = loadConfig();
  const app = await NestFactory.createApplicationContext(AppModule.register({ config }), {
    bufferLogs: true,
  });
  await app.close();
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed Runner failed', error);
    process.exit(1);
  });
