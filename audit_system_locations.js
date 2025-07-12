/**
 * Audit System Locations vs Authentic T&T Data
 */

console.log('=== COMPREHENSIVE T&T LOCATION AUDIT ===');

async function auditLocations() {
  // Get current system locations
  const response = await fetch('http://localhost:5000/api/locations');
  const systemLocations = await response.json();

  // Extract authentic T&T locations from the data file
  const fs = require('fs');
  const ttDataContent = fs.readFileSync('./client/src/utils/tt2025Data.ts', 'utf8');

  const authenticTTLocations = {};
  const dataMatches = ttDataContent.match(/country: '([^']+)'[^}]*city: '([^']+)'/g);

  if (dataMatches) {
    dataMatches.forEach(match => {
      const countryMatch = match.match(/country: '([^']+)'/);
      const cityMatch = match.match(/city: '([^']+)'/);
      
      if (countryMatch && cityMatch) {
        const country = countryMatch[1];
        const city = cityMatch[1];
        
        if (!authenticTTLocations[country]) {
          authenticTTLocations[country] = [];
        }
        if (!authenticTTLocations[country].includes(city)) {
          authenticTTLocations[country].push(city);
        }
      }
    });
  }

  console.log('\n=== AUTHENTIC T&T LOCATIONS ===');
  Object.keys(authenticTTLocations).sort().forEach(country => {
    console.log(`${country}: ${authenticTTLocations[country].join(', ')}`);
  });

  console.log('\n=== SYSTEM LOCATIONS ===');
  Object.keys(systemLocations).sort().forEach(country => {
    console.log(`${country}: ${systemLocations[country].join(', ')}`);
  });

  console.log('\n=== LOCATION DISCREPANCIES ===');
  const systemCountries = Object.keys(systemLocations);
  const authenticCountries = Object.keys(authenticTTLocations);

  // Find extra countries in system
  const extraCountries = systemCountries.filter(country => !authenticCountries.includes(country));
  console.log('❌ Extra countries in system:', extraCountries);

  // Find missing countries from system
  const missingCountries = authenticCountries.filter(country => !systemCountries.includes(country));
  console.log('⚠️ Missing countries from system:', missingCountries);

  // Check cities for each authentic country
  console.log('\n=== CITY LEVEL DISCREPANCIES ===');
  authenticCountries.forEach(country => {
    const authenticCities = authenticTTLocations[country];
    const systemCities = systemLocations[country] || [];
    
    const extraCities = systemCities.filter(city => !authenticCities.includes(city));
    const missingCities = authenticCities.filter(city => !systemCities.includes(city));
    
    if (extraCities.length > 0 || missingCities.length > 0) {
      console.log(`\n${country}:`);
      console.log(`  Authentic: ${authenticCities.join(', ')}`);
      console.log(`  System: ${systemCities.join(', ')}`);
      
      if (extraCities.length > 0) {
        console.log(`  ❌ Extra cities: ${extraCities.join(', ')}`);
      }
      if (missingCities.length > 0) {
        console.log(`  ⚠️ Missing cities: ${missingCities.join(', ')}`);
      }
    }
  });

  console.log('\n=== SUMMARY ===');
  console.log(`Authentic T&T countries: ${authenticCountries.length}`);
  console.log(`System countries: ${systemCountries.length}`);
  console.log(`Extra countries: ${extraCountries.length}`);
  console.log(`Missing countries: ${missingCountries.length}`);

  return { authenticTTLocations, systemLocations, extraCountries, missingCountries };
}

// Run the audit
const auditResults = await auditLocations();

export { auditResults };