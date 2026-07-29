/** Typed errors used consistently across the Marketplace runtime implementations. @module shared/errors */

export class ExtensionNotFoundError extends Error {
  constructor(readonly extensionId: string) {
    super(`Extension "${extensionId}" not found`);
    this.name = 'ExtensionNotFoundError';
  }
}

export class DuplicateExtensionKeyError extends Error {
  constructor(readonly key: string) {
    super(`Extension "${key}" is already installed in this organization`);
    this.name = 'DuplicateExtensionKeyError';
  }
}

export class InvalidExtensionTransitionError extends Error {
  constructor(
    readonly extensionId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Extension "${extensionId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidExtensionTransitionError';
  }
}

export class PluginNotFoundError extends Error {
  constructor(readonly pluginId: string) {
    super(`Plugin "${pluginId}" not found`);
    this.name = 'PluginNotFoundError';
  }
}

export class InvalidPluginTransitionError extends Error {
  constructor(
    readonly pluginId: string,
    readonly from: string,
    readonly to: string,
  ) {
    super(`Plugin "${pluginId}" cannot transition from "${from}" to "${to}"`);
    this.name = 'InvalidPluginTransitionError';
  }
}

export class PackageVersionNotFoundError extends Error {
  constructor(readonly packageVersionId: string) {
    super(`Package version "${packageVersionId}" not found`);
    this.name = 'PackageVersionNotFoundError';
  }
}

export class DuplicatePackageVersionError extends Error {
  constructor(
    readonly extensionKey: string,
    readonly version: string,
  ) {
    super(`Package version "${extensionKey}@${version}" is already published`);
    this.name = 'DuplicatePackageVersionError';
  }
}

export class SandboxProfileNotFoundError extends Error {
  constructor(readonly sandboxProfileId: string) {
    super(`Sandbox profile "${sandboxProfileId}" not found`);
    this.name = 'SandboxProfileNotFoundError';
  }
}

export class ConfigValidationError extends Error {
  constructor(readonly errors: readonly string[]) {
    super(`Extension configuration validation failed: ${errors.join('; ')}`);
    this.name = 'ConfigValidationError';
  }
}

export class EventDeclarationNotFoundError extends Error {
  constructor(readonly eventDeclarationId: string) {
    super(`Event declaration "${eventDeclarationId}" not found`);
    this.name = 'EventDeclarationNotFoundError';
  }
}

export class CatalogEntryNotFoundError extends Error {
  constructor(readonly catalogEntryId: string) {
    super(`Catalog entry "${catalogEntryId}" not found`);
    this.name = 'CatalogEntryNotFoundError';
  }
}

export class InvalidRatingError extends Error {
  constructor(readonly score: number) {
    super(`Rating score ${score} is out of the valid 1-5 range`);
    this.name = 'InvalidRatingError';
  }
}
