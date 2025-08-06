// Client-side terms hash utilities (browser-safe)
// This file imports the generated hash without Node.js dependencies

import termsMetadata from './generated/terms-hash.json';

/**
 * Get the current terms hash (client-side safe)
 * This imports the pre-generated hash from build time
 */
export function getCurrentTermsHash(): string {
  return termsMetadata.hash;
}

/**
 * Get the current terms version info (client-side safe)
 */
export function getCurrentTermsVersion() {
  return termsMetadata;
}

/**
 * Verify if a given hash matches the current terms (client-side safe)
 */
export function verifyTermsHash(hash: string): boolean {
  return hash === getCurrentTermsHash();
}