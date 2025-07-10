// Complete CBRE Workflow Testing and Validation Protocol
// Testing all aspects of CBRE data access and calculation workflow

import fetch from 'node-fetch';

// Phase 1: Data Source Foundation Testing
async function validateCBREDataIntegrity() {
  console.log("=== CBRE DATA SOURCE VALIDATION ===");
  
  try {
    // Test Fitout data access
    const fitoutResponse = await fetch('http://localhost:5000/api/fitout-costs');
    const fitoutData = await fitoutResponse.json();
    console.log("Fitout data loaded:", fitoutResponse.ok);
    console.log("Fitout sample record:", fitoutData[0] || "NO DATA");
    
    // Test Technology data access  
    const techResponse = await fetch('http://localhost:5000/api/technology-costs');
    const techData = await techResponse.json();
    console.log("Technology data loaded:", techResponse.ok);
    console.log("Technology sample record:", techData[0] || "NO DATA");
    
    // Test Furniture data access
    const furnitureResponse = await fetch('http://localhost:5000/api/furniture-costs');
    const furnitureData = await furnitureResponse.json();
    console.log("Furniture data loaded:", furnitureResponse.ok);
    console.log("Furniture sample record:", furnitureData[0] || "NO DATA");
    
    // Test location availability for critical cities
    const testLocations = ["London", "New York", "Singapore"];
    
    for (const location of testLocations) {
      console.log(`\n--- Testing location: ${location} ---`);
      
      // Check fitout rates
      const locationFitout = fitoutData.find(record => 
        record.city?.toLowerCase().includes(location.toLowerCase()) ||
        record.country?.toLowerCase().includes(location.toLowerCase())
      );
      console.log(`${location} fitout data:`, locationFitout ? "FOUND" : "MISSING");
      
      // Check technology rates
      const locationTech = techData.find(record => 
        record.city?.toLowerCase().includes(location.toLowerCase()) ||
        record.country?.toLowerCase().includes(location.toLowerCase())
      );
      console.log(`${location} technology data:`, locationTech ? "FOUND" : "MISSING");
      
      // Check furniture rates
      const locationFurniture = furnitureData.find(record => 
        record.city?.toLowerCase().includes(location.toLowerCase()) ||
        record.country?.toLowerCase().includes(location.toLowerCase())
      );
      console.log(`${location} furniture data:`, locationFurniture ? "FOUND" : "MISSING");
    }
    
    return {
      fitoutLoaded: fitoutResponse.ok,
      technologyLoaded: techResponse.ok,
      furnitureLoaded: furnitureResponse.ok,
      locationDataAvailable: true
    };
    
  } catch (error) {
    console.error("Data validation error:", error);
    return {
      fitoutLoaded: false,
      technologyLoaded: false,
      furnitureLoaded: false,
      locationDataAvailable: false,
      error: error.message
    };
  }
}

// Phase 2: Individual Component Testing
async function testComponentCalculations() {
  console.log("\n=== TESTING INDIVIDUAL CALCULATIONS ===");
  
  const testInputs = {
    location: "London, United Kingdom",
    country: "United Kingdom",
    city: "London", 
    area: 5000,
    areaUnit: "sqm",
    currency: "USD"
  };
  
  try {
    // Test CBRE-specific calculation logic
    console.log("Testing CBRE calculation with inputs:", testInputs);
    
    // Simulate budget calculation request
    const calculationResponse = await fetch('http://localhost:5000/api/calculate-budget', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project: {
          name: "Test London Office",
          country: testInputs.country,
          city: testInputs.city,
          totalArea: testInputs.area,
          areaUnit: testInputs.areaUnit,
          currency: testInputs.currency
        },
        budget: {
          scope: "Fitout",
          specification: "Medium",
          layout: "Activity",
          primaryDataSource: "CBRE",
          spaceAllocation: {
            'Open workspace': { percentage: 50, area: 2500 },
            'Meeting rooms': { percentage: 25, area: 1250 },
            'Focus areas': { percentage: 15, area: 750 },
            'Support spaces': { percentage: 10, area: 500 }
          }
        }
      })
    });
    
    if (calculationResponse.ok) {
      const result = await calculationResponse.json();
      console.log("CBRE calculation successful:", result);
      console.log("Total cost:", result.totalCost);
      console.log("Cost breakdown:", result.costsBreakdown);
      return { success: true, result };
    } else {
      const error = await calculationResponse.text();
      console.error("CBRE calculation failed:", error);
      return { success: false, error };
    }
    
  } catch (error) {
    console.error("Component calculation test error:", error);
    return { success: false, error: error.message };
  }
}

