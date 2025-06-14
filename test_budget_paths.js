// Comprehensive test for T&T, CBRE, and comparison budget calculation paths
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

// Test project data
const testProject = {
  name: "Budget Path Test Project",
  reference: "TEST-001",
  country: "United Kingdom", 
  city: "London",
  totalArea: 1000,
  areaUnit: "sqm",
  currency: "GBP"
};

// Test budget configurations
const testConfigurations = [
  {
    name: "T&T Complete Package",
    primaryDataSource: "TT",
    scope: ["Complete"],
    specification: "Medium",
    ttComponentSpecs: {
      Construction: "Medium",
      LooseFurniture: "High", 
      AudioVisual: "Medium",
      ProfessionalFees: "Low"
    }
  },
  {
    name: "T&T Construction Only",
    primaryDataSource: "TT", 
    scope: ["Construction"],
    specification: "High",
    ttComponentSpecs: {
      Construction: "High"
    }
  },
  {
    name: "CBRE Fitout + Furniture",
    primaryDataSource: "CBRE",
    scope: ["Fitout", "Furniture"],
    specification: "Medium"
  },
  {
    name: "CBRE Construction Only", 
    primaryDataSource: "CBRE",
    scope: ["Fitout"],
    specification: "High"
  }
];

async function createTestProject() {
  console.log('\n=== Creating Test Project ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProject)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to create project: ${response.status}`);
    }
    
    const project = await response.json();
    console.log(`✓ Created project: ${project.name} (ID: ${project.id})`);
    return project;
  } catch (error) {
    console.error('✗ Project creation failed:', error.message);
    throw error;
  }
}

async function testBudgetCalculation(project, config) {
  console.log(`\n=== Testing: ${config.name} ===`);
  
  try {
    // Create budget
    const budgetData = {
      projectId: project.id,
      name: config.name,
      scope: config.scope.join(','),
      specification: config.specification,
      layout: "Standard Office",
      primaryDataSource: config.primaryDataSource,
      ttComponentSpecs: config.ttComponentSpecs || {}
    };
    
    console.log('Budget configuration:', JSON.stringify(budgetData, null, 2));
    
    const response = await fetch(`${BASE_URL}/api/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(budgetData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Budget creation failed: ${response.status} - ${errorText}`);
    }
    
    const budget = await response.json();
    console.log(`✓ Created budget: ${budget.name} (ID: ${budget.id})`);
    
    // Test budget calculation by fetching results
    const resultsResponse = await fetch(`${BASE_URL}/api/budgets/${budget.id}`);
    
    if (!resultsResponse.ok) {
      throw new Error(`Failed to fetch budget results: ${resultsResponse.status}`);
    }
    
    const results = await resultsResponse.json();
    
    // Validate results
    if (!results.totalCost || results.totalCost <= 0) {
      throw new Error('Invalid total cost calculated');
    }
    
    console.log(`✓ Total Cost: £${results.totalCost?.toLocaleString()}`);
    console.log(`✓ Cost per sqm: £${(results.totalCost / project.totalArea)?.toFixed(2)}`);
    
    if (results.costsBreakdown) {
      console.log('✓ Cost breakdown generated');
      Object.entries(results.costsBreakdown).forEach(([category, cost]) => {
        console.log(`  - ${category}: £${cost?.toLocaleString()}`);
      });
    }
    
    return { budget, results, success: true };
    
  } catch (error) {
    console.error(`✗ ${config.name} failed:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testMultiSourceComparison(project) {
  console.log('\n=== Testing Multi-Source Comparison ===');
  
  try {
    // Create comparison budget
    const comparisonData = {
      projectId: project.id,
      name: "T&T vs CBRE Comparison",
      scope: "Complete",
      specification: "Medium", 
      layout: "Standard Office",
      primaryDataSource: "TT",
      isComparisonEnabled: true,
      comparisonSources: ["TT", "CBRE"],
      ttComponentSpecs: {
        Construction: "Medium",
        LooseFurniture: "Medium",
        AudioVisual: "Medium", 
        ProfessionalFees: "Medium"
      }
    };
    
    console.log('Comparison configuration:', JSON.stringify(comparisonData, null, 2));
    
    const response = await fetch(`${BASE_URL}/api/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comparisonData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Comparison budget creation failed: ${response.status} - ${errorText}`);
    }
    
    const budget = await response.json();
    console.log(`✓ Created comparison budget: ${budget.name} (ID: ${budget.id})`);
    
    // Test comparison calculation
    const resultsResponse = await fetch(`${BASE_URL}/api/budgets/${budget.id}`);
    
    if (!resultsResponse.ok) {
      throw new Error(`Failed to fetch comparison results: ${resultsResponse.status}`);
    }
    
    const results = await resultsResponse.json();
    
    // Validate comparison results
    if (!results.totalCost || results.totalCost <= 0) {
      throw new Error('Invalid comparison total cost');
    }
    
    console.log(`✓ Comparison Total Cost: £${results.totalCost?.toLocaleString()}`);
    
    if (results.comparisonData) {
      console.log('✓ Multi-source comparison data generated');
      console.log(`  - T&T Total: £${results.comparisonData.tt?.total?.toLocaleString()}`);
      console.log(`  - CBRE Total: £${results.comparisonData.cbre?.total?.toLocaleString()}`);
      console.log(`  - Variance: ${results.comparisonData.comparison?.percentageVariance?.toFixed(1)}%`);
    }
    
    return { budget, results, success: true };
    
  } catch (error) {
    console.error('✗ Multi-source comparison failed:', error.message);
    return { success: false, error: error.message };
  }
}

async function testSpecificPaths() {
  console.log('\n=== Testing Specific Data Source Paths ===');
  
  // Test T&T component-specific specifications
  console.log('\n--- T&T Component-Specific Test ---');
  try {
    const project = await createTestProject();
    
    const ttConfig = {
      projectId: project.id,
      name: "T&T Component Test",
      scope: "Complete", 
      specification: "Medium",
      primaryDataSource: "TT",
      ttComponentSpecs: {
        Construction: "High",    // Different quality levels
        LooseFurniture: "Low",
        AudioVisual: "Medium", 
        ProfessionalFees: "High"
      }
    };
    
    const response = await fetch(`${BASE_URL}/api/budgets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ttConfig)
    });
    
    if (response.ok) {
      const budget = await response.json();
      console.log('✓ T&T component-specific specifications working');
      console.log(`  Budget ID: ${budget.id}, Total: £${budget.totalCost?.toLocaleString()}`);
    } else {
      console.error('✗ T&T component-specific test failed');
    }
  } catch (error) {
    console.error('✗ T&T component test error:', error.message);
  }
  
  // Test CBRE with data borrowing
  console.log('\n--- CBRE Data Borrowing Test ---');
  try {
    const project = await createTestProject();
    
    const cbreConfig = {
      projectId: project.id,
      name: "CBRE with T&T Supplements",
      scope: "Complete", // This should trigger borrowing for AV and Professional Fees
      specification: "Medium",
      primaryDataSource: "CBRE"
    };
    
    const response = await fetch(`${BASE_URL}/api/budgets`, {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cbreConfig)
    });
    
    if (response.ok) {
      const budget = await response.json();
      console.log('✓ CBRE with T&T data borrowing working');
      console.log(`  Budget ID: ${budget.id}, Total: £${budget.totalCost?.toLocaleString()}`);
    } else {
      console.error('✗ CBRE data borrowing test failed');
    }
  } catch (error) {
    console.error('✗ CBRE data borrowing test error:', error.message);
  }
}

