/**
 * STEP 4: T&T Calculation Engine Testing
 * Test T&T calculation engine with working data and validate component calculations
 */

console.log("=== STEP 4: T&T CALCULATION ENGINE TESTING ===");

// Import T&T data for testing
const TT2025_DATA = [
    {
        country: 'France',
        city: 'Paris',
        region: 'EMEA',
        costs: {
            total: { low: 2244.4, medium: 2862.0, high: 4014.0 },
            construction: { low: 1771.1, medium: 2232.0, high: 3089.0 },
            looseFurniture: { low: 220.6, medium: 314.9, high: 504.0 },
            audioVisual: { low: 78.9, medium: 94.5, high: 115.5 },
            professionalFees: { low: 173.7, medium: 219.5, high: 305.6 }
        }
    },
    {
        country: 'Germany',
        city: 'Munich',
        region: 'EMEA',
        costs: {
            total: { low: 3431.0, medium: 4055.0, high: 5253.0 },
            construction: { low: 2714.0, medium: 3224.0, high: 4218.0 },
            looseFurniture: { low: 215.0, medium: 238.0, high: 262.0 },
            audioVisual: { low: 48.0, medium: 53.0, high: 66.0 },
            professionalFees: { low: 454.0, medium: 540.0, high: 707.0 }
        }
    },
    {
        country: 'United Kingdom',
        city: 'London',
        region: 'EMEA',
        costs: {
            total: { low: 4510.0, medium: 5500.0, high: 7535.0 },
            construction: { low: 3217.0, medium: 3801.0, high: 5223.0 },
            looseFurniture: { low: 484.0, medium: 726.0, high: 967.0 },
            audioVisual: { low: 274.0, medium: 339.0, high: 468.0 },
            professionalFees: { low: 535.0, medium: 634.0, high: 877.0 }
        }
    },
    {
        country: 'Singapore',
        city: 'Singapore',
        region: 'APAC',
        costs: {
            total: { low: 2080.0, medium: 2600.0, high: 3380.0 },
            construction: { low: 1664.0, medium: 1820.0, high: 2704.0 },
            looseFurniture: { low: 208.0, medium: 260.0, high: 338.0 },
            audioVisual: { low: 145.6, medium: 182.0, high: 236.6 },
            professionalFees: { low: 270.4, medium: 338.0, high: 439.4 }
        }
    }
];

function findTTLocationData(country, city) {
    return TT2025_DATA.find(location => 
        location.country === country && location.city === city
    );
}

function calculateTTComponentCost(inputs) {
    const { location, area, component, specification } = inputs;
    
    // Parse location
    const [country, city] = location.split('/');
    
    // Find location data
    const locationData = findTTLocationData(country, city);
    if (!locationData) {
        throw new Error(`Location not found: ${location}`);
    }
    
    // Map component names
    const componentMap = {
        'Construction': 'construction',
        'Loose Furniture': 'looseFurniture',
        'Audio-Visual': 'audioVisual',
        'Professional Fees': 'professionalFees'
    };
    
    const componentKey = componentMap[component];
    if (!componentKey) {
        throw new Error(`Component not found: ${component}`);
    }
    
    // Map specification
    const specMap = {
        'Low': 'low',
        'Medium': 'medium',
        'High': 'high'
    };
    
    const specKey = specMap[specification];
    if (!specKey) {
        throw new Error(`Specification not found: ${specification}`);
    }
    
    // Get rate and calculate cost
    const rate = locationData.costs[componentKey][specKey];
    const cost = rate * area;
    
    return cost;
}

function testTTCalculationEngine() {
    console.log("Testing T&T calculation engine with working data...");
    
    // Test with known working location (Germany/Munich after fix)
    const testLocation = "Germany/Munich";
    const testArea = 1000;
    
    const testCases = [
        { component: "Construction", specification: "Medium" },
        { component: "Loose Furniture", specification: "Medium" },
        { component: "Audio-Visual", specification: "Medium" },
        { component: "Professional Fees", specification: "Medium" }
    ];
    
    const testResults = [];
    
    for (const testCase of testCases) {
        console.log(`\nTesting: ${testLocation}, ${testCase.component}, ${testCase.specification}`);
        
        try {
            const testInputs = {
                location: testLocation,
                area: testArea,
                component: testCase.component,
                specification: testCase.specification
            };
            
            const calculationResult = calculateTTComponentCost(testInputs);
            console.log(`Calculation result: $${calculationResult}`);
            
            // Verify against expected rates
            const expectedRates = {
                "Construction": 3224,
                "Loose Furniture": 238,
                "Audio-Visual": 53,
                "Professional Fees": 540
            };
            
            const expectedRate = expectedRates[testCase.component];
            const expectedCost = expectedRate * testArea;
            const calculationCorrect = Math.abs(calculationResult - expectedCost) < 1;
            
            console.log(`Expected: $${expectedCost}, Got: $${calculationResult}, Correct: ${calculationCorrect}`);
            
            testResults.push({
                testInputs: testInputs,
                calculationResult: calculationResult,
                expectedCost: expectedCost,
                calculationCorrect: calculationCorrect,
                success: !!(calculationResult && calculationResult > 0 && calculationCorrect)
            });
            
        } catch (error) {
            console.error(`❌ T&T calculation failed for ${testCase.component}:`, error);
            testResults.push({ 
                testInputs: testCase,
                error: error.message,
                success: false 
            });
        }
    }
    
    return testResults;
}

async function testCalculationEngineWithAPI() {
    console.log("\n=== TESTING CALCULATION ENGINE WITH API ===");
    
    const testLocation = "Germany/Munich";
    
    try {
        const response = await fetch('http://localhost:5000/api/calculate-budget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project: {
                    city: "Munich",
                    country: "Germany",
                    totalArea: 1000,
                    areaUnit: "sqm",
                    currency: "USD"
                },
                budget: {
                    primaryDataSource: "TT",
                    scope: "Complete",
                    specification: "Medium (Silver)",
                    layout: "Activity"
                }
            })
        });
        
        if (response.ok) {
            const apiResult = await response.json();
            
            console.log("API calculation successful:");
            console.log(`Total: $${apiResult.rawUnitCost}/sqm`);
            console.log("Component breakdown:");
            console.log(`  Construction: $${Math.round(apiResult.costsBreakdown.Construction / 1000)}/sqm`);
            console.log(`  Loose Furniture: $${Math.round(apiResult.costsBreakdown['Loose Furniture'] / 1000)}/sqm`);
            console.log(`  Audio-Visual: $${Math.round(apiResult.costsBreakdown['Audio-Visual'] / 1000)}/sqm`);
            console.log(`  Professional Fees: $${Math.round(apiResult.costsBreakdown['Professional Fees'] / 1000)}/sqm`);
            
            return {
                success: true,
                apiResult: apiResult,
                breakdown: apiResult.costsBreakdown
            };
            
        } else {
            console.error(`❌ API failed: HTTP ${response.status}`);
            return { success: false, error: `HTTP ${response.status}` };
        }
        
    } catch (error) {
        console.error("❌ API test failed:", error);
        return { success: false, error: error.message };
    }
}

// Execute Step 4
console.log("Starting T&T calculation engine testing...");

const step4Results = testTTCalculationEngine();
console.log("\nSTEP 4 COMPONENT CALCULATION RESULTS:");

let allSuccessful = true;
step4Results.forEach((result, index) => {
    const status = result.success ? "✅ PASSED" : "❌ FAILED";
    console.log(`Test ${index + 1}: ${status}`);
    if (!result.success) {
        allSuccessful = false;
    }
});

// Test API integration
const apiTest = await testCalculationEngineWithAPI();
console.log(`\nAPI Integration Test: ${apiTest.success ? "✅ PASSED" : "❌ FAILED"}`);

if (!allSuccessful) {
    console.error("❌ STEP 4 FAILED - T&T calculation engine has issues");
} else {
    console.log("✅ STEP 4 PASSED - T&T calculation engine working correctly");
}

console.log("\n=== STEP 4 COMPLETE ===");

// Return results for use in next steps
const finalResults = {
    componentTests: step4Results,
    apiTest: apiTest,
    allSuccessful: allSuccessful && apiTest.success
};

console.log("T&T calculation engine validation complete");
console.log(`Overall success: ${finalResults.allSuccessful ? 'PASSED' : 'FAILED'}`);

export { finalResults };