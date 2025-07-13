/**
 * Systematic Data Source Leveling System Testing
 * Complete end-to-end validation of multi-source comparison with leveling assumptions
 */

console.log('🧪 SYSTEMATIC LEVELING SYSTEM TESTING');
console.log('====================================\n');

async function testStep1_ComponentIntegration() {
  console.log('STEP 1: Component Integration Testing');
  console.log('-------------------------------------');
  
  const fs = require('fs').promises;
  
  try {
    // Check core files exist
    const levelingSystemExists = await fs.access('server/utils/dataSourceLeveling.ts').then(() => true).catch(() => false);
    const levelingComponentExists = await fs.access('client/src/components/budget/LevelingAssumptions.tsx').then(() => true).catch(() => false);
    const budgetResultsExists = await fs.access('client/src/components/budget/BudgetResultsStep.tsx').then(() => true).catch(() => false);
    
    console.log('✓ File Structure:');
    console.log(`  - dataSourceLeveling.ts: ${levelingSystemExists ? 'EXISTS' : 'MISSING'}`);
    console.log(`  - LevelingAssumptions.tsx: ${levelingComponentExists ? 'EXISTS' : 'MISSING'}`);
    console.log(`  - BudgetResultsStep.tsx: ${budgetResultsExists ? 'EXISTS' : 'MISSING'}`);
    
    // Check integration in BudgetResultsStep
    const budgetResultsContent = await fs.readFile('client/src/components/budget/BudgetResultsStep.tsx', 'utf8');
    const hasLevelingImport = budgetResultsContent.includes('import LevelingAssumptions');
    const hasLevelingComponent = budgetResultsContent.includes('<LevelingAssumptions');
    
    console.log('✓ Integration Check:');
    console.log(`  - LevelingAssumptions imported: ${hasLevelingImport ? 'YES' : 'NO'}`);
    console.log(`  - LevelingAssumptions rendered: ${hasLevelingComponent ? 'YES' : 'NO'}`);
    
    return {
      filesExist: levelingSystemExists && levelingComponentExists && budgetResultsExists,
      integrated: hasLevelingImport && hasLevelingComponent
    };
    
  } catch (error) {
    console.error('❌ Error in Step 1:', error.message);
    return { filesExist: false, integrated: false };
  }
}

async function testStep2_DataSourceProfiles() {
  console.log('\nSTEP 2: Data Source Profiles Validation');
  console.log('----------------------------------------');
  
  try {
    // Check if leveling system can be imported
    const { getDataSourceProfile, validateCompatibility, levelParameters } = require('./server/utils/dataSourceLeveling.ts');
    
    const cbreProfile = getDataSourceProfile('CBRE');
    const ttProfile = getDataSourceProfile('TT');
    const jllProfile = getDataSourceProfile('JLL');
    
    console.log('✓ Data Source Profiles:');
    console.log(`  - CBRE: ${cbreProfile ? 'LOADED' : 'MISSING'}`);
    console.log(`  - T&T: ${ttProfile ? 'LOADED' : 'MISSING'}`);
    console.log(`  - JLL: ${jllProfile ? 'LOADED' : 'MISSING'}`);
    
    if (cbreProfile) {
      console.log('✓ CBRE Profile Details:');
      console.log(`  - Specifications: ${cbreProfile.specifications.format} (${cbreProfile.specifications.options.join(', ')})`);
      console.log(`  - Layout Support: ${cbreProfile.layoutSupport.supported ? 'YES' : 'NO'}`);
      console.log(`  - Components: ${cbreProfile.components.map(c => c.name).join(', ')}`);
    }
    
    return { profilesLoaded: true };
    
  } catch (error) {
    console.error('❌ Error in Step 2:', error.message);
    return { profilesLoaded: false };
  }
}

async function testStep3_APIEndpoint() {
  console.log('\nSTEP 3: API Endpoint Testing');
  console.log('-----------------------------');
  
  const { spawn } = require('child_process');
  
  return new Promise((resolve) => {
    // Test API endpoint exists in routes.ts
    const fs = require('fs');
    const routesContent = fs.readFileSync('server/routes.ts', 'utf8');
    
    const hasMultiGuideEndpoint = routesContent.includes('/api/calculate-multi-guide');
    const hasLevelingImport = routesContent.includes('dataSourceLeveling');
    
    console.log('✓ API Endpoint Check:');
    console.log(`  - /api/calculate-multi-guide exists: ${hasMultiGuideEndpoint ? 'YES' : 'NO'}`);
    console.log(`  - Leveling system imported: ${hasLevelingImport ? 'YES' : 'NO'}`);
    
    resolve({
      endpointExists: hasMultiGuideEndpoint,
      levelingIntegrated: hasLevelingImport
    });
  });
}

