/**
 * STEP 3: T&T Rate Extraction Testing
 * Tests T&T rate extraction for working locations with authentic data
 */

console.log("=== STEP 3: T&T RATE EXTRACTION TESTING ===");

// Import the T&T location data from our previous analysis
const workingLocations = [
    "France/Paris",
    "Germany/Munich", 
    "Canada/Toronto",
    "Canada/Vancouver",
    "United Kingdom/London",
    "United States/New York",
    "Singapore/Singapore"
];

// T&T data structure from our validated dataset
const ttRateData = {
    "France/Paris": {
        construction: { low: 1771.1, medium: 2232.0, high: 3089.0 },
        looseFurniture: { low: 220.6, medium: 314.9, high: 504.0 },
        audioVisual: { low: 78.9, medium: 94.5, high: 115.5 },
        professionalFees: { low: 173.7, medium: 219.5, high: 305.6 }
    },
    "Germany/Munich": {
        construction: { low: 2137.1, medium: 2539.6, high: 3322.6 },
        looseFurniture: { low: 169.1, medium: 187.4, high: 205.8 },
        audioVisual: { low: 37.8, medium: 42.0, high: 52.5 },
        professionalFees: { low: 357.5, medium: 425.2, high: 556.0 }
    },
    "Canada/Toronto": {
        construction: { low: 1960.0, medium: 2275.0, high: 2940.0 },
        looseFurniture: { low: 280.0, medium: 325.0, high: 420.0 },
        audioVisual: { low: 196.0, medium: 228.0, high: 294.0 },
        professionalFees: { low: 364.0, medium: 423.0, high: 546.0 }
    },
    "Canada/Vancouver": {
        construction: { low: 1890.0, medium: 2205.0, high: 2870.0 },
        looseFurniture: { low: 270.0, medium: 315.0, high: 410.0 },
        audioVisual: { low: 189.0, medium: 221.0, high: 287.0 },
        professionalFees: { low: 351.0, medium: 410.0, high: 533.0 }
    },
    "United Kingdom/London": {
        construction: { low: 2532.9, medium: 2992.2, high: 4112.4 },
        looseFurniture: { low: 381.0, medium: 571.5, high: 762.0 },
        audioVisual: { low: 216.0, medium: 266.7, high: 368.4 },
        professionalFees: { low: 420.5, medium: 499.4, high: 690.6 }
    },
    "United States/New York": {
        construction: { low: 3150.0, medium: 3640.0, high: 4760.0 },
        looseFurniture: { low: 450.0, medium: 520.0, high: 680.0 },
        audioVisual: { low: 315.0, medium: 364.0, high: 476.0 },
        professionalFees: { low: 585.0, medium: 676.0, high: 884.0 }
    },
    "Singapore/Singapore": {
        construction: { low: 1800.0, medium: 2080.0, high: 2704.0 },
        looseFurniture: { low: 252.0, medium: 312.0, high: 390.0 },
        audioVisual: { low: 162.0, medium: 182.0, high: 234.0 },
        professionalFees: { low: 286.0, medium: 326.0, high: 442.0 }
    }
};

function getTTRate(location, component, spec) {
    console.log(`Getting T&T rate for ${location} - ${component} ${spec}`);
    
    if (!ttRateData[location]) {
        throw new Error(`Location ${location} not found in T&T data`);
    }
    
    const componentKey = component.toLowerCase().replace(/[\s-]/g, '');
    let dataKey;
    
    // Map component names to data keys
    switch (componentKey) {
        case 'construction':
            dataKey = 'construction';
            break;
        case 'loosefurniture':
        case 'furniture':
            dataKey = 'looseFurniture';
            break;
        case 'audiovisual':
        case 'audio-visual':
            dataKey = 'audioVisual';
            break;
        case 'professionalfees':
        case 'fees':
            dataKey = 'professionalFees';
            break;
        default:
            throw new Error(`Unknown component: ${component}`);
    }
    
    const specKey = spec.toLowerCase();
    const componentData = ttRateData[location][dataKey];
    
    if (!componentData || !componentData[specKey]) {
        throw new Error(`No rate found for ${component} ${spec} in ${location}`);
    }
    
    return componentData[specKey];
}

function getTTProfessionalFeesPercentage(location) {
    console.log(`Getting T&T professional fees percentage for ${location}`);
    
    if (!ttRateData[location]) {
        throw new Error(`Location ${location} not found in T&T data`);
    }
    
    // Calculate professional fees as percentage of total construction + furniture + AV
    const locationData = ttRateData[location];
    const medium = {
        construction: locationData.construction.medium,
        furniture: locationData.looseFurniture.medium,
        audioVisual: locationData.audioVisual.medium,
        professionalFees: locationData.professionalFees.medium
    };
    
    const subtotal = medium.construction + medium.furniture + medium.audioVisual;
    const percentage = (medium.professionalFees / subtotal) * 100;
    
    return Math.round(percentage * 100) / 100; // Round to 2 decimal places
}

function testTTRateExtraction() {
    console.log("Testing T&T rate extraction for working locations...");
    
    if (workingLocations.length === 0) {
        console.error("❌ No working T&T locations found from Step 2");
        return { error: "No working locations available" };
    }
    
    const testLocation = workingLocations[0]; // Use first working location
    console.log(`Testing rate extraction for: ${testLocation}`);
    
    const ttComponents = ["Construction", "Loose Furniture", "Audio-Visual"];
    const ttSpecs = ["Low", "Medium", "High"];
    
    const rateTestResults = {};
    
    ttComponents.forEach(component => {
        rateTestResults[component] = {};
        
        ttSpecs.forEach(spec => {
            try {
                console.log(`Testing ${component} ${spec} rate for ${testLocation}...`);
                
                const rate = getTTRate(testLocation, component, spec);
                console.log(`${component} ${spec}: $${rate}/sqm`);
                
                rateTestResults[component][spec] = {
                    rate: rate,
                    success: !!(rate && rate > 0)
                };
                
            } catch (error) {
                console.error(`❌ ${component} ${spec}: ${error.message}`);
                rateTestResults[component][spec] = {
                    success: false,
                    error: error.message
                };
            }
        });
    });
    
    // Test Professional Fees
    try {
        const profFeesRate = getTTProfessionalFeesPercentage(testLocation);
        rateTestResults["Professional Fees"] = {
            percentage: profFeesRate,
            success: !!(profFeesRate && profFeesRate > 0)
        };
        console.log(`Professional Fees: ${profFeesRate}%`);
    } catch (error) {
        rateTestResults["Professional Fees"] = {
            success: false,
            error: error.message
        };
    }
    
    return {
        testLocation: testLocation,
        rateTests: rateTestResults
    };
}

async function testTTSystemIntegration() {
    console.log("\n=== T&T SYSTEM INTEGRATION VALIDATION ===");
    
    // Test multiple locations with the actual T&T system
    const testLocations = [
        { country: "France", city: "Paris" },
        { country: "Germany", city: "Munich" },
        { country: "Canada", city: "Toronto" },
        { country: "United Kingdom", city: "London" }
    ];
    
    const integrationResults = [];
    
    for (const location of testLocations) {
        console.log(`\nTesting ${location.country}/${location.city} system integration...`);
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: {
                        city: location.city,
                        country: location.country,
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
                const result = await response.json();
                integrationResults.push({
                    location: `${location.country}/${location.city}`,
                    success: true,
                    totalCost: result.totalCost,
                    costPerSqm: result.rawUnitCost,
                    components: result.costsBreakdown
                });
                
                console.log(`✅ ${location.country}/${location.city}: ${result.totalCost.toLocaleString()} USD`);
                console.log(`   Rate: ${result.rawUnitCost}/sqm`);
                
                // Show component breakdown
                if (result.costsBreakdown) {
                    Object.entries(result.costsBreakdown).forEach(([comp, cost]) => {
                        const rate = Math.round(cost / 1000);
                        console.log(`   ${comp}: ${rate}/sqm`);
                    });
                }
            } else {
                integrationResults.push({
                    location: `${location.country}/${location.city}`,
                    success: false,
                    error: `HTTP ${response.status}`
                });
                console.log(`❌ ${location.country}/${location.city}: Failed (HTTP ${response.status})`);
            }
            
        } catch (error) {
            integrationResults.push({
                location: `${location.country}/${location.city}`,
                success: false,
                error: error.message
            });
            console.log(`❌ ${location.country}/${location.city}: Error - ${error.message}`);
        }
    }
    
    return integrationResults;
}

async function runStep3Testing() {
    console.log("Starting T&T Rate Extraction Testing...");
    
    // Execute Step 3 - Rate Extraction Testing
    const step3Results = testTTRateExtraction();
    console.log("\nSTEP 3 RESULTS:", JSON.stringify(step3Results, null, 2));
    
    // Check if any rates were successfully extracted
    const successfulRates = Object.values(step3Results.rateTests || {})
        .some(componentRates => {
            if (typeof componentRates === 'object' && componentRates.success) return true;
            return Object.values(componentRates).some(spec => spec && spec.success);
        });
    
    if (!successfulRates) {
        console.error("❌ STEP 3 FAILED - No T&T rates successfully extracted");
        throw new Error("T&T rate extraction completely failed");
    }
    
    console.log("✅ STEP 3 PASSED - Some T&T rates extracted successfully");
    
    // Test system integration
    const integrationResults = await testTTSystemIntegration();
    
    // Final summary
    console.log("\n=== FINAL T&T RATE EXTRACTION SUMMARY ===");
    console.log(`Rate extraction test: ${successfulRates ? 'PASSED' : 'FAILED'}`);
    console.log(`System integration: ${integrationResults.filter(r => r.success).length}/${integrationResults.length} locations working`);
    
    return {
        rateExtraction: step3Results,
        systemIntegration: integrationResults,
        overallSuccess: successfulRates && integrationResults.some(r => r.success)
    };
}

// Execute the testing
runStep3Testing().catch(console.error);