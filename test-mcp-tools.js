// Simple Node.js script to test MCP tools locally
const { FuelService } = require('./lib/services/fuel-service.ts');
const { searchStationsTool, getStationDetailsTool, findCheapestFuelTool } = require('./lib/mcp-tools/fuel-price-tools.ts');

// Mock DATABASE_URL for testing
if (!process.env.DATABASE_URL) {
  console.log('⚠️  DATABASE_URL not set. This test requires a database connection.');
  console.log('Please set DATABASE_URL environment variable and try again.');
  process.exit(1);
}

async function testMCPTools() {
  console.log('🔍 Testing MCP Tools...');

  try {
    // Test 1: Search stations tool
    console.log('\\n1. Testing search_stations tool...');
    const searchResult = await searchStationsTool.handler({
      provincia: 'Buenos Aires',
      limit: 5
    }, 'test-user-id');
    console.log('✅ Search stations result:', searchResult.content[0].text.substring(0, 200) + '...');

    // Test 2: Find cheapest fuel
    console.log('\\n2. Testing find_cheapest_fuel tool...');
    const cheapestResult = await findCheapestFuelTool.handler({
      fuelType: 'nafta',
      limit: 3
    }, 'test-user-id');
    console.log('✅ Cheapest fuel result:', cheapestResult.content[0].text.substring(0, 200) + '...');

    console.log('\\n✅ All MCP tools tests completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

// Run tests
testMCPTools();