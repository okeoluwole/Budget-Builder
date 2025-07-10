#!/usr/bin/env node

/**
 * CBRE USD Currency Fix Validation Test
 * Validates that CBRE data displays in USD regardless of project currency settings
 */

async function testCBREUSDCurrency() {
  console.log("=== CBRE USD CURRENCY FIX VALIDATION ===");
  console.log("Testing: All CBRE calculations should display in USD");
  console.log("Issue: Previously showing costs in local currencies (GBP, NGN, ILS)");
  console.log("Expected: All CBRE rates should remain in USD\n");

  const testCases = [
    {
      name: "London High (Gold) - Should Display USD, Not GBP",
      project: {
        city: "London", 
        country: "United Kingdom",
        totalArea: 1000,
        areaUnit: "sqm",
        currency: "GBP" // Project currency is GBP, but CBRE should show USD
      },
      budget: {
        scope: "Complete Package",
        specification: "High (Gold)",
        layout: "Event",
        primaryDataSource: "CBRE"
      },
      expectedCurrency: "USD"
    },
    {
      name: "Abuja High (Gold) - Should Display USD, Not NGN", 
      project: {
        city: "Abuja",
        country: "Nigeria", 
        totalArea: 1000,
        areaUnit: "sqm",
        currency: "NGN" // Project currency is NGN, but CBRE should show USD
      },
      budget: {
        scope: "Complete Package",
        specification: "High (Gold)",
        layout: "Event",
        primaryDataSource: "CBRE"
      },
      expectedCurrency: "USD"
    },
    {
      name: "Tel Aviv High (Gold) - Should Display USD, Not ILS",
      project: {
        city: "Tel Aviv",
        country: "Israel",
        totalArea: 1000, 
        areaUnit: "sqm",
        currency: "ILS" // Project currency is ILS, but CBRE should show USD
      },
      budget: {
        scope: "Complete Package",
        specification: "High (Gold)",
        layout: "Event",
        primaryDataSource: "CBRE"
      },
      expectedCurrency: "USD"
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`--- Testing: ${testCase.name} ---`);
    
    try {
      const response = await fetch('http://localhost:5000/api/calculate-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: testCase.project,
          budget: testCase.budget
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      // Check if result contains currency information
      const actualCurrency = result.localCurrencyCode || 'UNKNOWN';
      const currencyMatches = actualCurrency === testCase.expectedCurrency;
      
      console.log(`✓ CBRE calculation successful`);
      console.log(`  Location: ${testCase.project.city}, ${testCase.project.country}`);
      console.log(`  Project currency: ${testCase.project.currency}`);
      console.log(`  Result currency: ${actualCurrency}`);
      console.log(`  Expected currency: ${testCase.expectedCurrency}`);
      console.log(`  Currency correct: ${currencyMatches ? '✓' : '✗'}`);
      
      if (currencyMatches) {
        console.log(`  ✓ CBRE data correctly displayed in USD`);
      } else {
        console.log(`  ✗ CBRE data incorrectly displayed in ${actualCurrency}`);
      }
      
      console.log(`  Total cost: ${actualCurrency} ${result.totalCost?.toLocaleString() || 'N/A'}`);
      
      results.push({
        location: `${testCase.project.city}, ${testCase.project.country}`,
        success: true,
        projectCurrency: testCase.project.currency,
        resultCurrency: actualCurrency,
        expectedCurrency: testCase.expectedCurrency,
        currencyCorrect: currencyMatches,
        totalCost: result.totalCost,
        result
      });
      
    } catch (error) {
      console.error(`✗ Test failed: ${error.message}`);
      results.push({
        location: `${testCase.project.city}, ${testCase.project.country}`,
        success: false,
        error: error.message
      });
    }
    
    console.log();
  }

  // Summary report
  console.log("=== CBRE USD CURRENCY FIX SUMMARY ===");
  const successful = results.filter(r => r.success);
  const currencyCorrect = results.filter(r => r.success && r.currencyCorrect);
  const currencyIncorrect = results.filter(r => r.success && !r.currencyCorrect);
  
  console.log(`Total locations tested: ${results.length}`);
  console.log(`Successful calculations: ${successful.length}`);
  console.log(`Correct USD display: ${currencyCorrect.length}`);
  console.log(`Incorrect currency display: ${currencyIncorrect.length}\n`);
  
  if (currencyCorrect.length > 0) {
    console.log("✓ CORRECT USD DISPLAY:");
    currencyCorrect.forEach(result => {
      console.log(`  ${result.location}: ${result.resultCurrency} ${result.totalCost?.toLocaleString()}`);
      console.log(`    Project: ${result.projectCurrency} → Display: ${result.resultCurrency} ✓`);
    });
  }
  
  if (currencyIncorrect.length > 0) {
    console.log("\n✗ INCORRECT CURRENCY DISPLAY:");
    currencyIncorrect.forEach(result => {
      console.log(`  ${result.location}: ${result.resultCurrency} ${result.totalCost?.toLocaleString()}`);
      console.log(`    Project: ${result.projectCurrency} → Display: ${result.resultCurrency} (Expected: ${result.expectedCurrency}) ✗`);
    });
  }

  console.log("\n=== CURRENCY FIX VALIDATION ===");
  if (currencyCorrect.length === results.length) {
    console.log("✓ CBRE USD CURRENCY FIX SUCCESSFUL");
    console.log("✓ All CBRE calculations now display in USD");
    console.log("✓ No currency conversion applied to CBRE data");
    console.log("✓ Project currency settings properly ignored for CBRE");
  } else {
    console.log("✗ CBRE USD CURRENCY FIX INCOMPLETE");
    console.log("✗ Some calculations still showing local currencies");
    console.log("✗ Currency conversion logic still active for CBRE data");
  }

  return currencyCorrect.length === results.length;
}

// Execute the test
testCBREUSDCurrency()
  .then(success => {
    console.log(`\nCBRE USD Currency Fix test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });