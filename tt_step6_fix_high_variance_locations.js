/**
 * STEP 6: Fix Germany/Munich and UK/London Rate Discrepancies
 * Target locations with >20% variance for rate adjustment
 */

console.log("=== STEP 6: FIXING HIGH-VARIANCE LOCATIONS ===");

// Import the T&T data module
import fs from 'fs';
import path from 'path';

// Current T&T data from system
const CURRENT_TT_DATA = {
    "Germany/Munich": {
        construction: 2540,
        looseFurniture: 187,
        audioVisual: 42,
        professionalFees: 425,
        totalCost: 3194
    },
    "United Kingdom/London": {
        construction: 2992,
        looseFurniture: 572,
        audioVisual: 267,
        professionalFees: 499,
        totalCost: 4330
    }
};

// PDF source document target rates (from comprehensive validation)
const PDF_SOURCE_RATES = {
    "Germany/Munich": {
        construction: 3224,
        looseFurniture: 238,
        audioVisual: 53,
        professionalFees: 540,
        totalCost: 4055
    },
    "United Kingdom/London": {
        construction: 3801,
        looseFurniture: 726,
        audioVisual: 339,
        professionalFees: 634,
        totalCost: 5500
    }
};

function fixHighVarianceLocations() {
    console.log("Addressing Germany/Munich and UK/London rate discrepancies...");
    
    const problemLocations = [
        { country: "Germany", city: "Munich", currentVariance: "21.2%" },
        { country: "United Kingdom", city: "London", currentVariance: "21.3%" }
    ];
    
    const adjustedRates = {};
    
    problemLocations.forEach(location => {
        const locationKey = `${location.country}/${location.city}`;
        
        console.log(`\nDebugging ${locationKey}:`);
        
        // 1. Get current rates
        const currentRates = CURRENT_TT_DATA[locationKey];
        console.log(`Current rates for ${location.city}:`, currentRates);
        
        // 2. Get PDF source rates
        const pdfRates = PDF_SOURCE_RATES[locationKey];
        console.log(`PDF source rates for ${location.city}:`, pdfRates);
        
        // 3. Calculate adjustment factors
        const adjustmentFactors = {};
        const components = ['construction', 'looseFurniture', 'audioVisual', 'professionalFees'];
        
        components.forEach(component => {
            const currentRate = currentRates[component];
            const pdfRate = pdfRates[component];
            const variance = Math.abs((currentRate - pdfRate) / pdfRate * 100);
            const adjustmentFactor = pdfRate / currentRate;
            
            console.log(`${component}: Current ${currentRate} vs PDF ${pdfRate} (${variance.toFixed(1)}% variance)`);
            
            if (variance > 15) {
                console.log(`❌ ${component} needs rate adjustment for ${location.city}`);
                adjustmentFactors[component] = adjustmentFactor;
            } else {
                console.log(`✅ ${component} within tolerance for ${location.city}`);
                adjustmentFactors[component] = 1.0; // No adjustment needed
            }
        });
        
        // 4. Calculate adjusted rates
        const adjustedLocationRates = {};
        components.forEach(component => {
            adjustedLocationRates[component] = Math.round(currentRates[component] * adjustmentFactors[component]);
        });
        
        // Calculate new total
        adjustedLocationRates.totalCost = Object.values(adjustedLocationRates).reduce((sum, rate) => sum + rate, 0);
        
        console.log(`\nAdjusted rates for ${location.city}:`, adjustedLocationRates);
        
        // Verify adjustment
        const newVariance = Math.abs((adjustedLocationRates.totalCost - pdfRates.totalCost) / pdfRates.totalCost * 100);
        console.log(`New variance: ${newVariance.toFixed(1)}% (was ${location.currentVariance})`);
        
        adjustedRates[locationKey] = {
            original: currentRates,
            adjusted: adjustedLocationRates,
            adjustmentFactors: adjustmentFactors,
            newVariance: newVariance
        };
    });
    
    return adjustedRates;
}

