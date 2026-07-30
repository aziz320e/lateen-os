import { ServiceUnavailableException } from '@nestjs/common';
import type { RuntimeRegistryService } from '../../../runtime-registry/runtime-registry.service.js';

/** Fetches a hosted engine runtime by catalog name — the only way any Task 4 controller reaches a business engine (never a repository, never a fresh `createXRuntime()` call). */
export function requireRuntime<T>(registry: RuntimeRegistryService, name: string): T {
  const runtime = registry.get<T>(name);
  if (!runtime)
    throw new ServiceUnavailableException(
      `The "${name}" engine runtime is not currently available.`,
    );
  return runtime;
}
