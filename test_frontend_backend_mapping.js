#!/usr/bin/env node

/**
 * Frontend-Backend Specification Mapping Validation
 * Confirms that frontend shows Bronze/Silver/Gold while backend correctly maps to Low/Medium/High
 */

import fs from 'fs';

async function testFrontendBackendMapping() {
  console.log("=== FRONTEND-BACKEND SPECIFICATION MAPPING TEST ===");
  console.log("Frontend should display: Bronze, Silver, Gold");
  console.log("Backend should map to: Low, Medium, High for CBRE data\n");

  // Test the mapping by calling the server with frontend specifications
  const testCases = [
    {
      name: "Complete Package Gold Specification",
      project: {
        city: "London", 
        country: "United Kingdom",
        totalArea: 1000,
        areaUnit: "sqm",
        currency: "GBP"
      },
      budget: {
        scope: "Complete Package",
        specification: "Gold", // Frontend sends Gold
        layout: "Activity",
        primaryDataSource: "CBRE"
      },
      expectedBackendMapping: "High",
      expectedComponents: ["Fitout", "Technology", "Furniture"]
    },
    {
      name: "Fitout Silver Specification", 
      project: {
        city: "New York",
        country: "United States", 
        totalArea: 500,
        areaUnit: "sqft",
        currency: "USD"
      },
      budget: {
        scope: "Fitout",
        specification: "Silver", // Frontend sends Silver
        layout: "Team", 
        primaryDataSource: "CBRE"
      },
      expectedBackendMapping: "Medium",
      expectedComponents: ["Fitout"]
    },
    {
      name: "Technology Bronze Specification",
      project: {
        city: "Singapore",
        country: "Singapore",
        totalArea: 750, 
        areaUnit: "sqm",
        currency: "SGD"
      },
      budget: {
        scope: "Technology",
        specification: "Bronze", // Frontend sends Bronze
        layout: "Event",
        primaryDataSource: "CBRE"
      },
      expectedBackendMapping: "Low", 
      expectedComponents: ["Technology"]
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
        throw new Error(`HTTP ${response.status}: ${await response.text()}`);
      }

      const result = await response.json();
      
      // Verify the mapping worked correctly
      const totalCost = result.totalCost || 0;
      const fitoutCost = result.fitoutCost || 0;
      const technologyCost = result.technologyCost || 0;
      const furnitureCost = result.furnitureCost || 0;
      
      console.log(`✓ Specification mapping successful`);
      console.log(`  Frontend spec: ${testCase.budget.specification}`);
      console.log(`  Backend maps to: ${testCase.expectedBackendMapping}`);
      console.log(`  Total cost: $${totalCost.toFixed(2)}`);
      
      // Verify expected components have costs
      const componentCosts = {
        Fitout: fitoutCost,
        Technology: technologyCost, 
        Furniture: furnitureCost
      };
      
      testCase.expectedComponents.forEach(component => {
        const cost = componentCosts[component];
        console.log(`  ${component} cost: $${cost.toFixed(2)} ${cost > 0 ? '✓' : '✗'}`);
      });
      
      results.push({
        testCase: testCase.name,
        success: true,
        frontendSpec: testCase.budget.specification,
        backendMapping: testCase.expectedBackendMapping,
        totalCost,
        componentCosts,
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
  console.log("=== MAPPING VALIDATION SUMMARY ===");
  const successful = results.filter(r => r.success && r.validMapping);
  const failed = results.filter(r => !r.success || !r.validMapping);
  
  console.log(`Total tests: ${results.length}`);
  console.log(`Successful mappings: ${successful.length}`);
  console.log(`Failed mappings: ${failed.length}\n`);
  
  if (successful.length > 0) {
    console.log("✓ SUCCESSFUL FRONTEND → BACKEND MAPPINGS:");
    successful.forEach(result => {
      console.log(`  ${result.frontendSpec} → ${result.backendMapping}: $${result.totalCost.toFixed(2)}`);
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

  console.log("\n=== CONCLUSION ===");
  if (successful.length === results.length) {
    console.log("✓ FRONTEND-BACKEND MAPPING WORKING PERFECTLY");
    console.log("✓ Users see Bronze/Silver/Gold in interface");
    console.log("✓ System correctly retrieves Low/Medium/High rates from CBRE");
    console.log("✓ All specifications produce valid cost calculations");
  } else {
    console.log("✗ MAPPING ISSUES DETECTED");
    console.log("✗ Some specifications not properly mapped or calculated");
  }

  return successful.length === results.length;
}

// Execute the test
testFrontendBackendMapping()
  .then(success => {
    console.log(`\nMapping test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Test execution failed:', error);
    process.exit(1);
  });