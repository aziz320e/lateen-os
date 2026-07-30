import { Global, Module } from '@nestjs/common';
import { RuntimeRegistryService } from './runtime-registry.service.js';

@Global()
@Module({
  providers: [RuntimeRegistryService],
  exports: [RuntimeRegistryService],
})
export class RuntimeRegistryModule {}
