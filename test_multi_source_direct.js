/**
 * Direct Multi-Source API Testing
 * Tests the multi-guide endpoint without authentication complexity
 */

async function testDirectMultiSource() {
  console.log('🧪 DIRECT MULTI-SOURCE API TESTING');
  console.log('===================================\n');

  const testCases = [
    {
      name: "CBRE→T&T London",
      payload: {
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
      }
    },
    {
      name: "T&T→CBRE Singapore", 
      payload: {
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
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`);
    console.log(`Primary: ${testCase.payload.primaryGuide} → Secondary: ${testCase.payload.comparisonGuides.join(', ')}`);
    
    try {
      const response = await fetch('http://localhost:5000/api/calculate-multi-guide', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.payload)
      });

      const responseText = await response.text();
      console.log(`Status: ${response.status}`);
      
      if (response.status === 401) {
        console.log('❌ Authentication required - test cannot proceed without login');
        continue;
      }
      
      if (response.status === 200) {
        try {
          const result = JSON.parse(responseText);
          
          // Check response structure
          const hasSuccess = result.success !== undefined;
          const hasData = result.data !== undefined; 
          const hasPrimary = (hasData ? result.data.primary : result.primary) !== undefined;
          const hasComparisons = (hasData ? result.data.comparisons : result.comparisons) !== undefined;
          
          console.log(`✅ Valid response structure:`);
          console.log(`   Success wrapper: ${hasSuccess ? '✓' : '✗'}`);
          console.log(`   Data object: ${hasData ? '✓' : '✗'}`);
          console.log(`   Primary result: ${hasPrimary ? '✓' : '✗'}`);
          console.log(`   Comparisons: ${hasComparisons ? '✓' : '✗'}`);
          
          // Extract costs
          const primary = hasData ? result.data.primary : result.primary;
          const comparisons = hasData ? result.data.comparisons : result.comparisons;
          
          if (primary?.result?.totalCost) {
            console.log(`   Primary cost: $${primary.result.totalCost.toFixed(2)}`);
          }
          
          if (comparisons && comparisons.length > 0) {
            comparisons.forEach((comp, i) => {
              const cost = comp.result?.totalCost;
              const assumptions = comp.assumptions?.length || 0;
              console.log(`   Comparison ${i+1}: $${cost ? cost.toFixed(2) : 'N/A'} (${assumptions} assumptions)`);
            });
          }
          
        } catch (parseError) {
          console.log(`❌ JSON parsing failed: ${parseError.message}`);
          console.log(`Raw response: ${responseText.substring(0, 100)}...`);
        }
      } else {
        console.log(`❌ API error: ${responseText}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('\n🎯 CONCLUSION:');
  console.log('If both tests show "Authentication required", the API is working but needs login');
  console.log('If tests show valid response structures and costs, multi-source comparison is functional');
  console.log('If tests show API errors or parsing failures, there are implementation issues');
}

// Run the test
testDirectMultiSource();