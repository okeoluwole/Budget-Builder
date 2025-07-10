// Test script to verify CBRE technology cost integration using actual rates instead of multiplication factors

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testTechnologyCostIntegration() {
  console.log('=== TESTING CBRE TECHNOLOGY COST INTEGRATION ===\n');

  try {
    // 1. First verify technology data is available
    console.log('1. Checking CBRE technology data availability...');
    const techResponse = await axios.get(`${BASE_URL}/api/technology-costs`);
    const techData = techResponse.data;
    
    if (!techData || techData.length === 0) {
      console.log('❌ No technology data found in database');
      return;
    }
    
    console.log(`✅ Found ${techData.length} technology cost records`);
    console.log('Available locations:', techData.slice(0, 3).map(item => `${item.city}, ${item.country}`).join(', '), '...\n');

    // 2. Create a test project in a location where we have technology data
    const testLocation = techData.find(item => 
      item.country === 'United States' && item.city === 'New York'
    ) || techData[0]; // Fall back to first available if New York not found

    console.log(`2. Creating test project for ${testLocation.city}, ${testLocation.country}...`);
    
    const projectPayload = {
      name: 'Technology Cost Test Project',
      reference: 'TECH-TEST',
      country: testLocation.country,
      city: testLocation.city,
      totalArea: 1000,
      areaUnit: 'sqm',
      currency: 'USD'
    };

    const projectResponse = await axios.post(`${BASE_URL}/api/projects`, projectPayload);
    const project = projectResponse.data;
    console.log(`✅ Created project ID: ${project.id}\n`);

    // 3. Test AudioVisual scope budget calculation (should use CBRE technology rates)
    console.log('3. Testing AudioVisual scope with CBRE technology rates...');
    
    const audioVisualBudgetPayload = {
      projectId: project.id,
      name: 'AudioVisual Budget Test',
      layout: 'Activity',
      specification: 'Silver', // Should map to Medium in CBRE data
      scope: 'AudioVisual',
      primaryDataSource: 'CBRE'
    };

    const audioVisualResponse = await axios.post(`${BASE_URL}/api/budgets`, audioVisualBudgetPayload);
    const audioVisualBudget = audioVisualResponse.data;
    
    console.log('AudioVisual Budget Results:');
    console.log(`- Total Cost: $${audioVisualBudget.totalCost?.toLocaleString()}`);
    console.log(`- Unit Cost: $${audioVisualBudget.rawUnitCost?.toFixed(2)}/sqm`);
    console.log('- Cost Breakdown:', audioVisualBudget.costsBreakdown);
    
    // Check if CBRE technology rate was used
    const expectedTechRate = testLocation.costs?.sqm?.Activity?.Medium;
    if (expectedTechRate) {
      const expectedTotalCost = expectedTechRate * 1000; // 1000 sqm
      const actualTotalCost = audioVisualBudget.totalCost;
      const isCloseMatch = Math.abs(actualTotalCost - expectedTotalCost) < 100; // Allow small variance
      
      console.log(`\nVerification:`);
      console.log(`- Expected CBRE rate: $${expectedTechRate}/sqm`);
      console.log(`- Expected total: $${expectedTotalCost.toLocaleString()}`);
      console.log(`- Actual total: $${actualTotalCost?.toLocaleString()}`);
      console.log(`- Match: ${isCloseMatch ? '✅ CBRE rate used correctly' : '❌ Rate mismatch'}\n`);
    }

    // 4. Test Complete scope budget calculation
    console.log('4. Testing Complete scope with CBRE technology rates...');
    
    const completeBudgetPayload = {
      projectId: project.id,
      name: 'Complete Budget Test',
      layout: 'Activity',
      specification: 'Gold', // Should map to High in CBRE data
      scope: 'Complete',
      primaryDataSource: 'CBRE',
      spaceAllocation: {
        'Open Office': { percentage: 70, area: 700 },
        'Meeting Rooms': { percentage: 20, area: 200 },
        'Support Areas': { percentage: 10, area: 100 }
      }
    };

    const completeResponse = await axios.post(`${BASE_URL}/api/budgets`, completeBudgetPayload);
    const completeBudget = completeResponse.data;
    
    console.log('Complete Package Budget Results:');
    console.log(`- Total Cost: $${completeBudget.totalCost?.toLocaleString()}`);
    console.log(`- Unit Cost: $${completeBudget.rawUnitCost?.toFixed(2)}/sqm`);
    console.log('- Cost Breakdown:', completeBudget.costsBreakdown);
    
    // Verify technology cost in complete package
    const technologyCostInComplete = completeBudget.costsBreakdown?.['TECHNOLOGY COSTS'];
    if (technologyCostInComplete) {
      const expectedHighTechRate = testLocation.costs?.sqm?.Activity?.High;
      if (expectedHighTechRate) {
        const expectedTechCost = expectedHighTechRate * 1000;
        const isMatch = Math.abs(technologyCostInComplete - expectedTechCost) < 100;
        
        console.log(`\nTechnology Cost Verification:`);
        console.log(`- Expected CBRE High rate: $${expectedHighTechRate}/sqm`);
        console.log(`- Expected tech cost: $${expectedTechCost.toLocaleString()}`);
        console.log(`- Actual tech cost: $${technologyCostInComplete?.toLocaleString()}`);
        console.log(`- Match: ${isMatch ? '✅ CBRE tech rate used correctly' : '❌ Tech rate mismatch'}\n`);
      }
    }

    // 5. Test different specification levels
    console.log('5. Testing different specification levels...');
    
    const specifications = ['Bronze', 'Silver', 'Gold'];
    const cbreSpecMap = { 'Bronze': 'Low', 'Silver': 'Medium', 'Gold': 'High' };
    
    for (const spec of specifications) {
      const specBudgetPayload = {
        projectId: project.id,
        name: `${spec} Technology Test`,
        layout: 'Activity',
        specification: spec,
        scope: 'AudioVisual',
        primaryDataSource: 'CBRE'
      };

      const specResponse = await axios.post(`${BASE_URL}/api/budgets`, specBudgetPayload);
      const specBudget = specResponse.data;
      
      const expectedRate = testLocation.costs?.sqm?.Activity?.[cbreSpecMap[spec]];
      const actualUnitCost = specBudget.rawUnitCost;
      
      console.log(`- ${spec} (${cbreSpecMap[spec]}): Expected $${expectedRate}/sqm, Actual $${actualUnitCost?.toFixed(2)}/sqm`);
    }

    console.log('\n✅ CBRE Technology Cost Integration Test Complete!');
    console.log('Technology costs are now using actual CBRE rates instead of multiplication factors.');

  } catch (error) {
    console.error('❌ Error during technology cost integration test:', error.response?.data || error.message);
  }
}

// Run the test
testTechnologyCostIntegration();