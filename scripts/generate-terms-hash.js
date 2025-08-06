#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { JSDOM } = require('jsdom');

/**
 * Generate hash from HTML file and save to lib/generated/terms-hash.json
 * This ensures the hash is always in sync with the actual terms content
 */
function generateTermsHash() {
  try {
    // Read the HTML file
    const htmlPath = path.join(process.cwd(), 'public', 'terminos-y-condiciones.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Parse HTML and extract text content only (no HTML tags or styling)
    const dom = new JSDOM(htmlContent);
    const textContent = dom.window.document.body.textContent || dom.window.document.body.innerText || '';
    
    // Clean and normalize text content
    const cleanContent = textContent
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim();
    
    // Generate SHA-256 hash
    const hash = crypto.createHash('sha256').update(cleanContent).digest('hex');
    
    // Get current date for metadata
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Create metadata object
    const metadata = {
      hash,
      lastUpdated: currentDate,
      version: '1.0',
      generatedAt: new Date().toISOString(),
      sourceFile: 'public/terminos-y-condiciones.html'
    };
    
    // Ensure lib/generated directory exists
    const outputDir = path.join(process.cwd(), 'lib', 'generated');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write hash metadata to file
    const outputPath = path.join(outputDir, 'terms-hash.json');
    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    
    console.log(`✅ Terms hash generated successfully:`);
    console.log(`   Hash: ${hash}`);
    console.log(`   File: ${outputPath}`);
    
    return metadata;
  } catch (error) {
    console.error('❌ Error generating terms hash:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateTermsHash();
}

module.exports = { generateTermsHash };