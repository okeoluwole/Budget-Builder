/**
 * T&T Workflow Comprehensive Testing
 * Tests complete T&T workflow with server-side calculation integration
 * Following successful CBRE pattern
 */

import fs from 'fs';
import path from 'path';

async function testTTWorkflowComprehensive() {
  console.log("=== T&T WORKFLOW COMPREHENSIVE TEST ===");
  
  try {
    // Test 1: London Complete Package High Specification
    console.log("\n1. Testing London Complete Package High Specification...");
    const londonProject = {
      id: 1,
      name: "T&T London Test",
      location: "London",
      city: "London", 
      country: "United Kingdom",
      totalArea: 1000,
      areaUnit: "sqm",
      currency: "GBP"
    };
    
    const londonBudget = {
      id: 1,
      projectId: 1,
      primaryDataSource: "TT",
      scope: "Complete",
      specification: "High (Gold)", // T&T specification mapping
      layout: "Activity", // T&T layout
      status: "draft"
    };
    
    // Import server calculation function
    const { performServerSideBudgetCalculation } = await import('./server/routes.js');
    
    console.log("Calling T&T server-side calculation...");
    const londonResult = await performServerSideBudgetCalculation(
      londonProject, 
      londonBudget, 
      { specification: "High (Gold)" }
    );
    
    console.log("T&T London Result:", {
      totalCost: londonResult.totalCost,
      costsBreakdown: londonResult.costsBreakdown,
      datasetInfo: londonResult.datasetInfo,
      localCurrencyCode: londonResult.localCurrencyCode
    });
    
    // Validate T&T London results
    const londonValidation = {
      hasCostsBreakdown: !!londonResult.costsBreakdown,
      hasConstructionCosts: !!(londonResult.costsBreakdown && londonResult.costsBreakdown['CONSTRUCTION COSTS']),
      hasFurnitureCosts: !!(londonResult.costsBreakdown && londonResult.costsBreakdown['LOOSE FURNITURE COSTS']),
      hasAudioVisualCosts: !!(londonResult.costsBreakdown && londonResult.costsBreakdown['AUDIO-VISUAL COSTS']),
      hasProfessionalFees: !!(londonResult.costsBreakdown && londonResult.costsBreakdown['PROFESSIONAL FEES']),
      isUSDCurrency: londonResult.localCurrencyCode === 'USD',
      totalCostValid: londonResult.totalCost > 0
    };
    
    console.log("London T&T Validation:", londonValidation);
    
    // Test 2: New York Construction Only Medium Specification 
    console.log("\n2. Testing New York Construction Only Medium Specification...");
    const nyProject = {
      id: 2,
      name: "T&T New York Test",
      location: "New York",
      city: "New York",
      country: "United States",
      totalArea: 1500,
      areaUnit: "sqm", 
      currency: "USD"
    };
    
    const nyBudget = {
      id: 2,
      projectId: 2,
      primaryDataSource: "TT",
      scope: "Construction",
      specification: "Medium (Silver)",
      layout: "Cellular",
      status: "draft"
    };
    
    console.log("Calling T&T server-side calculation for New York...");
    const nyResult = await performServerSideBudgetCalculation(
      nyProject,
      nyBudget,
      { specification: "Medium (Silver)" }
    );
    
    console.log("T&T New York Result:", {
      totalCost: nyResult.totalCost,
      costsBreakdown: nyResult.costsBreakdown,
      constructionCost: nyResult.constructionCost,
      datasetInfo: nyResult.datasetInfo
    });
    
    // Test 3: Singapore Furniture Only Low Specification
    console.log("\n3. Testing Singapore Furniture Only Low Specification...");
    const sgProject = {
      id: 3,
      name: "T&T Singapore Test",
      location: "Singapore",
      city: "Singapore",
      country: "Singapore",
      totalArea: 800,
      areaUnit: "sqm",
      currency: "SGD"
    };
    
    const sgBudget = {
      id: 3,
      projectId: 3,
      primaryDataSource: "TT", 
      scope: "LooseFurniture",
      specification: "Low (Bronze)",
      layout: "Open Plan",
      status: "draft"
    };
    
    console.log("Calling T&T server-side calculation for Singapore...");
    const sgResult = await performServerSideBudgetCalculation(
      sgProject,
      sgBudget,
      { specification: "Low (Bronze)" }
    );
    
    console.log("T&T Singapore Result:", {
      totalCost: sgResult.totalCost,
      costsBreakdown: sgResult.costsBreakdown,
      furnitureCost: sgResult.furnitureCost,
      datasetInfo: sgResult.datasetInfo
    });
    
    // Generate comprehensive validation report
    console.log("\n=== T&T COMPREHENSIVE VALIDATION REPORT ===");
    
    const allTests = [
      { name: "London Complete Package", result: londonResult, validation: londonValidation },
      { name: "New York Construction", result: nyResult, scope: "Construction" },
      { name: "Singapore Furniture", result: sgResult, scope: "Furniture" }
    ];
    
    let passCount = 0;
    let totalTests = allTests.length;
    
    allTests.forEach((test, index) => {
      const hasValidResult = test.result && test.result.totalCost > 0;
      const hasBreakdown = test.result && test.result.costsBreakdown;
      const isUSD = test.result && test.result.localCurrencyCode === 'USD';
      
      const testPassed = hasValidResult && hasBreakdown && isUSD;
      
      console.log(`\nTest ${index + 1}: ${test.name}`);
      console.log(`✓ Valid Total Cost: ${hasValidResult ? 'PASS' : 'FAIL'} (${test.result?.totalCost || 0})`);
      console.log(`✓ Has Breakdown: ${hasBreakdown ? 'PASS' : 'FAIL'}`);
      console.log(`✓ USD Currency: ${isUSD ? 'PASS' : 'FAIL'} (${test.result?.localCurrencyCode || 'N/A'})`);
      console.log(`Overall: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
      
      if (testPassed) passCount++;
    });
    
    const successRate = (passCount / totalTests) * 100;
    console.log(`\n=== FINAL T&T VALIDATION SUMMARY ===`);
    console.log(`✅ Tests Passed: ${passCount}/${totalTests} (${successRate}%)`);
    console.log(`📊 T&T Workflow Status: ${successRate === 100 ? 'FULLY OPERATIONAL' : 'NEEDS ATTENTION'}`);
    
    // Component coverage analysis
    console.log(`\n=== T&T COMPONENT COVERAGE ANALYSIS ===`);
    const componentKeys = ['CONSTRUCTION COSTS', 'LOOSE FURNITURE COSTS', 'AUDIO-VISUAL COSTS', 'PROFESSIONAL FEES'];
    
    componentKeys.forEach(key => {
      const londonHas = londonResult.costsBreakdown && londonResult.costsBreakdown[key];
      console.log(`${key}: ${londonHas ? '✅ Available' : '❌ Missing'} (${londonHas ? Math.round(londonResult.costsBreakdown[key]) : 0})`);
    });
    
    if (successRate === 100) {
      console.log(`\n🎉 T&T WORKFLOW VALIDATION COMPLETE - ALL SYSTEMS OPERATIONAL!`);
      console.log(`🔧 Server-side calculation engine working correctly`);
      console.log(`💰 USD currency standardization confirmed`);
      console.log(`📈 Component breakdown generation validated`);
    } else {
      console.log(`\n⚠️  T&T WORKFLOW NEEDS REFINEMENT`);
      console.log(`🔍 Check component calculation logic`);
      console.log(`🛠️  Verify T&T data source integration`);
    }
    
  } catch (error) {
    console.error("T&T Workflow Test Error:", error);
    console.log(`\n❌ CRITICAL ERROR IN T&T WORKFLOW`);
    console.log(`🔧 Error: ${error.message}`);
    console.log(`📋 Recommendation: Check T&T data source and server calculation logic`);
  }
}

// Export for ES modules
export { testTTWorkflowComprehensive };

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  testTTWorkflowComprehensive().catch(console.error);
}