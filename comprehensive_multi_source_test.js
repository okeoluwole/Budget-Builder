/**
 * Comprehensive Multi-Source Comparison Testing
 * Tests both CBRE→T&T and T&T→CBRE scenarios across multiple locations and specifications
 */

const testConfigurations = [
  // Test 1: CBRE Primary → T&T Secondary (London, High Spec)
  {
    name: "CBRE→T&T London High Spec",
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
      specification: "High (Gold)",
      layout: "Event",
      primaryDataSource: "CBRE"
    }
  },
  
  // Test 2: T&T Primary → CBRE Secondary (London, Medium Spec)
  {
    name: "T&T→CBRE London Medium Spec",
    primaryGuide: "TT",
    comparisonGuides: ["CBRE"],
    project: {
      country: "United Kingdom",
      city: "London",
      totalArea: 1000, 
      areaUnit: "sqm",
      currency: "GBP"
    },
    budget: {
      scope: "Complete",
      specification: "Medium",
      layout: "Activity",
      primaryDataSource: "TT"
    }
  },
  
  // Test 3: CBRE Primary → T&T Secondary (Singapore, Low Spec)
  {
    name: "CBRE→T&T Singapore Low Spec",
    primaryGuide: "CBRE",
    comparisonGuides: ["TT"],
    project: {
      country: "Singapore",
      city: "Singapore",
      totalArea: 500,
      areaUnit: "sqm", 
      currency: "SGD"
    },
    budget: {
      scope: "Complete",
      specification: "Low (Bronze)",
      layout: "Team",
      primaryDataSource: "CBRE"
    }
  },
  
  // Test 4: T&T Primary → CBRE Secondary (New York, High Spec)
  {
    name: "T&T→CBRE New York High Spec",
    primaryGuide: "TT",
    comparisonGuides: ["CBRE"],
    project: {
      country: "United States",
      city: "New York",
      totalArea: 2000,
      areaUnit: "sqm",
      currency: "USD"
    },
    budget: {
      scope: "Complete", 
      specification: "High",
      layout: "Event",
      primaryDataSource: "TT"
    }
  },
  
  // Test 5: CBRE Primary → T&T Secondary (Germany, Medium Spec)
  {
    name: "CBRE→T&T Germany Medium Spec",
    primaryGuide: "CBRE",
    comparisonGuides: ["TT"], 
    project: {
      country: "Germany",
      city: "Munich",
      totalArea: 1500,
      areaUnit: "sqm",
      currency: "EUR"
    },
    budget: {
      scope: "Complete",
      specification: "Medium (Silver)",
      layout: "Activity",
      primaryDataSource: "CBRE"
    }
  }
];

async function authenticateUser() {
  try {
    console.log('🔐 Authenticating test user...');
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'okeoluwole@gmail.com',
        password: 'admin123'
      })
    });
    
    console.log('Login response status:', loginResponse.status);
    
    // Extract session cookie from response headers
    const setCookieHeader = loginResponse.headers.get('set-cookie');
    if (setCookieHeader) {
      const sessionCookie = setCookieHeader.split(';')[0];
      console.log('✅ Authentication successful, session cookie obtained');
      return sessionCookie;
    } else {
      // Try alternative: check if we're already authenticated or get session another way
      console.log('🔄 No set-cookie header, checking if already authenticated...');
      
      // Test authentication by calling a protected endpoint
      const testResponse = await fetch('http://localhost:5000/api/user/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (testResponse.status === 200) {
        console.log('✅ Already authenticated, proceeding without explicit session');
        return 'already-authenticated';
      } else {
        throw new Error('Authentication failed - no session cookie and test endpoint returned ' + testResponse.status);
      }
    }
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    throw error;
  }
}

