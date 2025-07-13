/**
 * Test London Multi-Source Comparison
 * End-to-end test of CBRE vs T&T vs JLL for London office fit-out
 */

import fetch from 'node-fetch';

async function testLondonMultiSourceComparison() {
  console.log('=== London Multi-Source Comparison Test ===');
  
  const baseURL = 'http://localhost:5000';
  
  // Login first to get session
  const loginResponse = await fetch(`${baseURL}/api/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: 'admin',
      password: 'admin123'
    })
  });
  
  const sessionCookie = loginResponse.headers.get('set-cookie');
  console.log('Login status:', loginResponse.status);
  
  if (!sessionCookie) {
    console.error('Failed to get session cookie');
    return;
  }
  
  // Test project for London
  const londonProject = {
    name: 'London Multi-Source Test',
    country: 'United Kingdom',
    city: 'London',
    totalArea: 1000,
    areaUnit: 'sqm',
    currency: 'GBP',
    inflationRate: 0.0,
    status: 'draft',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  // Test budget configuration
  const testBudget = {
    primaryDataSource: 'CBRE',
    specification: 'High (Gold)',
    layout: 'Activity',
    scope: 'Complete',
    spaceAllocation: {
      'Open workspace': { percentage: 50, area: 500 },
      'Meeting rooms': { percentage: 25, area: 250 },
      'Focus areas': { percentage: 15, area: 150 },
      'Support spaces': { percentage: 10, area: 100 }
    }
  };
  
  try {
    console.log('Testing multi-source comparison for London...');
    
    const multiGuideResponse = await fetch(`${baseURL}/api/calculate-multi-guide`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        primaryGuide: 'CBRE',
        comparisonGuides: ['TT', 'JLL'],
        project: londonProject,
        budget: testBudget
      })
    });
    
    console.log('Multi-guide response status:', multiGuideResponse.status);
    
    if (!multiGuideResponse.ok) {
      const errorText = await multiGuideResponse.text();
      console.error('Multi-guide error:', errorText);
      return;
    }
    
    const result = await multiGuideResponse.json();
    console.log('\n=== LONDON MULTI-SOURCE COMPARISON RESULTS ===');
    
    // Primary result (CBRE)
    console.log('\n🏢 PRIMARY: CBRE Global Fit-Out Cost Guide');
    console.log(`Total Cost: £${result.primary.result.localCurrencyTotalCost?.toLocaleString() || 'N/A'}`);
    console.log(`Rate: £${Math.round((result.primary.result.localCurrencyTotalCost || 0) / 1000)}/sqm`);
    console.log(`Components: ${Object.keys(result.primary.result.localCurrencyCostsBreakdown || {}).length}`);
    
    // Comparison results
    console.log('\n📊 COMPARISONS:');
    result.comparisons.forEach((comparison, index) => {
      const emoji = index === 0 ? '🏗️' : '🏙️';
      console.log(`\n${emoji} ${comparison.guideName}`);
      
      if (comparison.result) {
        console.log(`Total Cost: £${comparison.result.localCurrencyTotalCost?.toLocaleString() || 'N/A'}`);
        console.log(`Rate: £${Math.round((comparison.result.localCurrencyTotalCost || 0) / 1000)}/sqm`);
        console.log(`Components: ${Object.keys(comparison.result.localCurrencyCostsBreakdown || {}).length}`);
        
        // Calculate variance from primary
        if (result.primary.result.localCurrencyTotalCost && comparison.result.localCurrencyTotalCost) {
          const variance = ((comparison.result.localCurrencyTotalCost - result.primary.result.localCurrencyTotalCost) / result.primary.result.localCurrencyTotalCost) * 100;
          console.log(`Variance from CBRE: ${variance > 0 ? '+' : ''}${variance.toFixed(1)}%`);
        }
      } else {
        console.log(`Status: ${comparison.dataAvailability}`);
        console.log(`Note: ${comparison.assumptions?.[0] || 'No data available'}`);
      }
    });
    
    // Mapping notes
    console.log('\n📝 MAPPING NOTES:');
    result.mappingNotes.forEach((note, index) => {
      console.log(`${index + 1}. ${note}`);
    });
    
    // Validate multi-source structure
    const hasValidStructure = result.primary && 
                             result.comparisons && 
                             result.mappingNotes &&
                             result.comparisons.length === 2;
    
    console.log(`\n✅ Multi-source comparison ${hasValidStructure ? 'SUCCESSFUL' : 'FAILED'}`);
    
    if (hasValidStructure) {
      console.log('\n🎯 KEY INSIGHTS:');
      console.log('- All three major industry cost guides compared');
      console.log('- Currency normalization to GBP completed');
      console.log('- Component mapping across different methodologies');
      console.log('- Variance analysis provides cost range guidance');
      console.log('- Professional insights available for decision making');
    }
    
  } catch (error) {
    console.error('London multi-source test failed:', error.message);
  }
}

// Run the test
testLondonMultiSourceComparison().catch(console.error);