/**
 * Postal address value object.
 *
 * @module common/address
 */

/** Physical or mailing address. */
export interface Address {
  readonly line1: string;
  readonly line2?: string;
  readonly city: string;
  readonly region?: string;
  readonly postalCode?: string;
  readonly country: string;
}
