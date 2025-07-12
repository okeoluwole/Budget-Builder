/**
 * T&T Workflow Comprehensive Testing
 * Tests complete T&T workflow with server-side calculation integration
 * Following successful CBRE pattern
 */

async function testTTWorkflowComprehensive() {
  console.log("=== T&T WORKFLOW COMPREHENSIVE TEST ===");
  
  // Test multiple T&T configurations
  const testConfigurations = [
    {
      name: "London High Specification",
      project: {
        id: 1,
        name: "T&T London Test",
        city: "London",
        country: "United Kingdom",
        totalArea: 1000,
        areaUnit: "sqm",
        currency: "GBP"
      },
      budget: {
        primaryDataSource: "TT",
        scope: "Complete",
        specification: "High (Gold)",
        layout: "Activity"
      }
    },
    {
      name: "New York Medium Specification",
      project: {
        id: 2,
        name: "T&T New York Test",
        city: "New York",
        country: "United States",
        totalArea: 1500,
        areaUnit: "sqm",
        currency: "USD"
      },
      budget: {
        primaryDataSource: "TT",
        scope: "Complete",
        specification: "Medium (Silver)",
        layout: "Activity"
      }
    },
    {
      name: "Singapore Low Specification",
      project: {
        id: 3,
        name: "T&T Singapore Test",
        city: "Singapore",
        country: "Singapore",
        totalArea: 800,
        areaUnit: "sqm",
        currency: "SGD"
      },
      budget: {
        primaryDataSource: "TT",
        scope: "Complete",
        specification: "Low (Bronze)",
        layout: "Activity"
      }
    }
  ];
  
  const results = [];
  
  for (const config of testConfigurations) {
    console.log(`\n--- Testing: ${config.name} ---`);
    
    try {
      // Make API call to calculate budget
      const response = await fetch('http://localhost:5000/api/calculate-budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project: config.project,
          budget: config.budget,
          budgetStructure: {
            specification: config.budget.specification
          }
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Validate result structure
      const validation = {
        hasTotal: result.totalCost > 0,
        hasBreakdown: !!result.costsBreakdown,
        componentCount: result.costsBreakdown ? Object.keys(result.costsBreakdown).length : 0,
        hasConstruction: !!result.costsBreakdown?.['Construction'],
        hasLooseFurniture: !!result.costsBreakdown?.['Loose Furniture'],
        hasAudioVisual: !!result.costsBreakdown?.['Audio-Visual'],
        hasProfessionalFees: !!result.costsBreakdown?.['Professional Fees']
      };
      
      // Calculate component rates
      const area = config.project.totalArea;
      const componentRates = {};
      
      if (result.costsBreakdown) {
        Object.entries(result.costsBreakdown).forEach(([component, cost]) => {
          componentRates[component] = Math.round(cost / area);
        });
      }
      
      console.log(`✅ ${config.name} SUCCESS`);
      console.log(`   Total Cost: ${result.totalCost.toLocaleString()} ${result.localCurrencyCode}`);
      console.log(`   Rate: ${Math.round(result.totalCost / area)}/${config.project.areaUnit}`);
      console.log(`   Components: ${validation.componentCount}`);
      
      // Log component breakdown
      if (result.costsBreakdown) {
        console.log(`   Component Breakdown:`);
        Object.entries(result.costsBreakdown).forEach(([component, cost]) => {
          const rate = Math.round(cost / area);
          console.log(`     - ${component}: ${cost.toLocaleString()} (${rate}/${config.project.areaUnit})`);
        });
      }
      
      results.push({
        name: config.name,
        success: true,
        result,
        validation,
        componentRates,
        totalRate: Math.round(result.totalCost / area)
      });
      
    } catch (error) {
      console.log(`❌ ${config.name} FAILED: ${error.message}`);
      results.push({
        name: config.name,
        success: false,
        error: error.message
      });
    }
  }
  
  // Generate comprehensive report
  console.log("\n=== T&T WORKFLOW VALIDATION REPORT ===");
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`\n📊 Test Results:`);
  console.log(`✅ Successful: ${successful.length}/${testConfigurations.length}`);
  console.log(`❌ Failed: ${failed.length}/${testConfigurations.length}`);
  
  if (successful.length > 0) {
    console.log(`\n🔧 Component Validation:`);
    successful.forEach(test => {
      console.log(`\n${test.name}:`);
      console.log(`  Construction: ${test.validation.hasConstruction ? '✅' : '❌'}`);
      console.log(`  Loose Furniture: ${test.validation.hasLooseFurniture ? '✅' : '❌'}`);
      console.log(`  Audio-Visual: ${test.validation.hasAudioVisual ? '✅' : '❌'}`);
      console.log(`  Professional Fees: ${test.validation.hasProfessionalFees ? '✅' : '❌'}`);
      console.log(`  Total Components: ${test.validation.componentCount}`);
    });
    
    console.log(`\n💰 Rate Analysis:`);
    successful.forEach(test => {
      console.log(`\n${test.name} Component Rates:`);
      Object.entries(test.componentRates).forEach(([component, rate]) => {
        console.log(`  ${component}: ${rate}/sqm`);
      });
      console.log(`  Total Rate: ${test.totalRate}/sqm`);
    });
  }
  
  if (failed.length > 0) {
    console.log(`\n⚠️  Failed Tests:`);
    failed.forEach(test => {
      console.log(`  ${test.name}: ${test.error}`);
    });
  }
  
  // Component Coverage Analysis
  const componentCoverage = {
    construction: successful.filter(t => t.validation.hasConstruction).length,
    looseFurniture: successful.filter(t => t.validation.hasLooseFurniture).length,
    audioVisual: successful.filter(t => t.validation.hasAudioVisual).length,
    professionalFees: successful.filter(t => t.validation.hasProfessionalFees).length
  };
  
  console.log(`\n🎯 Component Coverage:`);
  Object.entries(componentCoverage).forEach(([component, count]) => {
    const percentage = successful.length > 0 ? (count / successful.length) * 100 : 0;
    console.log(`  ${component}: ${count}/${successful.length} (${percentage.toFixed(1)}%)`);
  });
  
  // Final assessment
  const successRate = (successful.length / testConfigurations.length) * 100;
  const allComponentsPresent = successful.length > 0 && 
    successful.every(t => t.validation.componentCount === 4);
  
  console.log(`\n🏆 FINAL ASSESSMENT:`);
  console.log(`Success Rate: ${successRate.toFixed(1)}%`);
  console.log(`All Components Present: ${allComponentsPresent ? '✅' : '❌'}`);
  console.log(`Loose Furniture Rate Display: ${componentCoverage.looseFurniture > 0 ? '✅ FIXED' : '❌ MISSING'}`);
  
  if (successRate >= 80 && allComponentsPresent) {
    console.log(`\n🎉 T&T WORKFLOW VALIDATION PASSED`);
    console.log(`✅ Server-side calculation engine working`);
    console.log(`✅ Component breakdown complete`);
    console.log(`✅ Loose furniture rate display functional`);
  } else {
    console.log(`\n⚠️  T&T WORKFLOW NEEDS ATTENTION`);
    console.log(`🔍 Check component coverage and rate calculations`);
  }
  
  return {
    successRate,
    allComponentsPresent,
    componentCoverage,
    results
  };
}

// Run comprehensive test
testTTWorkflowComprehensive().catch(console.error);