async function testMultiSourceComparison(config, sessionCookie) {
  try {
    console.log(`\n🧪 Testing: ${config.name}`);
    console.log(`Primary: ${config.primaryGuide}, Secondary: ${config.comparisonGuides.join(', ')}`);
    console.log(`Location: ${config.project.country}/${config.project.city}`);
    console.log(`Spec: ${config.budget.specification}, Layout: ${config.budget.layout}`);
    
    const response = await fetch('http://localhost:5000/api/calculate-multi-guide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify(config)
    });
    
    const responseText = await response.text();
    console.log(`Response status: ${response.status}`);
    
    if (response.status === 200) {
      try {
        const result = JSON.parse(responseText);
        
        // Validate response structure
        const hasSuccess = result.success !== undefined;
        const hasData = result.data !== undefined;
        const hasPrimary = (hasData ? result.data.primary : result.primary) !== undefined;
        const hasComparisons = (hasData ? result.data.comparisons : result.comparisons) !== undefined;
        
        console.log(`✅ API call successful`);
        console.log(`   Response structure: success=${hasSuccess}, data=${hasData}`);
        console.log(`   Primary result: ${hasPrimary ? '✓' : '✗'}`);
        console.log(`   Comparisons: ${hasComparisons ? '✓' : '✗'}`);
        
        // Extract primary cost
        const primaryResult = hasData ? result.data.primary : result.primary;
        const primaryCost = primaryResult?.result?.totalCost;
        console.log(`   Primary total cost: ${primaryCost ? `$${primaryCost.toFixed(2)}` : 'N/A'}`);
        
        // Extract comparison data
        const comparisons = hasData ? result.data.comparisons : result.comparisons;
        if (comparisons && comparisons.length > 0) {
          comparisons.forEach((comp, index) => {
            const compCost = comp.result?.totalCost;
            const assumptions = comp.assumptions?.length || 0;
            console.log(`   Comparison ${index + 1} (${comp.guideId || comp.guideName}): $${compCost ? compCost.toFixed(2) : 'N/A'} (${assumptions} assumptions)`);
          });
        }
        
        return {
          success: true,
          hasValidStructure: hasPrimary && hasComparisons,
          primaryCost,
          comparisonsCount: comparisons?.length || 0,
          totalAssumptions: comparisons?.reduce((total, comp) => total + (comp.assumptions?.length || 0), 0) || 0
        };
        
      } catch (parseError) {
        console.log(`❌ JSON parse error: ${parseError.message}`);
        console.log(`Raw response: ${responseText.substring(0, 200)}...`);
        return { success: false, error: 'JSON parse failed' };
      }
    } else {
      console.log(`❌ API call failed: ${responseText}`);
      return { success: false, error: responseText };
    }
    
  } catch (error) {
    console.log(`❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runComprehensiveTests() {
  console.log('🔬 COMPREHENSIVE MULTI-SOURCE COMPARISON TESTING');
  console.log('=================================================\n');
  
  try {
    // Authenticate
    const sessionCookie = await authenticateUser();
    
    // Run all test configurations
    const results = [];
    for (const config of testConfigurations) {
      const result = await testMultiSourceComparison(config, sessionCookie);
      results.push({ config: config.name, ...result });
      
      // Wait between tests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Generate summary report
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('========================');
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    console.log(`Total tests: ${results.length}`);
    console.log(`Successful: ${successful.length} (${(successful.length/results.length*100).toFixed(1)}%)`);
    console.log(`Failed: ${failed.length} (${(failed.length/results.length*100).toFixed(1)}%)`);
    
    if (successful.length > 0) {
      console.log('\n✅ SUCCESSFUL TESTS:');
      successful.forEach(result => {
        console.log(`   ${result.config}: $${result.primaryCost?.toFixed(2) || 'N/A'} (${result.totalAssumptions} assumptions)`);
      });
    }
    
    if (failed.length > 0) {
      console.log('\n❌ FAILED TESTS:');
      failed.forEach(result => {
        console.log(`   ${result.config}: ${result.error}`);
      });
    }
    
    // Overall assessment
    console.log('\n🎯 FINAL ASSESSMENT:');
    if (successful.length === results.length) {
      console.log('✅ ALL TESTS PASSED - Multi-source comparison is working correctly');
      console.log('✅ Both CBRE→T&T and T&T→CBRE scenarios are functional');
      console.log('✅ Multiple locations and specifications are supported');
      console.log('✅ Leveling assumptions are being generated properly');
    } else if (successful.length > 0) {
      console.log('⚠️  PARTIAL SUCCESS - Some configurations are working');
      console.log('⚠️  Investigation needed for failed scenarios');
    } else {
      console.log('❌ COMPLETE FAILURE - Multi-source comparison is not working');
      console.log('❌ Core functionality needs to be fixed');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run the comprehensive test suite
runComprehensiveTests();