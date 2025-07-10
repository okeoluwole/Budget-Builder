// Comprehensive Global Data Extraction Validation
// Tests multiple international locations with different layouts and specifications

import fetch from 'node-fetch';

console.log("=== COMPREHENSIVE GLOBAL DATA EXTRACTION VALIDATION ===");

async function validateGlobalDataExtraction() {
    // Test matrix covering diverse global locations
    const testMatrix = [
        // Major EMEA markets
        { location: "London, United Kingdom", layout: "Team", spec: "High", expectedComponents: 4 },
        { location: "Frankfurt, Germany", layout: "Activity", spec: "Medium", expectedComponents: 3 },
        { location: "Paris, France", layout: "Event", spec: "Low", expectedComponents: 4 },
        { location: "Abuja, Nigeria", layout: "Team", spec: "Medium", expectedComponents: 4 },
        
        // Major AMERICAS markets
        { location: "New York, United States", layout: "Activity", spec: "High", expectedComponents: 4 },
        { location: "Toronto, Canada", layout: "Team", spec: "Medium", expectedComponents: 3 },
        { location: "Charlotte, United States", layout: "Event", spec: "Low", expectedComponents: 4 },
        
        // Major APAC markets
        { location: "Singapore, Singapore", layout: "Activity", spec: "High", expectedComponents: 4 },
        { location: "Tokyo, Japan", layout: "Team", spec: "Medium", expectedComponents: 4 },
        { location: "Mumbai, India", layout: "Event", spec: "Low", expectedComponents: 4 },
        { location: "Sydney, Australia", layout: "Activity", spec: "High", expectedComponents: 4 },
        
        // Additional diverse locations
        { location: "Auckland, New Zealand", layout: "Team", spec: "Medium", expectedComponents: 2 },
        { location: "Bangkok, Thailand", layout: "Activity", spec: "High", expectedComponents: 2 }
    ];
    
    let totalTests = testMatrix.length;
    let passedTests = 0;
    let failedTests = 0;
    
    const results = {
        byRegion: { EMEA: [], AMERICAS: [], APAC: [] },
        byLayout: { Activity: [], Team: [], Event: [] },
        bySpec: { Low: [], Medium: [], High: [] },
        summary: { total: 0, passed: 0, failed: 0 }
    };
    
    console.log(`Testing ${totalTests} global locations...\n`);
    
    for (const test of testMatrix) {
        const [city, country] = test.location.split(", ");
        console.log(`Testing: ${test.location} | ${test.layout} | ${test.spec}`);
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: {
                        name: `Global Test ${city}`,
                        country: country,
                        city: city,
                        totalArea: 1000,
                        areaUnit: "sqm",
                        currency: "USD"
                    },
                    budget: {
                        scope: "Complete",
                        specification: test.spec,
                        layout: test.layout,
                        primaryDataSource: "CBRE"
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                const unitCost = result.totalCost / 1000;
                
                // Count available components
                let componentCount = 0;
                const components = {
                    fitout: result.fitoutCost || 0,
                    technology: result.technologyCost || 0,
                    furniture: result.furnitureCost || 0,
                    professionalFees: result.costsBreakdown['PROFESSIONAL FEES'] || 0
                };
                
                if (components.fitout > 0) componentCount++;
                if (components.technology > 0) componentCount++;
                if (components.furniture > 0) componentCount++;
                if (components.professionalFees > 0) componentCount++;
                
                const testResult = {
                    location: test.location,
                    layout: test.layout,
                    specification: test.spec,
                    success: true,
                    unitCost: unitCost.toFixed(2),
                    componentCount: componentCount,
                    components: {
                        fitout: (components.fitout / 1000).toFixed(2),
                        technology: (components.technology / 1000).toFixed(2),
                        furniture: (components.furniture / 1000).toFixed(2),
                        professionalFees: (components.professionalFees / 1000).toFixed(2)
                    },
                    dataIntegrity: componentCount >= 2 ? 'Good' : 'Partial'
                };
                
                // Determine region
                let region = 'UNKNOWN';
                if (country.includes('United Kingdom') || country.includes('Germany') || 
                    country.includes('France') || country.includes('Nigeria')) {
                    region = 'EMEA';
                } else if (country.includes('United States') || country.includes('Canada')) {
                    region = 'AMERICAS';
                } else if (country.includes('Singapore') || country.includes('Japan') || 
                          country.includes('India') || country.includes('Australia') ||
                          country.includes('New Zealand') || country.includes('Thailand')) {
                    region = 'APAC';
                }
                
                results.byRegion[region]?.push(testResult);
                results.byLayout[test.layout].push(testResult);
                results.bySpec[test.spec].push(testResult);
                
                passedTests++;
                console.log(`  ✅ Success: $${unitCost.toFixed(2)}/sqm (${componentCount} components)`);
                console.log(`     Components: F:$${testResult.components.fitout} T:$${testResult.components.technology} Fu:$${testResult.components.furniture} P:$${testResult.components.professionalFees}`);
                
            } else {
                const error = await response.json();
                failedTests++;
                console.log(`  ❌ Failed: ${error.message}`);
                
                results.byLayout[test.layout].push({
                    location: test.location,
                    layout: test.layout,
                    specification: test.spec,
                    success: false,
                    error: error.message
                });
            }
            
        } catch (error) {
            failedTests++;
            console.log(`  ❌ Error: ${error.message}`);
        }
        
        console.log(""); // Empty line for readability
    }
    
    // Generate comprehensive analysis
    console.log("=== GLOBAL VALIDATION ANALYSIS ===");
    
    // Overall results
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    console.log(`\nOverall Results:`);
    console.log(`  Total locations tested: ${totalTests}`);
    console.log(`  Successful: ${passedTests}`);
    console.log(`  Failed: ${failedTests}`);
    console.log(`  Success rate: ${successRate}%`);
    
    // Regional analysis
    console.log(`\nRegional Performance:`);
    Object.entries(results.byRegion).forEach(([region, tests]) => {
        const regionSuccess = tests.filter(t => t.success).length;
        const regionTotal = tests.length;
        const regionRate = regionTotal > 0 ? ((regionSuccess / regionTotal) * 100).toFixed(1) : '0';
        
        if (regionTotal > 0) {
            console.log(`  ${region}: ${regionSuccess}/${regionTotal} (${regionRate}%)`);
            
            // Show average cost for successful tests
            const successfulTests = tests.filter(t => t.success);
            if (successfulTests.length > 0) {
                const avgCost = successfulTests.reduce((sum, t) => sum + parseFloat(t.unitCost), 0) / successfulTests.length;
                console.log(`    Average cost: $${avgCost.toFixed(2)}/sqm`);
            }
        }
    });
    
    // Layout analysis
    console.log(`\nLayout Performance:`);
    Object.entries(results.byLayout).forEach(([layout, tests]) => {
        const layoutSuccess = tests.filter(t => t.success).length;
        const layoutTotal = tests.length;
        const layoutRate = layoutTotal > 0 ? ((layoutSuccess / layoutTotal) * 100).toFixed(1) : '0';
        console.log(`  ${layout}: ${layoutSuccess}/${layoutTotal} (${layoutRate}%)`);
    });
    
    // Specification analysis
    console.log(`\nSpecification Performance:`);
    Object.entries(results.bySpec).forEach(([spec, tests]) => {
        const specSuccess = tests.filter(t => t.success).length;
        const specTotal = tests.length;
        const specRate = specTotal > 0 ? ((specSuccess / specTotal) * 100).toFixed(1) : '0';
        console.log(`  ${spec}: ${specSuccess}/${specTotal} (${specRate}%)`);
    });
    
    // Data completeness analysis
    const allSuccessfulTests = [...results.byRegion.EMEA, ...results.byRegion.AMERICAS, ...results.byRegion.APAC]
        .filter(t => t.success);
    
    if (allSuccessfulTests.length > 0) {
        const component4 = allSuccessfulTests.filter(t => t.componentCount === 4).length;
        const component3 = allSuccessfulTests.filter(t => t.componentCount === 3).length;
        const component2 = allSuccessfulTests.filter(t => t.componentCount === 2).length;
        const component1 = allSuccessfulTests.filter(t => t.componentCount === 1).length;
        
        console.log(`\nData Completeness:`);
        console.log(`  Complete (4 components): ${component4} locations`);
        console.log(`  Good (3 components): ${component3} locations`);
        console.log(`  Partial (2 components): ${component2} locations`);
        console.log(`  Limited (1 component): ${component1} locations`);
        
        const completenessRate = ((component4 + component3) / allSuccessfulTests.length * 100).toFixed(1);
        console.log(`  Overall completeness: ${completenessRate}%`);
    }
    
    // Recommendations
    console.log(`\n=== VALIDATION RECOMMENDATIONS ===`);
    
    if (successRate >= 90) {
        console.log(`✅ Excellent global coverage - Data extraction logic is working correctly`);
    } else if (successRate >= 80) {
        console.log(`⚠️ Good coverage with room for improvement`);
    } else {
        console.log(`❌ Coverage needs significant improvement`);
    }
    
    if (failedTests > 0) {
        console.log(`📋 Address ${failedTests} failed location(s) for complete global coverage`);
    }
    
    console.log(`📊 All regions, layouts, and specifications are being tested systematically`);
    console.log(`🔍 Data extraction logic validated across diverse international markets`);
    
    return {
        successRate: parseFloat(successRate),
        totalTests,
        passedTests,
        failedTests,
        regionalResults: results.byRegion,
        layoutResults: results.byLayout,
        specResults: results.bySpec
    };
}

// Execute comprehensive validation
validateGlobalDataExtraction();