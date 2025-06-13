// Test T&T 2025 Integration
// This script tests the new Turner & Townsend 2025 Global Office Fit-Out Cost Guide integration

const { calculateTT2025Budget, getTT2025CountriesByRegion, getTT2025CitiesByCountry, getTT2025CostData } = require('./client/src/utils/tt2025Data.ts');

// Test data structure and calculations
console.log('Testing T&T 2025 Integration...\n');

// Test 1: Data availability
console.log('1. Testing data availability:');
const emeaCountries = getTT2025CountriesByRegion('EMEA');
const americasCountries = getTT2025CountriesByRegion('AMERICAS');
const apacCountries = getTT2025CountriesByRegion('APAC');

console.log(`EMEA countries: ${emeaCountries.length} - ${emeaCountries.slice(0, 3).join(', ')}...`);
console.log(`AMERICAS countries: ${americasCountries.length} - ${americasCountries.slice(0, 3).join(', ')}...`);
console.log(`APAC countries: ${apacCountries.length} - ${apacCountries.slice(0, 3).join(', ')}...`);

// Test 2: City lookup
console.log('\n2. Testing city lookup:');
const ukCities = getTT2025CitiesByCountry('United Kingdom');
const usCities = getTT2025CitiesByCountry('United States');
console.log(`UK cities: ${ukCities.join(', ')}`);
console.log(`US cities: ${usCities.join(', ')}`);

// Test 3: Cost data retrieval
console.log('\n3. Testing cost data retrieval:');
const londonData = getTT2025CostData('United Kingdom', 'London');
const newYorkData = getTT2025CostData('United States', 'New York');
console.log(`London data available: ${londonData ? 'YES' : 'NO'}`);
console.log(`New York data available: ${newYorkData ? 'YES' : 'NO'}`);

if (londonData) {
  console.log(`London Medium spec total: $${londonData.costs.total.medium}/sqm`);
  console.log(`London Construction: $${londonData.costs.construction.medium}/sqm`);
  console.log(`London Furniture: $${londonData.costs.looseFurniture.medium}/sqm`);
}

// Test 4: Budget calculations
console.log('\n4. Testing budget calculations:');

// Test London office fit-out
const londonTest = calculateTT2025Budget(
  'United Kingdom',
  'London',
  'Medium',
  1000, // 1000 sqm
  'sqm',
  'Complete'
);

console.log(`London 1000sqm Medium spec calculation:`, {
  success: londonTest.success,
  totalCost: londonTest.totalCost,
  construction: londonTest.breakdown.construction,
  furniture: londonTest.breakdown.looseFurniture,
  audioVisual: londonTest.breakdown.audioVisual,
  professionalFees: londonTest.breakdown.professionalFees
});

// Test New York office fit-out
const newYorkTest = calculateTT2025Budget(
  'United States',
  'New York',
  'High',
  10000, // 10000 sqft
  'sqft',
  'Construction'
);

console.log(`New York 10000sqft High spec construction:`, {
  success: newYorkTest.success,
  totalCost: newYorkTest.totalCost,
  construction: newYorkTest.breakdown.construction
});

// Test 5: Error handling
console.log('\n5. Testing error handling:');
const invalidTest = calculateTT2025Budget(
  'Invalid Country',
  'Invalid City',
  'Medium',
  1000,
  'sqm',
  'Complete'
);

console.log(`Invalid location test:`, {
  success: invalidTest.success,
  error: invalidTest.error
});

console.log('\nT&T 2025 Integration Test Complete!');