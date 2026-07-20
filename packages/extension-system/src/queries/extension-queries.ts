/** @module queries/extension-queries */
import type { ExtensionRegistry } from '../registry/extension-registry.js';
import type { ExtensionDiscovery } from '../discovery/scanner.js';
import type { ExtensionValidator } from '../validator/extension-validator.js';
import type {
  CheckCompatibilityQuery,
  CheckCompatibilityResult,
  FindExtensionQuery,
  FindExtensionResult,
  ListExtensionsQuery,
  ListExtensionsResult,
  ValidateExtensionQuery,
  ValidateExtensionResult,
} from './types.js';

export class ExtensionQueries {
  constructor(
    private readonly registry: ExtensionRegistry,
    private readonly discovery: ExtensionDiscovery,
    private readonly validator: ExtensionValidator,
    private readonly workspaceRoot: string,
  ) {}

  listExtensions(query: ListExtensionsQuery = {}): ListExtensionsResult {
    let extensions = this.registry.list();
    if (query.status) {
      extensions = extensions.filter((ext) => ext.status === query.status);
    }
    return { extensions, total: extensions.length };
  }

  async findExtension(query: FindExtensionQuery): Promise<FindExtensionResult> {
    const extension = this.registry.get(query.id);
    const discovered = await this.discovery.findById(this.workspaceRoot, query.id);
    return { extension, discovered };
  }

  validateExtension(query: ValidateExtensionQuery): ValidateExtensionResult {
    return this.validator.validateManifest(query.manifest);
  }

  checkCompatibility(query: CheckCompatibilityQuery): CheckCompatibilityResult {
    const installed = new Map(
      this.registry.list().map((ext) => [ext.manifest.id, ext.manifest]),
    );
    return this.validator.checkCompatibility(query.manifest, installed);
  }
}

export function createExtensionQueries(
  registry: ExtensionRegistry,
  discovery: ExtensionDiscovery,
  validator: ExtensionValidator,
  workspaceRoot: string,
): ExtensionQueries {
  return new ExtensionQueries(registry, discovery, validator, workspaceRoot);
}
