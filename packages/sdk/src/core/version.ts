/** @module core/version */
export interface SDKVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly architecture: string;
}

export const SDK_VERSION: SDKVersion = {
  major: 1,
  minor: 0,
  patch: 0,
  architecture: '1.0',
};

export function formatSdkVersion(version: SDKVersion = SDK_VERSION): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}