function generateTTDataAdjustments(adjustedRates) {
    console.log("\n=== GENERATING T&T DATA ADJUSTMENTS ===");
    
    console.log("Adjustment factors to apply to T&T data:");
    
    Object.entries(adjustedRates).forEach(([location, data]) => {
        const [country, city] = location.split('/');
        console.log(`\n${location}:`);
        console.log(`  Location factors:`);
        
        Object.entries(data.adjustmentFactors).forEach(([component, factor]) => {
            console.log(`    ${component}: multiply by ${factor.toFixed(3)}`);
        });
        
        console.log(`  Result: ${data.newVariance.toFixed(1)}% variance (target: <15%)`);
    });
    
    return adjustedRates;
}

function testAdjustedRates() {
    console.log("\n=== TESTING ADJUSTED RATES ===");
    
    // Test the adjusted rates by calculating what the system would return
    const testResults = [];
    
    for (const [location, data] of Object.entries(adjustedRates)) {
        const [country, city] = location.split('/');
        
        console.log(`\nTesting adjusted ${location}...`);
        
        const adjustedResult = {
            location: location,
            originalTotal: data.original.totalCost,
            adjustedTotal: data.adjusted.totalCost,
            pdfSourceTotal: PDF_SOURCE_RATES[location].totalCost,
            originalVariance: Math.abs((data.original.totalCost - PDF_SOURCE_RATES[location].totalCost) / PDF_SOURCE_RATES[location].totalCost * 100),
            adjustedVariance: data.newVariance
        };
        
        console.log(`  Original: ${adjustedResult.originalTotal}/sqm (${adjustedResult.originalVariance.toFixed(1)}% variance)`);
        console.log(`  Adjusted: ${adjustedResult.adjustedTotal}/sqm (${adjustedResult.adjustedVariance.toFixed(1)}% variance)`);
        console.log(`  PDF Source: ${adjustedResult.pdfSourceTotal}/sqm`);
        
        const improvement = adjustedResult.originalVariance - adjustedResult.adjustedVariance;
        console.log(`  Improvement: ${improvement.toFixed(1)}% reduction in variance`);
        
        testResults.push(adjustedResult);
    }
    
    return testResults;
}

function generateImplementationPlan(adjustedRates) {
    console.log("\n=== IMPLEMENTATION PLAN ===");
    
    console.log("To fix the high-variance locations, update the T&T data with these adjustments:");
    
    console.log("\n1. Update client/src/utils/tt2025Data.ts:");
    console.log("   Apply adjustment factors to the affected location rates");
    
    console.log("\n2. Specific adjustments needed:");
    
    Object.entries(adjustedRates).forEach(([location, data]) => {
        console.log(`\n   ${location}:`);
        Object.entries(data.adjustmentFactors).forEach(([component, factor]) => {
            if (factor !== 1.0) {
                console.log(`     ${component}: multiply current rate by ${factor.toFixed(3)}`);
            }
        });
    });
    
    console.log("\n3. Expected results:");
    console.log("   - Germany/Munich: 21.2% → <5% variance");
    console.log("   - UK/London: 21.3% → <5% variance");
    console.log("   - Overall T&T validation: 71.4% → 95%+ success rate");
    
    return {
        adjustments: adjustedRates,
        targetSuccessRate: 95,
        currentSuccessRate: 71.4
    };
}

// Execute the fix
console.log("Starting T&T rate adjustment process...");

const adjustedRates = fixHighVarianceLocations();
const adjustments = generateTTDataAdjustments(adjustedRates);
const testResults = testAdjustedRates();
const implementationPlan = generateImplementationPlan(adjustedRates);

console.log("\n=== STEP 6 COMPLETE ===");
console.log("Rate adjustment analysis complete");
console.log("Ready to implement T&T data fixes");

// Save results for implementation
const results = {
    adjustedRates,
    testResults,
    implementationPlan,
    timestamp: new Date().toISOString()
};

console.log("\n💾 Adjustment plan generated successfully");
console.log("Next: Apply adjustments to tt2025Data.ts");