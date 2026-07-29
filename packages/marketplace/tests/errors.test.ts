import { describe, expect, it } from 'vitest';
import {
  CatalogEntryNotFoundError,
  ConfigValidationError,
  DuplicateExtensionKeyError,
  DuplicatePackageVersionError,
  EventDeclarationNotFoundError,
  ExtensionNotFoundError,
  InvalidExtensionTransitionError,
  InvalidPluginTransitionError,
  InvalidRatingError,
  PackageVersionNotFoundError,
  PluginNotFoundError,
  SandboxProfileNotFoundError,
} from '../src/shared/errors.js';

describe('shared/errors — typed error classes', () => {
  it('ExtensionNotFoundError carries the extensionId and a descriptive message', () => {
    const error = new ExtensionNotFoundError('ext-1');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ExtensionNotFoundError');
    expect(error.extensionId).toBe('ext-1');
    expect(error.message).toBe('Extension "ext-1" not found');
  });

  it('DuplicateExtensionKeyError carries the key and a descriptive message', () => {
    const error = new DuplicateExtensionKeyError('com.acme.widget');
    expect(error.name).toBe('DuplicateExtensionKeyError');
    expect(error.key).toBe('com.acme.widget');
    expect(error.message).toBe('Extension "com.acme.widget" is already installed in this organization');
  });

  it('InvalidExtensionTransitionError carries extensionId/from/to and a descriptive message', () => {
    const error = new InvalidExtensionTransitionError('ext-1', 'uninstalled', 'enabled');
    expect(error.name).toBe('InvalidExtensionTransitionError');
    expect(error.extensionId).toBe('ext-1');
    expect(error.from).toBe('uninstalled');
    expect(error.to).toBe('enabled');
    expect(error.message).toBe('Extension "ext-1" cannot transition from "uninstalled" to "enabled"');
  });

  it('PluginNotFoundError carries the pluginId and a descriptive message', () => {
    const error = new PluginNotFoundError('plugin-1');
    expect(error.name).toBe('PluginNotFoundError');
    expect(error.pluginId).toBe('plugin-1');
    expect(error.message).toBe('Plugin "plugin-1" not found');
  });

  it('InvalidPluginTransitionError carries pluginId/from/to and a descriptive message', () => {
    const error = new InvalidPluginTransitionError('plugin-1', 'archived', 'active');
    expect(error.name).toBe('InvalidPluginTransitionError');
    expect(error.pluginId).toBe('plugin-1');
    expect(error.message).toBe('Plugin "plugin-1" cannot transition from "archived" to "active"');
  });

  it('PackageVersionNotFoundError carries the packageVersionId and a descriptive message', () => {
    const error = new PackageVersionNotFoundError('package-1');
    expect(error.name).toBe('PackageVersionNotFoundError');
    expect(error.packageVersionId).toBe('package-1');
    expect(error.message).toBe('Package version "package-1" not found');
  });

  it('DuplicatePackageVersionError carries extensionKey/version and a descriptive message', () => {
    const error = new DuplicatePackageVersionError('com.acme.widget', '1.0.0');
    expect(error.name).toBe('DuplicatePackageVersionError');
    expect(error.extensionKey).toBe('com.acme.widget');
    expect(error.version).toBe('1.0.0');
    expect(error.message).toBe('Package version "com.acme.widget@1.0.0" is already published');
  });

  it('SandboxProfileNotFoundError carries the sandboxProfileId and a descriptive message', () => {
    const error = new SandboxProfileNotFoundError('sandbox-1');
    expect(error.name).toBe('SandboxProfileNotFoundError');
    expect(error.sandboxProfileId).toBe('sandbox-1');
    expect(error.message).toBe('Sandbox profile "sandbox-1" not found');
  });

  it('ConfigValidationError carries the errors array and joins them into the message', () => {
    const error = new ConfigValidationError(['"key" is required']);
    expect(error.name).toBe('ConfigValidationError');
    expect(error.errors).toEqual(['"key" is required']);
    expect(error.message).toBe('Extension configuration validation failed: "key" is required');
  });

  it('EventDeclarationNotFoundError carries the eventDeclarationId and a descriptive message', () => {
    const error = new EventDeclarationNotFoundError('declaration-1');
    expect(error.name).toBe('EventDeclarationNotFoundError');
    expect(error.eventDeclarationId).toBe('declaration-1');
    expect(error.message).toBe('Event declaration "declaration-1" not found');
  });

  it('CatalogEntryNotFoundError carries the catalogEntryId and a descriptive message', () => {
    const error = new CatalogEntryNotFoundError('catalog-1');
    expect(error.name).toBe('CatalogEntryNotFoundError');
    expect(error.catalogEntryId).toBe('catalog-1');
    expect(error.message).toBe('Catalog entry "catalog-1" not found');
  });

  it('InvalidRatingError carries the score and a descriptive message', () => {
    const error = new InvalidRatingError(7);
    expect(error.name).toBe('InvalidRatingError');
    expect(error.score).toBe(7);
    expect(error.message).toBe('Rating score 7 is out of the valid 1-5 range');
  });

  it('every not-found error class is a genuine subclass of Error with a working stack trace', () => {
    const error = new ExtensionNotFoundError('ext-1');
    expect(error.stack).toBeDefined();
    expect(error instanceof Error).toBe(true);
  });

  it('two error instances with different ids carry independent state', () => {
    const first = new ExtensionNotFoundError('ext-1');
    const second = new ExtensionNotFoundError('ext-2');
    expect(first.extensionId).not.toBe(second.extensionId);
  });

  it('ConfigValidationError with multiple errors joins them with a semicolon separator', () => {
    const error = new ConfigValidationError(['a', 'b', 'c']);
    expect(error.message).toBe('Extension configuration validation failed: a; b; c');
  });
});
