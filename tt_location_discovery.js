/**
 * T&T Location Data Discovery System
 * Comprehensive discovery and validation of T&T location data structure
 */

// Import T&T data - using dynamic import for ES modules
import fs from 'fs';
import path from 'path';

// Read the T&T data file directly since it's TypeScript
const ttDataPath = './client/src/utils/tt2025Data.ts';
const ttDataContent = fs.readFileSync(ttDataPath, 'utf8');

// Extract the cost data array from the TypeScript file
const costDataMatch = ttDataContent.match(/export const TT2025_COST_DATA[^=]*=\s*(\[[\s\S]*?\]);/);
if (!costDataMatch) {
    throw new Error('Could not find TT2025_COST_DATA in the TypeScript file');
}

// Parse the JavaScript object (simplified evaluation)
const TT2025_COST_DATA = eval(costDataMatch[1]);

console.log("=== STEP 2: T&T LOCATION DATA DISCOVERY ===");

function getAllTTLocations() {
    console.log("Discovering available T&T locations...");
    
    try {
        const locations = TT2025_COST_DATA.map(location => ({
            country: location.country,
            city: location.city,
            region: location.region,
            id: `${location.country}/${location.city}`
        }));
        
        console.log(`Found ${locations.length} T&T locations`);
        return locations;
    } catch (error) {
        console.error("Error getting T&T locations:", error);
        return [];
    }
}

function getTTLocationsByRegion(region) {
    console.log(`Getting T&T locations for region: ${region}`);
    
    try {
        const regionLocations = TT2025_COST_DATA.filter(location => 
            location.region.toLowerCase() === region.toLowerCase()
        );
        
        console.log(`Found ${regionLocations.length} locations in ${region}`);
        return regionLocations.map(loc => ({
            country: loc.country,
            city: loc.city,
            costs: {
                low: loc.costs.total.low,
                medium: loc.costs.total.medium,
                high: loc.costs.total.high
            }
        }));
    } catch (error) {
        console.error(`Error getting ${region} locations:`, error);
        return [];
    }
}

function checkTTLocationExists(searchTerm) {
    console.log(`Checking if T&T location exists: ${searchTerm}`);
    
    try {
        const found = TT2025_COST_DATA.find(location => 
            location.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
            location.city.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return !!found;
    } catch (error) {
        console.error(`Error checking location ${searchTerm}:`, error);
        return false;
    }
}

function getTTLocationData(searchTerm) {
    console.log(`Getting T&T location data for: ${searchTerm}`);
    
    try {
        const found = TT2025_COST_DATA.find(location => 
            location.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
            location.city.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (!found) {
            console.log(`No data found for: ${searchTerm}`);
            return null;
        }
        
        return {
            country: found.country,
            city: found.city,
            region: found.region,
            costs: found.costs,
            dataStructure: Object.keys(found.costs)
        };
    } catch (error) {
        console.error(`Error getting data for ${searchTerm}:`, error);
        return null;
    }
}

function discoverTTLocationData() {
    console.log("Discovering available T&T locations...");
    
    try {
        // Get all available T&T locations
        const ttLocations = getAllTTLocations();
        console.log("Available T&T locations:", ttLocations.length);
        
        // Test specific regions
        const testRegions = ["EMEA", "AMERICAS", "APAC"];
        const regionData = {};
        
        testRegions.forEach(region => {
            const regionLocations = getTTLocationsByRegion(region);
            regionData[region] = regionLocations;
            console.log(`${region} locations: ${regionLocations.length}`);
        });
        
        // Test specific problem locations from the error
        const problemLocations = [
            "United States", "Canada", "United Kingdom", "Germany", "France"
        ];
        
        const locationTestResults = {};
        problemLocations.forEach(location => {
            try {
                const locationExists = checkTTLocationExists(location);
                const locationData = getTTLocationData(location);
                
                locationTestResults[location] = {
                    exists: locationExists,
                    hasData: !!locationData,
                    dataStructure: locationData ? Object.keys(locationData) : null
                };
                
                console.log(`${location}: exists=${locationExists}, hasData=${!!locationData}`);
                
            } catch (error) {
                locationTestResults[location] = { error: error.message };
                console.error(`${location}: ERROR - ${error.message}`);
            }
        });
        
        return {
            allLocations: ttLocations,
            regionData: regionData,
            locationTests: locationTestResults
        };
        
    } catch (error) {
        console.error("❌ T&T location discovery failed:", error);
        return { error: error.message };
    }
}

// Execute Step 2
console.log("Starting T&T Location Data Discovery...");
const step2Results = discoverTTLocationData();
console.log("STEP 2 RESULTS:", step2Results);

// Check if any locations were found
if (!step2Results.allLocations || step2Results.allLocations.length === 0) {
    console.error("❌ STEP 2 FAILED - No T&T locations found");
    throw new Error("No T&T location data available");
}

console.log("✅ STEP 2 PASSED - T&T locations discovered");

// Additional validation - show sample data
console.log("\n=== SAMPLE T&T LOCATION DATA ===");
const sampleLocation = step2Results.allLocations[0];
if (sampleLocation) {
    const sampleData = getTTLocationData(sampleLocation.country);
    console.log("Sample location data:", sampleData);
}

// Show regional breakdown
console.log("\n=== REGIONAL BREAKDOWN ===");
Object.entries(step2Results.regionData).forEach(([region, locations]) => {
    console.log(`${region}: ${locations.length} locations`);
    if (locations.length > 0) {
        console.log(`  Sample: ${locations[0].country}/${locations[0].city}`);
    }
});

module.exports = {
    getAllTTLocations,
    getTTLocationsByRegion,
    checkTTLocationExists,
    getTTLocationData,
    discoverTTLocationData
};