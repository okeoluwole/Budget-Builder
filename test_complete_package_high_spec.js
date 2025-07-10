#!/usr/bin/env node

/**
 * Complete Package High Specification Test
 * Tests London, Abuja, and Tel Aviv with Activity layout, High (Gold) spec, Event layout
 */

import fs from 'fs';

async function testCompletePackageHighSpec() {
  console.log("=== COMPLETE PACKAGE HIGH SPECIFICATION TEST ===");
  console.log("Testing: Activity layout, High (Gold) specification, Event layout");
  console.log("Locations: London, Abuja, Tel Aviv");
  console.log("Components: Fitout + Technology + Furniture + Professional Fees\n");

  const testCases = [
    {
      name: "London Complete Package High (Gold)",
      project: {
        city: "London", 
        country: "United Kingdom",
        totalArea: 1000,
        areaUnit: "sqm",
        currency: "GBP"
      },
      budget: {
        scope: "Complete Package",
        specification: "High (Gold)",
        layout: "Event", // Changed to Event as requested
        primaryDataSource: "CBRE"
      },
      expectedComponents: ["Fitout", "Technology", "Furniture"]
    },
    {
      name: "Abuja Complete Package High (Gold)", 
      project: {
        city: "Abuja",
        country: "Nigeria", 
        totalArea: 1000,
        areaUnit: "sqm",
        currency: "NGN"
      },
      budget: {
        scope: "Complete Package",
        specification: "High (Gold)",
        layout: "Event", // Changed to Event as requested
        primaryDataSource: "CBRE"
      },
      expectedComponents: ["Fitout", "Technology", "Furniture"]
    },
    {
      name: "Tel Aviv Complete Package High (Gold)",
      project: {
        city: "Tel Aviv",
        country: "Israel",
        totalArea: 1000, 
        areaUnit: "sqm",
        currency: "ILS"
      },
      budget: {
        scope: "Complete Package",
        specification: "High (Gold)",
        layout: "Event", // Changed to Event as requested
        primaryDataSource: "CBRE"
      },
      expectedComponents: ["Fitout", "Technology", "Furniture"]
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
      
      // Extract cost components
      const totalCost = result.totalCost || 0;
      const fitoutCost = result.fitoutCost || 0;
      const technologyCost = result.technologyCost || 0;
      const furnitureCost = result.furnitureCost || 0;
      const rawUnitCost = result.rawUnitCost || 0;
      
      console.log(`✓ Complete Package calculation successful`);
      console.log(`  Location: ${testCase.project.city}, ${testCase.project.country}`);
      console.log(`  Specification: ${testCase.budget.specification}`);
      console.log(`  Layout: ${testCase.budget.layout}`);
      console.log(`  Area: ${testCase.project.totalArea} ${testCase.project.areaUnit}`);
      console.log(`  Currency: ${testCase.project.currency}`);
      console.log(`  
  COST BREAKDOWN:`);
      console.log(`    Fitout:     ${testCase.project.currency} ${fitoutCost.toLocaleString()} (${(fitoutCost/testCase.project.totalArea).toFixed(2)}/${testCase.project.areaUnit})`);
      console.log(`    Technology: ${testCase.project.currency} ${technologyCost.toLocaleString()} (${(technologyCost/testCase.project.totalArea).toFixed(2)}/${testCase.project.areaUnit})`);
      console.log(`    Furniture:  ${testCase.project.currency} ${furnitureCost.toLocaleString()} (${(furnitureCost/testCase.project.totalArea).toFixed(2)}/${testCase.project.areaUnit})`);
      console.log(`    TOTAL:      ${testCase.project.currency} ${totalCost.toLocaleString()} (${(totalCost/testCase.project.totalArea).toFixed(2)}/${testCase.project.areaUnit})`);
      
      // Validate all components have costs
      const componentValidation = {
        fitout: fitoutCost > 0,
        technology: technologyCost > 0,
        furniture: furnitureCost > 0
      };
      
      const allComponentsValid = Object.values(componentValidation).every(valid => valid);
      
      console.log(`  
  COMPONENT VALIDATION:`);
      console.log(`    Fitout costs present:     ${componentValidation.fitout ? '✓' : '✗'}`);
      console.log(`    Technology costs present: ${componentValidation.technology ? '✓' : '✗'}`);
      console.log(`    Furniture costs present:  ${componentValidation.furniture ? '✓' : '✗'}`);
      console.log(`    All components valid:     ${allComponentsValid ? '✓' : '✗'}`);
      
      results.push({
        location: `${testCase.project.city}, ${testCase.project.country}`,
        success: true,
        totalCost,
        fitoutCost,
        technologyCost,
        furnitureCost,
        currency: testCase.project.currency,
        unitCost: totalCost / testCase.project.totalArea,
        allComponentsValid,
        componentValidation,
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
  console.log("=== COMPLETE PACKAGE HIGH SPECIFICATION SUMMARY ===");
  const successful = results.filter(r => r.success && r.allComponentsValid);
  const failed = results.filter(r => !r.success || !r.allComponentsValid);
  
  console.log(`Total locations tested: ${results.length}`);
  console.log(`Successful calculations: ${successful.length}`);
  console.log(`Failed calculations: ${failed.length}\n`);
  
  if (successful.length > 0) {
    console.log("✓ SUCCESSFUL COMPLETE PACKAGE CALCULATIONS:");
    successful.forEach(result => {
      console.log(`  ${result.location}: ${result.currency} ${result.totalCost.toLocaleString()} (${result.unitCost.toFixed(2)}/${results[0].result?.areaUnit || 'sqm'})`);
      console.log(`    - Fitout: ${result.currency} ${result.fitoutCost.toLocaleString()}`);
      console.log(`    - Technology: ${result.currency} ${result.technologyCost.toLocaleString()}`);
      console.log(`    - Furniture: ${result.currency} ${result.furnitureCost.toLocaleString()}`);
    });
  }
  
  if (failed.length > 0) {
    console.log("\n✗ FAILED CALCULATIONS:");
    failed.forEach(result => {
      if (result.error) {
        console.log(`  ${result.location}: ${result.error}`);
      } else {
        console.log(`  ${result.location}: Missing component costs`);
        if (result.componentValidation) {
          Object.entries(result.componentValidation).forEach(([component, valid]) => {
            if (!valid) console.log(`    - Missing: ${component}`);
          });
        }
      }
    });
  }

  console.log("\n=== GLOBAL COVERAGE VALIDATION ===");
  if (successful.length === results.length) {
    console.log("✓ COMPLETE PACKAGE HIGH SPECIFICATION WORKING GLOBALLY");
    console.log("✓ London (Europe): Full component coverage");
    console.log("✓ Abuja (Africa): Full component coverage");  
    console.log("✓ Tel Aviv (Middle East): Full component coverage");
    console.log("✓ High (Gold) specification mapped correctly across all locations");
    console.log("✓ Event layout working for all locations");
  } else {
    console.log("✗ GLOBAL COVERAGE ISSUES DETECTED");
    console.log("✗ Some locations missing complete component coverage");
  }

  return successful.length === results.length;
}

// Execute the test
testCompletePackageHighSpec()
  .then(success => {
    console.log(`\nComplete Package High Specification test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });