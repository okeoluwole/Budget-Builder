/**
 * Test Multi-Guide API Endpoint
 * Validates that the backend multi-guide calculation endpoint works correctly
 */

async function testMultiGuideAPI() {
  console.log('=== Multi-Guide API Test ===');
  
  const testProject = {
    name: 'Multi-Guide Test Project',
    country: 'United Kingdom',
    city: 'London',
    totalArea: 1000,
    areaUnit: 'sqm',
    currency: 'GBP',
    inflationRate: 0.0,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
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
    },
    isComparisonEnabled: true,
    comparisonSources: ['TT', 'JLL']
  };
  
  try {
    console.log('Testing multi-guide calculation endpoint...');
    
    const response = await fetch('http://localhost:3000/api/calculate-multi-guide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'connect.sid=s%3A123'
      },
      body: JSON.stringify({
        primaryGuide: 'CBRE',
        comparisonGuides: ['TT', 'JLL'],
        project: testProject,
        budget: testBudget
      })
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('Multi-guide result received:', JSON.stringify(result, null, 2));
    
    // Validate structure
    if (result.primary && result.comparisons && result.mappingNotes) {
      console.log('✓ Multi-guide API structure valid');
      console.log('Primary guide:', result.primary.guideName);
      console.log('Comparison guides:', result.comparisons.map(c => c.guideName));
      console.log('Mapping notes:', result.mappingNotes);
    } else {
      console.error('✗ Multi-guide API structure invalid');
    }
    
  } catch (error) {
    console.error('Multi-guide API test failed:', error.message);
  }
}

testMultiGuideAPI();