async function runFullTest() {
  console.log('🧪 Starting Comprehensive Budget Path Testing');
  console.log('================================================');
  
  const results = {
    projectCreation: false,
    configurations: [],
    comparison: false,
    specificPaths: false
  };
  
  try {
    // Create test project
    const project = await createTestProject();
    results.projectCreation = true;
    
    // Test each configuration
    for (const config of testConfigurations) {
      const result = await testBudgetCalculation(project, config);
      results.configurations.push({
        name: config.name,
        success: result.success,
        error: result.error
      });
    }
    
    // Test multi-source comparison
    const comparisonResult = await testMultiSourceComparison(project);
    results.comparison = comparisonResult.success;
    
    // Test specific paths
    await testSpecificPaths();
    results.specificPaths = true;
    
  } catch (error) {
    console.error('✗ Test suite failed:', error.message);
  }
  
  // Summary
  console.log('\n📊 TEST SUMMARY');
  console.log('================');
  console.log(`Project Creation: ${results.projectCreation ? '✓' : '✗'}`);
  console.log(`Multi-Source Comparison: ${results.comparison ? '✓' : '✗'}`);
  console.log(`Specific Path Tests: ${results.specificPaths ? '✓' : '✗'}`);
  
  console.log('\nConfiguration Tests:');
  results.configurations.forEach(config => {
    console.log(`  ${config.name}: ${config.success ? '✓' : '✗'} ${config.error ? `(${config.error})` : ''}`);
  });
  
  const successCount = results.configurations.filter(c => c.success).length;
  const totalTests = results.configurations.length;
  
  console.log(`\nOverall: ${successCount}/${totalTests} configurations passed`);
  
  if (successCount === totalTests && results.comparison && results.specificPaths) {
    console.log('🎉 All tests passed! Budget calculation paths are working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Review the errors above for debugging.');
  }
}

// Run the test
runFullTest().catch(console.error);