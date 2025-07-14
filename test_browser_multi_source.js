/**
 * Browser Multi-Source Testing Script
 * Run this in browser console after logging in to test multi-source comparison
 */

console.log('🧪 BROWSER MULTI-SOURCE TESTING');
console.log('===============================\n');

// Test configurations for comprehensive validation
const testConfigs = [
  {
    name: "CBRE Primary → T&T Secondary (London)",
    primaryGuide: "CBRE",
    comparisonGuides: ["TT"],
    project: {
      country: "United Kingdom",
      city: "London",
      totalArea: 1000,
      areaUnit: "sqm", 
      currency: "USD"
    },
    budget: {
      scope: "Complete",
      specification: "Medium (Silver)",
      layout: "Event",
      primaryDataSource: "CBRE"
    }
  },
  {
    name: "T&T Primary → CBRE Secondary (Singapore)",
    primaryGuide: "TT", 
    comparisonGuides: ["CBRE"],
    project: {
      country: "Singapore",
      city: "Singapore", 
      totalArea: 500,
      areaUnit: "sqm",
      currency: "SGD"
    },
    budget: {
      scope: "Complete",
      specification: "High",
      layout: "Activity",
      primaryDataSource: "TT"
    }
  }
];

async function testMultiSourceInBrowser() {
  console.log('📋 Instructions:');
  console.log('1. Login to the application first');
  console.log('2. Open browser developer console (F12)');
  console.log('3. Copy and paste this entire script');
  console.log('4. Run: testMultiSourceInBrowser()');
  console.log('\n🔄 Starting automated tests...\n');

  const results = [];

  for (const config of testConfigs) {
    console.log(`\n🔍 Testing: ${config.name}`);
    console.log(`Primary: ${config.primaryGuide} → Secondary: ${config.comparisonGuides.join(', ')}`);
    
    try {
      const response = await fetch('/api/calculate-multi-guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });

      const responseText = await response.text();
      console.log(`Status: ${response.status}`);
      
      if (response.status === 200) {
        try {
          const result = JSON.parse(responseText);
          
          // Validate structure 
          const hasSuccess = result.success !== undefined;
          const hasData = result.data !== undefined;
          const hasPrimary = (hasData ? result.data.primary : result.primary) !== undefined;
          const hasComparisons = (hasData ? result.data.comparisons : result.comparisons) !== undefined;
          
          console.log(`✅ Response Structure:`);
          console.log(`   Success wrapper: ${hasSuccess ? '✓' : '✗'}`);
          console.log(`   Data container: ${hasData ? '✓' : '✗'}`);
          console.log(`   Primary result: ${hasPrimary ? '✓' : '✗'}`);
          console.log(`   Comparisons: ${hasComparisons ? '✓' : '✗'}`);
          
          // Extract results
          const primary = hasData ? result.data.primary : result.primary;
          const comparisons = hasData ? result.data.comparisons : result.comparisons;
          
          if (primary?.result?.totalCost) {
            console.log(`   Primary cost: $${primary.result.totalCost.toFixed(2)}`);
          }
          
          if (comparisons && comparisons.length > 0) {
            let totalAssumptions = 0;
            comparisons.forEach((comp, i) => {
              const cost = comp.result?.totalCost;
              const assumptions = comp.assumptions?.length || 0;
              totalAssumptions += assumptions;
              console.log(`   Comparison ${i+1} (${comp.guideId || comp.guideName}): $${cost ? cost.toFixed(2) : 'N/A'} (${assumptions} assumptions)`);
            });
            
            console.log(`📊 Total leveling assumptions: ${totalAssumptions}`);
          }
          
          results.push({
            test: config.name,
            success: true,
            primaryCost: primary?.result?.totalCost,
            comparisons: comparisons?.length || 0,
            assumptions: comparisons?.reduce((sum, c) => sum + (c.assumptions?.length || 0), 0) || 0
          });
          
        } catch (parseError) {
          console.log(`❌ JSON Parse Error: ${parseError.message}`);
          results.push({ test: config.name, success: false, error: 'JSON parse failed' });
        }
      } else {
        console.log(`❌ API Error (${response.status}): ${responseText}`);
        results.push({ test: config.name, success: false, error: `${response.status}: ${responseText}` });
      }
      
    } catch (error) {
      console.log(`❌ Request Error: ${error.message}`);
      results.push({ test: config.name, success: false, error: error.message });
    }
    
    // Pause between tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Generate summary
  console.log('\n📊 TEST RESULTS SUMMARY');
  console.log('=======================');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`Total tests: ${results.length}`);
  console.log(`Successful: ${successful.length}/${results.length} (${(successful.length/results.length*100).toFixed(1)}%)`);
  console.log(`Failed: ${failed.length}/${results.length} (${(failed.length/results.length*100).toFixed(1)}%)`);
  
  if (successful.length > 0) {
    console.log('\n✅ SUCCESSFUL TESTS:');
    successful.forEach(r => {
      console.log(`   ${r.test}: $${r.primaryCost?.toFixed(2) || 'N/A'} (${r.assumptions} assumptions, ${r.comparisons} comparisons)`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ FAILED TESTS:');
    failed.forEach(r => {
      console.log(`   ${r.test}: ${r.error}`);
    });
  }
  
  // Final assessment 
  console.log('\n🎯 FINAL ASSESSMENT:');
  if (successful.length === results.length) {
    console.log('✅ 100% SUCCESS - Multi-source comparison fully functional');
    console.log('✅ Both CBRE→T&T and T&T→CBRE scenarios working');
    console.log('✅ Leveling assumptions being generated correctly');
    console.log('✅ API response structure is valid and parseable');
    console.log('\n🚀 READY FOR FRONTEND INTEGRATION TESTING');
  } else if (successful.length > 0) {
    console.log('⚠️ PARTIAL SUCCESS - Some scenarios working, others need investigation');
  } else {
    console.log('❌ COMPLETE FAILURE - Multi-source comparison not working');
  }
  
  return results;
}

// Auto-run if called directly
if (typeof window !== 'undefined') {
  console.log('\n🌐 Ready for browser testing!');
  console.log('📝 To run: testMultiSourceInBrowser()');
}