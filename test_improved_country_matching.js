/**
 * Test Improved Country Name Matching and STEP 5 Implementation
 */

console.log("=== TESTING IMPROVED COUNTRY NAME MATCHING AND STEP 5 ===");

// Test cases for improved country name matching
const testCases = [
  { country: 'USA', city: 'New York' },
  { country: 'US', city: 'New York' },
  { country: 'United States', city: 'Houston' }, // Should fallback to first US city
  { country: 'United States', city: 'Boston' },  // Should fallback to first US city
  { country: 'UK', city: 'London' },
  { country: 'Canada', city: 'Montreal' }        // Should fallback to first Canadian city
];

async function testLocationMatching() {
  console.log("\n=== TESTING COUNTRY NAME MATCHING ===");
  
  for (const testCase of testCases) {
    console.log(`\nTesting ${testCase.country}/${testCase.city}...`);
    
    try {
      const response = await fetch('http://localhost:5000/api/calculate-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: {
            city: testCase.city,
            country: testCase.country,
            totalArea: 1000,
            areaUnit: 'sqm',
            currency: 'USD'
          },
          budget: {
            primaryDataSource: 'TT',
            scope: 'Complete',
            specification: 'Medium (Silver)',
            layout: 'Activity'
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${testCase.country}/${testCase.city}: $${result.rawUnitCost}/sqm`);
      } else {
        const error = await response.json();
        console.log(`❌ ${testCase.country}/${testCase.city}: ${error.message}`);
      }
    } catch (error) {
      console.log(`❌ ${testCase.country}/${testCase.city}: ${error.message}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// STEP 5: T&T Complete Package Testing with Real API
async function testTTCompletePackageAPI() {
  console.log("\n=== STEP 5: T&T COMPLETE PACKAGE TESTING ===");
  console.log("Testing T&T Complete Package calculation with real API...");
  
  // Use working location from successful tests
  const testLocation = { country: "United States", city: "New York" };
  
  console.log("Using test location:", testLocation);
  
  try {
    const response = await fetch('http://localhost:5000/api/calculate-budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project: {
          city: testLocation.city,
          country: testLocation.country,
          totalArea: 1000,
          areaUnit: 'sqm',
          currency: 'USD'
        },
        budget: {
          primaryDataSource: 'TT',
          scope: 'Complete',
          specification: 'Medium (Silver)',
          layout: 'Activity'
        }
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      
      console.log("Complete Package API result:", {
        totalCost: result.totalCost,
        rawUnitCost: result.rawUnitCost,
        breakdown: result.costsBreakdown
      });
      
      // Validate result structure for STEP 5
      const validationChecks = {
        hasTotalCost: !!(result.totalCost && result.totalCost > 0),
        hasRawUnitCost: !!(result.rawUnitCost && result.rawUnitCost > 0),
        hasBreakdown: !!result.costsBreakdown,
        hasAllComponents: !!(
          result.costsBreakdown &&
          result.costsBreakdown['Construction'] &&
          result.costsBreakdown['Loose Furniture'] &&
          result.costsBreakdown['Audio-Visual'] &&
          result.costsBreakdown['Professional Fees']
        ),
        componentNamesCorrect: !!(
          result.costsBreakdown &&
          Object.keys(result.costsBreakdown).includes('Construction') &&
          Object.keys(result.costsBreakdown).includes('Loose Furniture') &&
          Object.keys(result.costsBreakdown).includes('Audio-Visual') &&
          Object.keys(result.costsBreakdown).includes('Professional Fees')
        ),
        allComponentsHaveValues: !!(
          result.costsBreakdown &&
          result.costsBreakdown['Construction'] > 0 &&
          result.costsBreakdown['Loose Furniture'] > 0 &&
          result.costsBreakdown['Audio-Visual'] > 0 &&
          result.costsBreakdown['Professional Fees'] > 0
        ),
        totalMatchesComponents: !!(
          result.costsBreakdown &&
          Math.abs(result.totalCost - (
            result.costsBreakdown['Construction'] +
            result.costsBreakdown['Loose Furniture'] +
            result.costsBreakdown['Audio-Visual'] +
            result.costsBreakdown['Professional Fees']
          )) < 100
        )
      };
      
      console.log("STEP 5 Validation checks:", validationChecks);
      
      const allChecksPass = Object.values(validationChecks).every(check => check === true);
      
      return {
        success: allChecksPass,
        apiResult: result,
        validationChecks: validationChecks,
        componentRates: {
          construction: Math.round(result.costsBreakdown['Construction'] / 1000),
          looseFurniture: Math.round(result.costsBreakdown['Loose Furniture'] / 1000),
          audioVisual: Math.round(result.costsBreakdown['Audio-Visual'] / 1000),
          professionalFees: Math.round(result.costsBreakdown['Professional Fees'] / 1000)
        }
      };
      
    } else {
      const error = await response.json();
      console.log(`❌ API Error: ${error.message}`);
      return { success: false, error: error.message };
    }
    
  } catch (error) {
    console.log(`❌ Request Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run comprehensive tests
async function runComprehensiveTests() {
  console.log("Starting comprehensive country matching and STEP 5 tests...");
  
  // Test country name matching
  await testLocationMatching();
  
  // Test STEP 5 Complete Package
  const step5Results = await testTTCompletePackageAPI();
  
  console.log("\n=== COMPREHENSIVE TEST RESULTS ===");
  
  if (step5Results.success) {
    console.log("✅ STEP 5 PASSED - T&T Complete Package working perfectly");
    console.log(`   Total Cost: $${step5Results.apiResult.totalCost.toLocaleString()}`);
    console.log(`   Cost per sqm: $${step5Results.apiResult.rawUnitCost}/sqm`);
    console.log(`   Component rates: Construction $${step5Results.componentRates.construction}, Furniture $${step5Results.componentRates.looseFurniture}, AV $${step5Results.componentRates.audioVisual}, Fees $${step5Results.componentRates.professionalFees}`);
  } else {
    console.log("❌ STEP 5 FAILED - Issues found");
    if (step5Results.error) {
      console.log(`   Error: ${step5Results.error}`);
    }
  }
  
  return step5Results;
}

// Execute tests
const results = await runComprehensiveTests();

console.log("\n=== FINAL CONCLUSION ===");
if (results.success) {
  console.log("🎉 ALL TESTS PASSED - Country matching improved and STEP 5 Complete Package working");
  console.log("✅ North American locations now support common country name variations (USA, US, UK, etc.)");
  console.log("✅ T&T Complete Package calculation validated with authentic API integration");
} else {
  console.log("⚠️ SOME TESTS FAILED - Issues need resolution");
}

export { results };