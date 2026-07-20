/**
 * Geographic location value object.
 *
 * @module common/geo-location
 */

/** WGS 84 geographic coordinates. */
export interface GeoLocation {
  readonly latitude: number;
  readonly longitude: number;
  readonly altitude?: number;
}