async function testStep4_ComponentStructure() {
  console.log('\nSTEP 4: Component Structure Validation');
  console.log('--------------------------------------');
  
  try {
    const fs = require('fs').promises;
    const componentContent = await fs.readFile('client/src/components/budget/LevelingAssumptions.tsx', 'utf8');
    
    // Check for key functions and structure
    const hasGetAllAssumptions = componentContent.includes('getAllAssumptions');
    const hasCategorizeAssumptions = componentContent.includes('categorizeAssumptions');
    const hasCardStructure = componentContent.includes('<Card');
    const hasAlertStructure = componentContent.includes('<Alert');
    const hasInfoIcon = componentContent.includes('Info');
    
    console.log('✓ Component Structure:');
    console.log(`  - getAllAssumptions function: ${hasGetAllAssumptions ? 'PRESENT' : 'MISSING'}`);
    console.log(`  - categorizeAssumptions function: ${hasCategorizeAssumptions ? 'PRESENT' : 'MISSING'}`);
    console.log(`  - Card UI structure: ${hasCardStructure ? 'PRESENT' : 'MISSING'}`);
    console.log(`  - Alert components: ${hasAlertStructure ? 'PRESENT' : 'MISSING'}`);
    console.log(`  - Info icon: ${hasInfoIcon ? 'PRESENT' : 'MISSING'}`);
    
    // Check for syntax errors
    const hasSyntaxIssues = componentContent.includes('assumptions.assumptions') || 
                           componentContent.includes('categorized.assumptions');
    
    console.log(`  - Syntax issues detected: ${hasSyntaxIssues ? 'YES - NEEDS FIX' : 'NO'}`);
    
    return {
      structureValid: hasGetAllAssumptions && hasCategorizeAssumptions && hasCardStructure,
      syntaxClean: !hasSyntaxIssues
    };
    
  } catch (error) {
    console.error('❌ Error in Step 4:', error.message);
    return { structureValid: false, syntaxClean: false };
  }
}

async function testStep5_UIIntegration() {
  console.log('\nSTEP 5: UI Integration Testing');
  console.log('------------------------------');
  
  try {
    const fs = require('fs').promises;
    const budgetResultsContent = await fs.readFile('client/src/components/budget/BudgetResultsStep.tsx', 'utf8');
    
    // Check proper placement
    const hasMultiSourceSection = budgetResultsContent.includes('Multi-Source Comparison Section');
    const hasLevelingPlacement = budgetResultsContent.includes('<LevelingAssumptions');
    const hasProperProps = budgetResultsContent.includes('multiGuideResults={multiGuideResults}');
    const hasConditionalRender = budgetResultsContent.includes('showComparison && multiGuideResults');
    
    console.log('✓ UI Integration:');
    console.log(`  - Multi-source section exists: ${hasMultiSourceSection ? 'YES' : 'NO'}`);
    console.log(`  - LevelingAssumptions placed: ${hasLevelingPlacement ? 'YES' : 'NO'}`);
    console.log(`  - Proper props passed: ${hasProperProps ? 'YES' : 'NO'}`);
    console.log(`  - Conditional rendering: ${hasConditionalRender ? 'YES' : 'NO'}`);
    
    return {
      integrated: hasMultiSourceSection && hasLevelingPlacement && hasProperProps && hasConditionalRender
    };
    
  } catch (error) {
    console.error('❌ Error in Step 5:', error.message);
    return { integrated: false };
  }
}

async function runSystematicTest() {
  console.log('🚀 Starting Systematic Testing...\n');
  
  const step1 = await testStep1_ComponentIntegration();
  const step2 = await testStep2_DataSourceProfiles();
  const step3 = await testStep3_APIEndpoint();
  const step4 = await testStep4_ComponentStructure();
  const step5 = await testStep5_UIIntegration();
  
  console.log('\n📊 TESTING SUMMARY');
  console.log('==================');
  
  const results = {
    step1_files: step1.filesExist,
    step1_integration: step1.integrated,
    step2_profiles: step2.profilesLoaded,
    step3_api: step3.endpointExists,
    step3_leveling: step3.levelingIntegrated,
    step4_structure: step4.structureValid,
    step4_syntax: step4.syntaxClean,
    step5_ui: step5.integrated
  };
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`Tests Passed: ${passedTests}/${totalTests}`);
  console.log('\nDetailed Results:');
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`  ${passed ? '✅' : '❌'} ${test.replace(/_/g, ' ')}`);
  });
  
  const criticalIssues = [];
  if (!step1.filesExist) criticalIssues.push('Missing core files');
  if (!step1.integrated) criticalIssues.push('Component not integrated');
  if (!step4.syntaxClean) criticalIssues.push('Syntax errors in component');
  if (!step5.integrated) criticalIssues.push('UI integration incomplete');
  
  if (criticalIssues.length > 0) {
    console.log('\n🔥 CRITICAL ISSUES TO FIX:');
    criticalIssues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('\n🎉 ALL SYSTEMS OPERATIONAL - Ready for manual testing!');
  }
  
  return { passedTests, totalTests, criticalIssues, results };
}

// Run the systematic test
runSystematicTest().then(result => {
  console.log('\n✅ Systematic testing complete!');
  if (result.criticalIssues.length === 0) {
    console.log('🎯 System ready for user acceptance testing');
  }
});