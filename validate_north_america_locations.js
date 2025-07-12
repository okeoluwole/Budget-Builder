/**
 * Validate T&T North America Location Coverage
 * Check all North American locations for data availability
 */

console.log("=== NORTH AMERICA T&T LOCATION VALIDATION ===");

// Import T&T data to check available locations
const { TT2025_COST_DATA, getTT2025CountriesByRegion, getTT2025CitiesByCountry } = require('./client/src/utils/tt2025Data.ts');

// Get all Americas locations
const americasCountries = getTT2025CountriesByRegion('AMERICAS');
console.log("Americas countries:", americasCountries);

// Check each Americas location
const northAmericaLocations = [];
americasCountries.forEach(country => {
    const cities = getTT2025CitiesByCountry(country);
    cities.forEach(city => {
        northAmericaLocations.push({ country, city });
    });
});

console.log("\n=== NORTH AMERICA LOCATIONS IN T&T DATA ===");
northAmericaLocations.forEach((location, index) => {
    console.log(`${index + 1}. ${location.country}/${location.city}`);
});

// Test API for each North American location
async function testNorthAmericaAPI() {
    console.log("\n=== TESTING NORTH AMERICA API CALLS ===");
    
    const testResults = [];
    
    for (const location of northAmericaLocations) {
        console.log(`\nTesting ${location.country}/${location.city}...`);
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: {
                        city: location.city,
                        country: location.country,
                        totalArea: 1000,
                        areaUnit: "sqm",
                        currency: "USD"
                    },
                    budget: {
                        primaryDataSource: "TT",
                        scope: "Complete",
                        specification: "Medium (Silver)",
                        layout: "Activity"
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ ${location.country}/${location.city}: $${result.rawUnitCost}/sqm`);
                testResults.push({
                    location: `${location.country}/${location.city}`,
                    success: true,
                    totalCost: result.rawUnitCost,
                    breakdown: result.costsBreakdown
                });
            } else {
                const error = await response.json();
                console.log(`❌ ${location.country}/${location.city}: ${error.message || 'API Error'}`);
                testResults.push({
                    location: `${location.country}/${location.city}`,
                    success: false,
                    error: error.message || 'API Error'
                });
            }
        } catch (error) {
            console.log(`❌ ${location.country}/${location.city}: ${error.message}`);
            testResults.push({
                location: `${location.country}/${location.city}`,
                success: false,
                error: error.message
            });
        }
        
        // Small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return testResults;
}

// Test some common North American locations that users might try
async function testCommonNorthAmericaLocations() {
    console.log("\n=== TESTING COMMON NORTH AMERICA LOCATIONS ===");
    
    const commonLocations = [
        { country: "United States", city: "New York" },
        { country: "United States", city: "Los Angeles" },
        { country: "United States", city: "Chicago" },
        { country: "United States", city: "Houston" },
        { country: "United States", city: "Miami" },
        { country: "Canada", city: "Toronto" },
        { country: "Canada", city: "Vancouver" },
        { country: "Canada", city: "Montreal" },
        { country: "Mexico", city: "Mexico City" }
    ];
    
    const testResults = [];
    
    for (const location of commonLocations) {
        console.log(`\nTesting ${location.country}/${location.city}...`);
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: {
                        city: location.city,
                        country: location.country,
                        totalArea: 1000,
                        areaUnit: "sqm",
                        currency: "USD"
                    },
                    budget: {
                        primaryDataSource: "TT",
                        scope: "Complete",
                        specification: "Medium (Silver)",
                        layout: "Activity"
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log(`✅ ${location.country}/${location.city}: $${result.rawUnitCost}/sqm`);
                testResults.push({
                    location: `${location.country}/${location.city}`,
                    success: true,
                    totalCost: result.rawUnitCost,
                    inTTData: northAmericaLocations.some(loc => 
                        loc.country === location.country && loc.city === location.city
                    )
                });
            } else {
                const error = await response.json();
                console.log(`❌ ${location.country}/${location.city}: ${error.message || 'API Error'}`);
                testResults.push({
                    location: `${location.country}/${location.city}`,
                    success: false,
                    error: error.message || 'API Error',
                    inTTData: northAmericaLocations.some(loc => 
                        loc.country === location.country && loc.city === location.city
                    )
                });
            }
        } catch (error) {
            console.log(`❌ ${location.country}/${location.city}: ${error.message}`);
            testResults.push({
                location: `${location.country}/${location.city}`,
                success: false,
                error: error.message,
                inTTData: northAmericaLocations.some(loc => 
                    loc.country === location.country && loc.city === location.city
                )
            });
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    return testResults;
}

// Run validation
console.log("Starting North America validation...");

const officialResults = await testNorthAmericaAPI();
const commonResults = await testCommonNorthAmericaLocations();

console.log("\n=== VALIDATION SUMMARY ===");

console.log("\nOfficial T&T North America Locations:");
const successfulOfficial = officialResults.filter(r => r.success);
const failedOfficial = officialResults.filter(r => !r.success);
console.log(`✅ Successful: ${successfulOfficial.length}/${officialResults.length}`);
console.log(`❌ Failed: ${failedOfficial.length}/${officialResults.length}`);

console.log("\nCommon North America Locations:");
const successfulCommon = commonResults.filter(r => r.success);
const failedCommon = commonResults.filter(r => !r.success);
console.log(`✅ Successful: ${successfulCommon.length}/${commonResults.length}`);
console.log(`❌ Failed: ${failedCommon.length}/${commonResults.length}`);

console.log("\nFailed locations that should be supported:");
failedCommon.filter(r => r.inTTData).forEach(r => {
    console.log(`- ${r.location}: ${r.error}`);
});

console.log("\nFailed locations NOT in T&T data (expected):");
failedCommon.filter(r => !r.inTTData).forEach(r => {
    console.log(`- ${r.location}: ${r.error}`);
});

export { officialResults, commonResults, northAmericaLocations };