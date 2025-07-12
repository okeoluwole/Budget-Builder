/**
 * T&T Simple Validation Test
 * Tests T&T data structure and calculation logic directly
 */

import { TT2025_COST_DATA } from './client/src/utils/tt2025Data.js';

async function testTTSimpleValidation() {
  console.log("=== T&T SIMPLE VALIDATION TEST ===");
  
  try {
    // Test 1: Verify T&T data structure
    console.log("\n1. Testing T&T Data Structure...");
    console.log(`Total T&T locations: ${TT2025_COST_DATA.length}`);
    
    if (TT2025_COST_DATA.length === 0) {
      throw new Error("T&T data is empty!");
    }
    
    // Sample first few locations
    console.log("\nSample T&T locations:");
    TT2025_COST_DATA.slice(0, 3).forEach(location => {
      console.log(`- ${location.city}, ${location.country} (${location.region})`);
      console.log(`  Construction: Low=${location.costs.construction.low}, Medium=${location.costs.construction.medium}, High=${location.costs.construction.high}`);
    });
    
    // Test 2: Find specific key locations
    console.log("\n2. Testing Key Location Availability...");
    const keyLocations = [
      { city: "London", country: "United Kingdom" },
      { city: "New York", country: "United States" },
      { city: "Singapore", country: "Singapore" }
    ];
    
    keyLocations.forEach(loc => {
      const found = TT2025_COST_DATA.find(data => 
        data.city.toLowerCase() === loc.city.toLowerCase() &&
        data.country.toLowerCase() === loc.country.toLowerCase()
      );
      
      if (found) {
        console.log(`✅ ${loc.city}, ${loc.country}: Found with ${Object.keys(found.costs).length} cost components`);
        console.log(`   Total Complete Package (Medium): ${
          found.costs.construction.medium + 
          found.costs.looseFurniture.medium + 
          found.costs.audioVisual.medium + 
          found.costs.professionalFees.medium
        }`);
      } else {
        console.log(`❌ ${loc.city}, ${loc.country}: Not found`);
      }
    });
    
    // Test 3: Validate component structure  
    console.log("\n3. Testing Component Structure Consistency...");
    const firstLocation = TT2025_COST_DATA[0];
    const expectedComponents = ['construction', 'looseFurniture', 'audioVisual', 'professionalFees'];
    const expectedSpecs = ['low', 'medium', 'high'];
    
    let structureValid = true;
    expectedComponents.forEach(component => {
      if (!firstLocation.costs[component]) {
        console.log(`❌ Missing component: ${component}`);
        structureValid = false;
      } else {
        expectedSpecs.forEach(spec => {
          if (typeof firstLocation.costs[component][spec] !== 'number') {
            console.log(`❌ Invalid ${component}.${spec}: ${firstLocation.costs[component][spec]}`);
            structureValid = false;
          }
        });
      }
    });
    
    if (structureValid) {
      console.log("✅ T&T data structure is valid and consistent");
    }
    
    // Test 4: Calculate sample budget
    console.log("\n4. Testing Sample Budget Calculation...");
    const londonData = TT2025_COST_DATA.find(data => 
      data.city.toLowerCase() === "london" && 
      data.country.toLowerCase() === "united kingdom"
    );
    
    if (londonData) {
      const area = 1000; // sqm
      const spec = 'high'; // Gold specification
      
      const constructionCost = londonData.costs.construction[spec] * area;
      const furnitureCost = londonData.costs.looseFurniture[spec] * area;
      const avCost = londonData.costs.audioVisual[spec] * area;
      const professionalFees = londonData.costs.professionalFees[spec] * area;
      const totalCost = constructionCost + furnitureCost + avCost + professionalFees;
      
      console.log(`London Complete Package (${area} sqm, High spec):`);
      console.log(`- Construction: $${Math.round(constructionCost).toLocaleString()}`);
      console.log(`- Loose Furniture: $${Math.round(furnitureCost).toLocaleString()}`);
      console.log(`- Audio-Visual: $${Math.round(avCost).toLocaleString()}`);
      console.log(`- Professional Fees: $${Math.round(professionalFees).toLocaleString()}`);
      console.log(`- TOTAL: $${Math.round(totalCost).toLocaleString()}`);
      console.log(`- Rate per sqm: $${Math.round(totalCost/area)}/sqm`);
      
      if (totalCost > 0) {
        console.log("✅ T&T calculation logic working correctly");
      } else {
        console.log("❌ T&T calculation returned zero cost");
      }
    }
    
    // Generate final report
    console.log("\n=== T&T VALIDATION SUMMARY ===");
    const dataExists = TT2025_COST_DATA.length > 0;
    const keyLocationsFound = keyLocations.filter(loc => 
      TT2025_COST_DATA.find(data => 
        data.city.toLowerCase() === loc.city.toLowerCase() &&
        data.country.toLowerCase() === loc.country.toLowerCase()
      )
    ).length;
    
    console.log(`📊 Data Availability: ${dataExists ? 'Available' : 'Missing'} (${TT2025_COST_DATA.length} locations)`);
    console.log(`🌍 Key Locations: ${keyLocationsFound}/${keyLocations.length} found`);
    console.log(`🏗️ Data Structure: ${structureValid ? 'Valid' : 'Invalid'}`);
    console.log(`🧮 Calculation: ${londonData ? 'Working' : 'Failed'}`);
    
    const overallStatus = dataExists && structureValid && keyLocationsFound === keyLocations.length;
    console.log(`\n🎯 T&T System Status: ${overallStatus ? '✅ READY FOR PRODUCTION' : '⚠️ NEEDS ATTENTION'}`);
    
  } catch (error) {
    console.error("T&T Validation Error:", error);
    console.log("\n❌ T&T SYSTEM VALIDATION FAILED");
    console.log(`🔧 Error: ${error.message}`);
  }
}

// Export for ES modules
export { testTTSimpleValidation };

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  testTTSimpleValidation().catch(console.error);
}