// Phase 3: End-to-End Workflow Testing
async function testCompleteWorkflow() {
  console.log("\n=== TESTING COMPLETE CBRE WORKFLOW ===");
  
  const testScenarios = [
    {
      name: "London Fitout Only",
      project: {
        name: "London Office Fitout",
        country: "United Kingdom", 
        city: "London",
        totalArea: 3000,
        areaUnit: "sqm",
        currency: "USD"
      },
      budget: {
        scope: "Fitout",
        specification: "Silver",
        layout: "Activity",
        primaryDataSource: "CBRE"
      }
    },
    {
      name: "New York Complete Package",
      project: {
        name: "NYC Complete Office",
        country: "United States",
        city: "New York", 
        totalArea: 8000,
        areaUnit: "sqft",
        currency: "USD"
      },
      budget: {
        scope: "Complete",
        specification: "Gold",
        layout: "Team",
        primaryDataSource: "CBRE"
      }
    },
    {
      name: "Singapore Technology Only",
      project: {
        name: "Singapore Tech Setup",
        country: "Singapore",
        city: "Singapore",
        totalArea: 2000,
        areaUnit: "sqm", 
        currency: "USD"
      },
      budget: {
        scope: "technology",
        specification: "High",
        layout: "Activity",
        primaryDataSource: "CBRE"
      }
    }
  ];
  
  const results = [];
  
  for (const scenario of testScenarios) {
    console.log(`\n--- Testing scenario: ${scenario.name} ---`);
    
    try {
      // Add default space allocation
      const budgetWithDefaults = {
        ...scenario.budget,
        spaceAllocation: {
          'Open workspace': { percentage: 50, area: scenario.project.totalArea * 0.5 },
          'Meeting rooms': { percentage: 25, area: scenario.project.totalArea * 0.25 },
          'Focus areas': { percentage: 15, area: scenario.project.totalArea * 0.15 },
          'Support spaces': { percentage: 10, area: scenario.project.totalArea * 0.1 }
        }
      };
      
      const response = await fetch('http://localhost:5000/api/calculate-budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: scenario.project,
          budget: budgetWithDefaults
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✓ ${scenario.name} - SUCCESS`);
        console.log(`  Total cost: $${result.totalCost?.toLocaleString()}`);
        console.log(`  Cost per ${scenario.project.areaUnit}: $${(result.totalCost / scenario.project.totalArea).toFixed(2)}`);
        
        results.push({
          scenario: scenario.name,
          success: true,
          totalCost: result.totalCost,
          costPerUnit: result.totalCost / scenario.project.totalArea,
          breakdown: result.costsBreakdown
        });
      } else {
        const error = await response.text();
        console.log(`✗ ${scenario.name} - FAILED`);
        console.log(`  Error: ${error}`);
        
        results.push({
          scenario: scenario.name,
          success: false,
          error: error
        });
      }
      
    } catch (error) {
      console.log(`✗ ${scenario.name} - ERROR`);
      console.log(`  Exception: ${error.message}`);
      
      results.push({
        scenario: scenario.name,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// Phase 4: Data Access Diagnostic
async function diagnoseCBREDataAccess() {
  console.log("\n=== DIAGNOSING CBRE DATA ACCESS ===");
  
  try {
    // Check if API endpoints exist and return data
    const endpoints = [
      '/api/fitout-costs',
      '/api/furniture-costs', 
      '/api/technology-costs',
      '/api/budget-template'
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:5000${endpoint}`);
        const data = await response.json();
        
        console.log(`${endpoint}:`);
        console.log(`  Status: ${response.status}`);
        console.log(`  Response: ${response.ok ? 'OK' : 'ERROR'}`);
        console.log(`  Data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
        console.log(`  Records: ${Array.isArray(data) ? data.length : 'N/A'}`);
        
        if (Array.isArray(data) && data.length > 0) {
          console.log(`  Sample record keys: ${Object.keys(data[0])}`);
        }
        
      } catch (error) {
        console.log(`${endpoint}: ERROR - ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error("Diagnostic error:", error);
  }
}

// Main test execution
async function runCBREWorkflowTests() {
  console.log("STARTING COMPREHENSIVE CBRE WORKFLOW TESTING");
  console.log("=".repeat(60));
  
  try {
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Phase 1: Data validation
    const dataValidation = await validateCBREDataIntegrity();
    console.log("\nData validation results:", dataValidation);
    
    // Phase 2: Data access diagnosis
    await diagnoseCBREDataAccess();
    
    // Phase 3: Component calculations
    const componentTest = await testComponentCalculations();
    console.log("\nComponent calculation results:", componentTest);
    
    // Phase 4: Complete workflow
    const workflowResults = await testCompleteWorkflow();
    console.log("\nWorkflow test results:", workflowResults);
    
    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("CBRE WORKFLOW TEST SUMMARY");
    console.log("=".repeat(60));
    
    const successfulScenarios = workflowResults.filter(r => r.success).length;
    const totalScenarios = workflowResults.length;
    
    console.log(`Data validation: ${dataValidation.fitoutLoaded && dataValidation.technologyLoaded ? 'PASS' : 'FAIL'}`);
    console.log(`Component calculations: ${componentTest.success ? 'PASS' : 'FAIL'}`);
    console.log(`Workflow scenarios: ${successfulScenarios}/${totalScenarios} passed`);
    
    if (successfulScenarios < totalScenarios) {
      console.log("\nFAILED SCENARIOS:");
      workflowResults.filter(r => !r.success).forEach(result => {
        console.log(`- ${result.scenario}: ${result.error}`);
      });
    }
    
    console.log("\nRecommendations:");
    if (!dataValidation.fitoutLoaded) {
      console.log("- Fix fitout data loading");
    }
    if (!dataValidation.technologyLoaded) {
      console.log("- Fix technology data loading");
    }
    if (!componentTest.success) {
      console.log("- Fix budget calculation engine");
    }
    if (successfulScenarios < totalScenarios) {
      console.log("- Review failed scenarios for specific issues");
    }
    
    return {
      dataValidation,
      componentTest,
      workflowResults,
      overallSuccess: dataValidation.fitoutLoaded && dataValidation.technologyLoaded && componentTest.success && successfulScenarios === totalScenarios
    };
    
  } catch (error) {
    console.error("Test execution error:", error);
    return { error: error.message };
  }
}

// Run tests
runCBREWorkflowTests().then(results => {
  console.log("\nTest execution complete.");
  process.exit(results.overallSuccess ? 0 : 1);
}).catch(error => {
  console.error("Test execution failed:", error);
  process.exit(1);
});