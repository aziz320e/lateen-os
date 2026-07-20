/** @module validator/extension-validator */
import semver from 'semver';
import { extensionManifestSchema, PLATFORM_ENGINE_VERSION, PLATFORM_SDK_VERSION, type ExtensionManifest } from '../manifest/types.js';
import { checkPermissions, parsePermissions } from '../permissions/checker.js';
import { createDependencyResolver } from '../dependencies/resolver.js';
import type { ExtensionPermission } from '../permissions/types.js';

export interface ValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

export interface ExtensionValidationResult {
  readonly valid: boolean;
  readonly manifest?: ExtensionManifest;
  readonly issues: readonly ValidationIssue[];
}

export class ExtensionValidator {
  private readonly dependencyResolver = createDependencyResolver();

  validateManifest(input: unknown): ExtensionValidationResult {
    const issues: ValidationIssue[] = [];
    const parsed = extensionManifestSchema.safeParse(input);

    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push({ code: 'MANIFEST_INVALID', message: issue.message, severity: 'error' });
      }
      return { valid: false, issues };
    }

    const manifest = parsed.data;

    if (!semver.valid(manifest.version)) {
      issues.push({ code: 'VERSION_INVALID', message: 'Invalid semver version', severity: 'error' });
    }

    if (!semver.satisfies(PLATFORM_ENGINE_VERSION, `^${manifest.engineVersion}`)) {
      issues.push({
        code: 'ENGINE_INCOMPATIBLE',
        message: `Engine ${manifest.engineVersion} incompatible with platform ${PLATFORM_ENGINE_VERSION}`,
        severity: 'error',
      });
    }

    const sdkMajorMinor = manifest.sdkVersion.split('.').slice(0, 2).join('.');
    if (!semver.satisfies(PLATFORM_SDK_VERSION, `^${sdkMajorMinor}.0`)) {
      issues.push({
        code: 'SDK_INCOMPATIBLE',
        message: `SDK ${manifest.sdkVersion} may be incompatible with platform SDK ${PLATFORM_SDK_VERSION}`,
        severity: 'warning',
      });
    }

    const unknownPerms = manifest.permissions.filter(
      (p) => parsePermissions([p]).length === 0,
    );
    for (const perm of unknownPerms) {
      issues.push({ code: 'UNKNOWN_PERMISSION', message: `Unknown permission: ${perm}`, severity: 'warning' });
    }

    return {
      valid: !issues.some((i) => i.severity === 'error'),
      manifest,
      issues,
    };
  }

  validatePermissions(manifest: ExtensionManifest, granted: readonly ExtensionPermission[]): ExtensionValidationResult {
    const result = checkPermissions(manifest.permissions, granted);
    const issues: ValidationIssue[] = result.denied.map((perm) => ({
      code: 'PERMISSION_DENIED',
      message: `Permission denied: ${perm}`,
      severity: 'error' as const,
    }));

    return { valid: result.allowed, manifest, issues };
  }

  checkCompatibility(
    manifest: ExtensionManifest,
    installed: ReadonlyMap<string, ExtensionManifest>,
  ): ExtensionValidationResult {
    const resolution = this.dependencyResolver.resolve(manifest, installed);
    const issues: ValidationIssue[] = resolution.issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      severity: 'error' as const,
    }));

    return { valid: resolution.valid, manifest, issues };
  }
}

export function createExtensionValidator(): ExtensionValidator {
  return new ExtensionValidator();
}
