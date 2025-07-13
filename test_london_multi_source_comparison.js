/**
 * Test London Multi-Source Comparison
 * End-to-end test of CBRE vs T&T vs JLL for London office fit-out
 */

import fetch from 'node-fetch';

async function testLondonMultiSourceComparison() {
  console.log('🏢 Testing London Multi-Source Comparison (CBRE vs T&T vs JLL)');
  console.log('================================================================');
  
  // Test different London location input variations
  const londonVariations = [
    { 
      country: 'United Kingdom', 
      city: 'London', 
      label: 'Standard Format' 
    },
    { 
      country: 'UK', 
      city: 'London', 
      label: 'UK Abbreviation (Should normalize to United Kingdom)' 
    },
    { 
      country: 'England', 
      city: 'London', 
      label: 'England (Should normalize to United Kingdom)' 
    }
  ];
  
  console.log('Testing these location input variations:');
  londonVariations.forEach((variation, index) => {
    console.log(`${index + 1}. ${variation.city}, ${variation.country} (${variation.label})`);
  });
  console.log('');
  
  const baseProject = {
    name: 'London Multi-Source Test',
    totalArea: 1000,
    areaUnit: 'sqm',
    currency: 'GBP'
  };
  
  const baseBudget = {
    specification: 'High (Gold)',
    layout: 'Activity',
    scope: 'Complete Package'
  };
  
  const results = [];
  
  for (const variation of londonVariations) {
    console.log(`🔍 Testing: ${variation.city}, ${variation.country} (${variation.label})`);
    console.log('─'.repeat(70));
    
    const testProject = {
      ...baseProject,
      country: variation.country,
      city: variation.city
    };
    
    try {
      // Test multi-source comparison with CBRE primary, T&T and JLL comparison
      console.log('Making multi-source comparison request (CBRE vs T&T vs JLL)...');
      
      const response = await fetch('http://localhost:5000/api/calculate-multi-guide', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test' // Simple auth for testing
        },
        body: JSON.stringify({
          primaryGuide: 'CBRE',
          comparisonGuides: ['TT', 'JLL'],
          project: testProject,
          budget: baseBudget
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Multi-Source Comparison SUCCESS');
        
        // Primary guide (CBRE)
        console.log(`\n📊 Primary Guide: ${result.primary.guideName}`);
        if (result.primary.result) {
          console.log(`   Total Cost: £${result.primary.result.totalCost?.toLocaleString()}`);
          console.log(`   Unit Cost: £${result.primary.result.adjustedUnitCost?.toFixed(2)}/sqm`);
          console.log(`   Currency: ${result.primary.result.localCurrencyCode}`);
          console.log(`   Components: ${Object.keys(result.primary.result.costsBreakdown || {}).length}`);
          if (result.primary.result.datasetInfo?.location) {
            console.log(`   Matched Location: ${result.primary.result.datasetInfo.location}`);
          }
        }
        
        // Comparison guides
        console.log('\n📈 Comparison Results:');
        if (result.comparisons && result.comparisons.length > 0) {
          result.comparisons.forEach(comp => {
            console.log(`\n   ${comp.guideName}:`);
            if (comp.result) {
              const variance = comp.result.totalCost && result.primary.result?.totalCost 
                ? ((comp.result.totalCost - result.primary.result.totalCost) / result.primary.result.totalCost * 100).toFixed(1)
                : 'N/A';
              
              console.log(`     Total: £${comp.result.totalCost?.toLocaleString()} (${variance > 0 ? '+' : ''}${variance}% vs CBRE)`);
              console.log(`     Unit: £${comp.result.adjustedUnitCost?.toFixed(2)}/sqm`);
              console.log(`     Currency: ${comp.result.localCurrencyCode}`);
              console.log(`     Components: ${Object.keys(comp.result.costsBreakdown || {}).length}`);
              console.log(`     Data Available: ${comp.dataAvailability}`);
              if (comp.result.datasetInfo?.location) {
                console.log(`     Matched Location: ${comp.result.datasetInfo.location}`);
              }
              if (comp.assumptions && comp.assumptions.length > 0) {
                console.log(`     Key Assumptions: ${comp.assumptions.slice(0, 2).join(', ')}`);
              }
            } else {
              console.log(`     ❌ Error: ${comp.error || 'No data available'}`);
              console.log(`     Data Available: ${comp.dataAvailability}`);
            }
          });
        }
        
        // Mapping notes
        if (result.mappingNotes && result.mappingNotes.length > 0) {
          console.log('\n📝 Mapping Notes:');
          result.mappingNotes.forEach(note => console.log(`   • ${note}`));
        }
        
        results.push({
          variation: variation.label,
          success: true,
          primaryCost: result.primary.result?.totalCost,
          comparisons: result.comparisons?.map(c => ({
            guide: c.guideName,
            cost: c.result?.totalCost,
            available: c.dataAvailability === 'available'
          })),
          locationMatching: {
            input: `${variation.city}, ${variation.country}`,
            matched: result.primary.result?.datasetInfo?.location
          }
        });
        
      } else {
        const errorText = await response.text();
        console.log(`❌ Multi-Source Comparison FAILED - ${response.status}`);
        console.log(`Error: ${errorText.substring(0, 200)}...`);
        
        results.push({
          variation: variation.label,
          success: false,
          error: errorText
        });
      }
    } catch (error) {
      console.log(`❌ Multi-Source Comparison ERROR - ${error.message}`);
      results.push({
        variation: variation.label,
        success: false,
        error: error.message
      });
    }
    
    console.log('\n' + '='.repeat(70) + '\n');
  }
  
  // Summary Report
  console.log('📋 MULTI-SOURCE COMPARISON SUMMARY');
  console.log('===================================');
  
  const successfulTests = results.filter(r => r.success);
  const failedTests = results.filter(r => !r.success);
  
  console.log(`✅ Successful Tests: ${successfulTests.length}/${results.length}`);
  
  if (successfulTests.length > 0) {
    console.log('\n🎯 Successful Location Normalizations:');
    successfulTests.forEach(test => {
      console.log(`- ${test.variation}: ${test.locationMatching?.input} → ${test.locationMatching?.matched}`);
      console.log(`  Primary (CBRE): £${test.primaryCost?.toLocaleString()}`);
      if (test.comparisons) {
        test.comparisons.forEach(comp => {
          const status = comp.available ? `£${comp.cost?.toLocaleString()}` : 'Not Available';
          console.log(`  ${comp.guide}: ${status}`);
        });
      }
    });
  }
  
  if (failedTests.length > 0) {
    console.log('\n❌ Failed Tests:');
    failedTests.forEach(test => {
      console.log(`- ${test.variation}: ${test.error?.substring(0, 100)}...`);
    });
  }
  
  console.log('\n🔍 Key Testing Points:');
  console.log('- Location normalization working across all guides');
  console.log('- UK → United Kingdom conversion applied correctly');
  console.log('- Multi-source comparison displaying variance calculations');
  console.log('- Component mapping between different guide systems');
  console.log('- Currency handling (CBRE USD, T&T GBP, JLL GBP)');
  console.log('- Professional fees and component breakdown accuracy');
  
  return results;
}

// Run the comprehensive London multi-source test
testLondonMultiSourceComparison().catch(console.error);