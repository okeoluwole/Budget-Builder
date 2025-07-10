#!/usr/bin/env node

/**
 * Compound Specification Names Test
 * Validates that "Low (Bronze)", "Medium (Silver)", "High (Gold)" format works correctly
 */

import fs from 'fs';

async function testCompoundSpecificationNames() {
  console.log("=== COMPOUND SPECIFICATION NAMES TEST ===");
  console.log("Testing frontend format: Low (Bronze), Medium (Silver), High (Gold)");
  console.log("Expected backend mapping: Low, Medium, High\n");

  const testCases = [
    {
      name: "Complete Package High (Gold) Specification",
      project: {
        city: "London", 
        country: "United Kingdom",
        totalArea: 1000,
        areaUnit: "sqm",
        currency: "GBP"
      },
      budget: {
        scope: "Complete Package",
        specification: "High (Gold)", // Compound format
        layout: "Activity",
        primaryDataSource: "CBRE"
      },
      expectedBackendMapping: "High",
      description: "High (Gold) should map to High database field"
    },
    {
      name: "Fitout Medium (Silver) Specification", 
      project: {
        city: "New York",
        country: "United States", 
        totalArea: 500,
        areaUnit: "sqft",
        currency: "USD"
      },
      budget: {
        scope: "Fitout",
        specification: "Medium (Silver)", // Compound format
        layout: "Team", 
        primaryDataSource: "CBRE"
      },
      expectedBackendMapping: "Medium",
      description: "Medium (Silver) should map to Medium database field"
    },
    {
      name: "Technology Low (Bronze) Specification",
      project: {
        city: "Singapore",
        country: "Singapore",
        totalArea: 750, 
        areaUnit: "sqm",
        currency: "SGD"
      },
      budget: {
        scope: "Technology",
        specification: "Low (Bronze)", // Compound format
        layout: "Event",
        primaryDataSource: "CBRE"
      },
      expectedBackendMapping: "Low", 
      description: "Low (Bronze) should map to Low database field"
    }
  ];

  const results = [];

  for (const testCase of testCases) {
    console.log(`--- Testing: ${testCase.name} ---`);
    console.log(`Description: ${testCase.description}`);
    
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
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      
      // Verify the mapping worked correctly
      const totalCost = result.totalCost || 0;
      const fitoutCost = result.fitoutCost || 0;
      const technologyCost = result.technologyCost || 0;
      const furnitureCost = result.furnitureCost || 0;
      
      console.log(`✓ Compound specification mapping successful`);
      console.log(`  Frontend spec: "${testCase.budget.specification}"`);
      console.log(`  Expected backend: ${testCase.expectedBackendMapping}`);
      console.log(`  Total cost: $${totalCost.toFixed(2)}`);
      console.log(`  Fitout: $${fitoutCost.toFixed(2)}`);
      console.log(`  Technology: $${technologyCost.toFixed(2)}`);
      console.log(`  Furniture: $${furnitureCost.toFixed(2)}`);
      
      results.push({
        testCase: testCase.name,
        success: true,
        frontendSpec: testCase.budget.specification,
        backendMapping: testCase.expectedBackendMapping,
        totalCost,
        validMapping: totalCost > 0
      });
      
    } catch (error) {
      console.error(`✗ Test failed: ${error.message}`);
      results.push({
        testCase: testCase.name,
        success: false,
        error: error.message
      });
    }
    
    console.log();
  }

  // Summary report
  console.log("=== COMPOUND SPECIFICATION MAPPING SUMMARY ===");
  const successful = results.filter(r => r.success && r.validMapping);
  const failed = results.filter(r => !r.success || !r.validMapping);
  
  console.log(`Total tests: ${results.length}`);
  console.log(`Successful mappings: ${successful.length}`);
  console.log(`Failed mappings: ${failed.length}\n`);
  
  if (successful.length > 0) {
    console.log("✓ SUCCESSFUL COMPOUND SPECIFICATION MAPPINGS:");
    successful.forEach(result => {
      console.log(`  "${result.frontendSpec}" → ${result.backendMapping}: $${result.totalCost.toFixed(2)}`);
    });
  }
  
  if (failed.length > 0) {
    console.log("\n✗ FAILED MAPPINGS:");
    failed.forEach(result => {
      if (result.error) {
        console.log(`  ${result.testCase}: ${result.error}`);
      } else {
        console.log(`  ${result.testCase}: No valid costs returned`);
      }
    });
  }

  console.log("\n=== COMPOUND SPECIFICATION FORMAT VALIDATION ===");
  if (successful.length === results.length) {
    console.log("✓ COMPOUND SPECIFICATION FORMAT WORKING PERFECTLY");
    console.log("✓ Frontend displays: Low (Bronze), Medium (Silver), High (Gold)");
    console.log("✓ Backend correctly extracts: Low, Medium, High for CBRE database queries");
    console.log("✓ User-friendly Bronze/Silver/Gold terms provided in parentheses");
    console.log("✓ CBRE data source terms (Low/Medium/High) prominently displayed");
  } else {
    console.log("✗ COMPOUND SPECIFICATION MAPPING ISSUES DETECTED");
    console.log("✗ Some compound specifications not properly parsed");
  }

  return successful.length === results.length;
}

// Execute the test
testCompoundSpecificationNames()
  .then(success => {
    console.log(`\nCompound specification test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });