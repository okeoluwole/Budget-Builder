// Test script to debug JLL calculation issues
const fs = require('fs');
const path = require('path');

// Mock project data for testing
const testProject = {
  id: 1,
  name: "Test JLL Project",
  country: "United States",
  city: "New York",
  totalArea: 10000,
  areaUnit: "sqft",
  inflationRate: 3.0
};

// Test JLL options
const testOptions = {
  layoutType: "High spatial variety",
  qualityLevel: "Medium",
  scope: "Fitout"
};

console.log("=== JLL CALCULATION DEBUG TEST ===");
console.log("Test Project:", testProject);
console.log("Test Options:", testOptions);

// Import and test the JLL calculator
try {
  // Since we're testing from root, adjust the path
  const JLLCalculator = require('./client/src/utils/jllCalculator.ts');
  
  if (JLLCalculator && JLLCalculator.default) {
    const calculator = JLLCalculator.default;
    console.log("\nJLL Calculator loaded successfully");
    
    // Test the calculation
    const result = calculator.calculate(
      testProject,
      testOptions.layoutType,
      testOptions.qualityLevel,
      testOptions.scope
    );
    
    console.log("\n=== CALCULATION RESULT ===");
    console.log("Success:", result.success);
    console.log("Total Budget:", result.totalBudget);
    console.log("Fitout Cost:", result.fitoutCost);
    console.log("Furniture Cost:", result.furnitureCost);
    console.log("Base Cost:", result.baseCost);
    console.log("Adjusted Rate:", result.adjustedRate);
    console.log("Area in SQM:", result.areaInSqm);
    
    if (result.error) {
      console.log("ERROR:", result.error);
    }
    
    console.log("\n=== BREAKDOWN ===");
    console.log(JSON.stringify(result.costsBreakdown, null, 2));
    
  } else {
    console.error("Failed to load JLL Calculator");
  }
  
} catch (error) {
  console.error("Error loading JLL Calculator:", error.message);
  console.log("\nThis is expected since we're testing a TypeScript file with Node.js");
  console.log("Let's check the actual implementation instead...");
}