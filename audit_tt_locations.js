/**
 * Comprehensive T&T Location Audit
 * Verify all locations in dropdown match authentic T&T 2025 Guide data
 */

console.log("=== T&T LOCATION AUDIT ===");

// Import the current T&T data to verify authentic locations
import { TT2025_COST_DATA, getTT2025Countries, getTT2025CitiesByCountry } from './client/src/utils/tt2025Data.js';

function auditTTLocations() {
  console.log("\n=== CURRENT T&T DATASET ANALYSIS ===");
  
  // Get all authentic T&T locations
  const authenticCountries = getTT2025Countries();
  console.log("Authentic T&T Countries:", authenticCountries);
  
  console.log("\n=== AUTHENTIC T&T LOCATIONS BY REGION ===");
  
  const locationsByRegion = {};
  
  TT2025_COST_DATA.forEach(location => {
    const region = getRegionFromCountry(location.country);
    if (!locationsByRegion[region]) {
      locationsByRegion[region] = {};
    }
    if (!locationsByRegion[region][location.country]) {
      locationsByRegion[region][location.country] = [];
    }
    locationsByRegion[region][location.country].push(location.city);
  });
  
  console.log("T&T Locations by Region:");
  Object.keys(locationsByRegion).forEach(region => {
    console.log(`\n${region}:`);
    Object.keys(locationsByRegion[region]).forEach(country => {
      console.log(`  ${country}: ${locationsByRegion[region][country].join(', ')}`);
    });
  });
  
  return locationsByRegion;
}

function getRegionFromCountry(country) {
  const regions = {
    'AMERICAS': ['United States', 'Canada', 'Brazil', 'Mexico', 'Colombia', 'Argentina', 'Uruguay', 'Chile'],
    'EMEA': ['United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Norway', 'Sweden', 'Denmark', 'Finland', 'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Greece', 'Turkey', 'Russia', 'Ukraine', 'South Africa', 'Egypt', 'UAE', 'Saudi Arabia', 'Israel', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Jordan', 'Lebanon', 'Morocco', 'Tunisia', 'Algeria', 'Nigeria', 'Kenya', 'Ghana', 'Ethiopia', 'Tanzania', 'Uganda', 'Zimbabwe', 'Botswana', 'Zambia', 'Mozambique', 'Angola', 'Cameroon', 'Ivory Coast', 'Senegal', 'Mali', 'Burkina Faso', 'Niger', 'Chad', 'Central African Republic', 'Gabon', 'Republic of the Congo', 'Democratic Republic of the Congo', 'Rwanda', 'Burundi', 'Djibouti', 'Eritrea', 'Somalia', 'Sudan', 'South Sudan', 'Libya', 'Madagascar', 'Mauritius', 'Seychelles', 'Comoros', 'Cape Verde', 'Sao Tome and Principe', 'Equatorial Guinea', 'Guinea', 'Guinea-Bissau', 'Sierra Leone', 'Liberia', 'Togo', 'Benin', 'Mauritania', 'Gambia'],
    'APAC': ['Singapore', 'Australia', 'Japan', 'China', 'South Korea', 'India', 'Malaysia', 'Thailand', 'Indonesia', 'Philippines', 'Vietnam', 'Myanmar', 'Cambodia', 'Laos', 'Bangladesh', 'Sri Lanka', 'Nepal', 'Bhutan', 'Maldives', 'Pakistan', 'Afghanistan', 'Mongolia', 'North Korea', 'Taiwan', 'Hong Kong', 'Macau', 'Brunei', 'East Timor', 'Papua New Guinea', 'New Zealand', 'Fiji', 'Solomon Islands', 'Vanuatu', 'Samoa', 'Tonga', 'Kiribati', 'Tuvalu', 'Nauru', 'Palau', 'Marshall Islands', 'Micronesia']
  };
  
  for (const [region, countries] of Object.entries(regions)) {
    if (countries.includes(country)) {
      return region;
    }
  }
  
  return 'OTHER';
}

async function auditCurrentSystemLocations() {
  console.log("\n=== CURRENT SYSTEM LOCATIONS AUDIT ===");
  
  try {
    const response = await fetch('http://localhost:5000/api/locations');
    const systemLocations = await response.json();
    
    console.log("Current system locations:");
    Object.keys(systemLocations).forEach(country => {
      console.log(`${country}: ${systemLocations[country].join(', ')}`);
    });
    
    // Compare with authentic T&T data
    const authenticCountries = getTT2025Countries();
    const systemCountries = Object.keys(systemLocations);
    
    console.log("\n=== LOCATION COMPARISON ===");
    console.log("Authentic T&T Countries:", authenticCountries.length);
    console.log("System Countries:", systemCountries.length);
    
    // Find countries in system but not in T&T
    const extraCountries = systemCountries.filter(country => !authenticCountries.includes(country));
    console.log("Extra countries in system:", extraCountries);
    
    // Find countries in T&T but not in system
    const missingCountries = authenticCountries.filter(country => !systemCountries.includes(country));
    console.log("Missing countries from system:", missingCountries);
    
    // Check cities for each country
    console.log("\n=== CITY LEVEL AUDIT ===");
    authenticCountries.forEach(country => {
      const authenticCities = getTT2025CitiesByCountry(country);
      const systemCities = systemLocations[country] || [];
      
      console.log(`\n${country}:`);
      console.log(`  Authentic T&T cities: ${authenticCities.join(', ')}`);
      console.log(`  System cities: ${systemCities.join(', ')}`);
      
      const extraCities = systemCities.filter(city => !authenticCities.includes(city));
      const missingCities = authenticCities.filter(city => !systemCities.includes(city));
      
      if (extraCities.length > 0) {
        console.log(`  ❌ Extra cities in system: ${extraCities.join(', ')}`);
      }
      if (missingCities.length > 0) {
        console.log(`  ⚠️ Missing cities from system: ${missingCities.join(', ')}`);
      }
      if (extraCities.length === 0 && missingCities.length === 0) {
        console.log(`  ✅ Perfect match`);
      }
    });
    
    return {
      systemLocations,
      authenticCountries,
      extraCountries,
      missingCountries
    };
    
  } catch (error) {
    console.error("Error fetching system locations:", error);
    return null;
  }
}

// Run the audit
const authenticLocations = auditTTLocations();
const systemAudit = await auditCurrentSystemLocations();

console.log("\n=== AUDIT SUMMARY ===");
console.log("This audit identifies discrepancies between system dropdown and authentic T&T data.");
console.log("Next step: Update location API to only serve authentic T&T locations.");

export { authenticLocations, systemAudit };