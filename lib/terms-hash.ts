// Server-side terms hash utilities
// This file uses Node.js APIs and should only be imported in server-side code

import { readFileSync } from 'fs';
import { createHash } from 'crypto';
import path from 'path';
import { safeLog } from './utils/errors';

// Interfaces
interface TermsMetadata {
  hash: string;
  lastUpdated: string;
  version: string;
  generatedAt: string;
  sourceFile: string;
}

// Cache for the terms metadata to avoid repeated file reads
let cachedTermsMetadata: TermsMetadata | null = null;

/**
 * Load terms metadata from generated file
 * Falls back to generating hash from HTML file if generated file doesn't exist
 */
function loadTermsMetadata(): TermsMetadata {
  if (cachedTermsMetadata) {
    return cachedTermsMetadata;
  }

  try {
    // Try to load from generated file first (production/build scenario)
    const generatedPath = path.join(process.cwd(), 'lib', 'generated', 'terms-hash.json');
    const content = readFileSync(generatedPath, 'utf8');
    cachedTermsMetadata = JSON.parse(content);
    return cachedTermsMetadata!;
  } catch (error) {
    // Fallback: generate hash from HTML file (development scenario)
    safeLog('⚠️ Generated terms hash not found, generating from HTML file...');
    return generateHashFromHtmlFile();
  }
}

/**
 * Fallback function to generate hash from HTML file when generated file is not available
 * This is used during development when the build script hasn't run yet
 */
function generateHashFromHtmlFile(): TermsMetadata {
  try {
    const htmlPath = path.join(process.cwd(), 'public', 'terminos-y-condiciones.html');
    const htmlContent = readFileSync(htmlPath, 'utf8');
    
    // Extract text content (basic HTML stripping)
    const textContent = htmlContent
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
    
    const hash = createHash('sha256').update(textContent).digest('hex');
    
    const metadata: TermsMetadata = {
      hash,
      lastUpdated: new Date().toISOString().split('T')[0],
      version: '1.0',
      generatedAt: new Date().toISOString(),
      sourceFile: 'public/terminos-y-condiciones.html'
    };
    
    cachedTermsMetadata = metadata;
    return metadata;
  } catch (error) {
    throw new Error(`Failed to generate terms hash: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate SHA-256 hash of the current terms and conditions
 */
export function getCurrentTermsHash(): string {
  console.log("getCurrentTermsHash");
  const metadata = loadTermsMetadata();
  console.log(metadata);
  return metadata.hash;
}

/**
 * Get the current terms version info
 */
export function getCurrentTermsVersion() {
  return loadTermsMetadata();
}

/**
 * Verify if a given hash matches the current terms
 */
export function verifyTermsHash(hash: string): boolean {
  return hash === getCurrentTermsHash();
}