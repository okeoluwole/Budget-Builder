/**
 * Singapore Rates Alignment Check
 * Compare T&T PDF source document rates with our current system implementation
 */

console.log("=== SINGAPORE RATES ALIGNMENT CHECK ===");

// Singapore rates from T&T PDF source document (image_1752344611995.png)
const PDF_SINGAPORE_RATES = {
    total: { low: 205.67, medium: 268.95, high: 343.78 },
    construction: { low: 153.71, medium: 197.51, high: 261.15 },
    looseFurniture: { low: 17.59, medium: 24.06, high: 27.50 },
    audioVisual: { low: 12.37, medium: 17.58, high: 20.62 },
    professionalFees: { low: 22.40, medium: 29.98, high: 36.50 }
};

// Current system rates (after our adjustments)
const CURRENT_SYSTEM_RATES = {
    total: { low: 2705.0, medium: 3200.0, high: 4185.0 },
    construction: { low: 1937.0, medium: 2288.0, high: 2992.0 },
    looseFurniture: { low: 290.0, medium: 343.0, high: 448.0 },
    audioVisual: { low: 170.0, medium: 201.0, high: 263.0 },
    professionalFees: { low: 312.0, medium: 368.0, high: 482.0 }
};

console.log("\n=== RATE COMPARISON ANALYSIS ===");

// Check if PDF rates are in different units ($/sqft vs $/sqm)
console.log("PDF Singapore rates (from T&T source document):");
console.log(`  Total Medium: $${PDF_SINGAPORE_RATES.total.medium}/unit`);
console.log(`  Construction Medium: $${PDF_SINGAPORE_RATES.construction.medium}/unit`);
console.log(`  Loose Furniture Medium: $${PDF_SINGAPORE_RATES.looseFurniture.medium}/unit`);
console.log(`  Audio-Visual Medium: $${PDF_SINGAPORE_RATES.audioVisual.medium}/unit`);
console.log(`  Professional Fees Medium: $${PDF_SINGAPORE_RATES.professionalFees.medium}/unit`);

console.log("\nCurrent System rates:");
console.log(`  Total Medium: $${CURRENT_SYSTEM_RATES.total.medium}/sqm`);
console.log(`  Construction Medium: $${CURRENT_SYSTEM_RATES.construction.medium}/sqm`);
console.log(`  Loose Furniture Medium: $${CURRENT_SYSTEM_RATES.looseFurniture.medium}/sqm`);
console.log(`  Audio-Visual Medium: $${CURRENT_SYSTEM_RATES.audioVisual.medium}/sqm`);
console.log(`  Professional Fees Medium: $${CURRENT_SYSTEM_RATES.professionalFees.medium}/sqm`);

// Calculate conversion factor (PDF might be in sqft, system is in sqm)
const SQFT_TO_SQM_FACTOR = 10.764; // 1 sqm = 10.764 sqft

console.log("\n=== UNIT CONVERSION ANALYSIS ===");

// Convert PDF rates from sqft to sqm (multiply by 10.764)
const PDF_CONVERTED_TO_SQM = {
    total: { low: PDF_SINGAPORE_RATES.total.low * SQFT_TO_SQM_FACTOR, 
             medium: PDF_SINGAPORE_RATES.total.medium * SQFT_TO_SQM_FACTOR, 
             high: PDF_SINGAPORE_RATES.total.high * SQFT_TO_SQM_FACTOR },
    construction: { low: PDF_SINGAPORE_RATES.construction.low * SQFT_TO_SQM_FACTOR, 
                    medium: PDF_SINGAPORE_RATES.construction.medium * SQFT_TO_SQM_FACTOR, 
                    high: PDF_SINGAPORE_RATES.construction.high * SQFT_TO_SQM_FACTOR },
    looseFurniture: { low: PDF_SINGAPORE_RATES.looseFurniture.low * SQFT_TO_SQM_FACTOR, 
                      medium: PDF_SINGAPORE_RATES.looseFurniture.medium * SQFT_TO_SQM_FACTOR, 
                      high: PDF_SINGAPORE_RATES.looseFurniture.high * SQFT_TO_SQM_FACTOR },
    audioVisual: { low: PDF_SINGAPORE_RATES.audioVisual.low * SQFT_TO_SQM_FACTOR, 
                   medium: PDF_SINGAPORE_RATES.audioVisual.medium * SQFT_TO_SQM_FACTOR, 
                   high: PDF_SINGAPORE_RATES.audioVisual.high * SQFT_TO_SQM_FACTOR },
    professionalFees: { low: PDF_SINGAPORE_RATES.professionalFees.low * SQFT_TO_SQM_FACTOR, 
                        medium: PDF_SINGAPORE_RATES.professionalFees.medium * SQFT_TO_SQM_FACTOR, 
                        high: PDF_SINGAPORE_RATES.professionalFees.high * SQFT_TO_SQM_FACTOR }
};

console.log("PDF rates converted to $/sqm:");
console.log(`  Total Medium: $${Math.round(PDF_CONVERTED_TO_SQM.total.medium)}/sqm`);
console.log(`  Construction Medium: $${Math.round(PDF_CONVERTED_TO_SQM.construction.medium)}/sqm`);
console.log(`  Loose Furniture Medium: $${Math.round(PDF_CONVERTED_TO_SQM.looseFurniture.medium)}/sqm`);
console.log(`  Audio-Visual Medium: $${Math.round(PDF_CONVERTED_TO_SQM.audioVisual.medium)}/sqm`);
console.log(`  Professional Fees Medium: $${Math.round(PDF_CONVERTED_TO_SQM.professionalFees.medium)}/sqm`);

console.log("\n=== ALIGNMENT VERIFICATION ===");

// Check alignment with converted rates
const components = ['total', 'construction', 'looseFurniture', 'audioVisual', 'professionalFees'];
const alignmentResults = {};

components.forEach(component => {
    const pdfRate = Math.round(PDF_CONVERTED_TO_SQM[component].medium);
    const systemRate = CURRENT_SYSTEM_RATES[component].medium;
    const variance = Math.abs(pdfRate - systemRate);
    const variancePercent = (variance / pdfRate) * 100;
    
    alignmentResults[component] = {
        pdfRate: pdfRate,
        systemRate: systemRate,
        variance: variance,
        variancePercent: variancePercent,
        aligned: variancePercent <= 5 // 5% tolerance for alignment
    };
    
    console.log(`${component}: PDF ${pdfRate} vs System ${systemRate} (${variancePercent.toFixed(1)}% variance) ${alignmentResults[component].aligned ? '✅' : '❌'}`);
});

console.log("\n=== FINAL ALIGNMENT CONCLUSION ===");

const alignedComponents = Object.values(alignmentResults).filter(r => r.aligned).length;
const totalComponents = Object.keys(alignmentResults).length;
const alignmentPercentage = (alignedComponents / totalComponents) * 100;

console.log(`Components aligned: ${alignedComponents}/${totalComponents} (${alignmentPercentage}%)`);

if (alignmentPercentage >= 80) {
    console.log("✅ EXCELLENT ALIGNMENT: Singapore rates properly aligned with T&T PDF source document");
} else if (alignmentPercentage >= 60) {
    console.log("⚠️ PARTIAL ALIGNMENT: Some components need adjustment");
} else {
    console.log("❌ POOR ALIGNMENT: Significant adjustments needed");
}

// Test current system API to verify live rates
async function testCurrentSystemAPI() {
    console.log("\n=== TESTING CURRENT SYSTEM API ===");
    
    try {
        const response = await fetch('http://localhost:5000/api/calculate-budget', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                project: {
                    city: "Singapore",
                    country: "Singapore",
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
            console.log("Current API response:");
            console.log(`  Total: $${result.rawUnitCost}/sqm`);
            console.log(`  Construction: $${Math.round(result.costsBreakdown.Construction / 1000)}/sqm`);
            console.log(`  Loose Furniture: $${Math.round(result.costsBreakdown['Loose Furniture'] / 1000)}/sqm`);
            console.log(`  Audio-Visual: $${Math.round(result.costsBreakdown['Audio-Visual'] / 1000)}/sqm`);
            console.log(`  Professional Fees: $${Math.round(result.costsBreakdown['Professional Fees'] / 1000)}/sqm`);
            
            // Compare with PDF converted rates
            const apiTotal = result.rawUnitCost;
            const pdfTotal = Math.round(PDF_CONVERTED_TO_SQM.total.medium);
            const apiVariance = Math.abs(apiTotal - pdfTotal);
            const apiVariancePercent = (apiVariance / pdfTotal) * 100;
            
            console.log(`\nAPI vs PDF comparison: ${apiTotal} vs ${pdfTotal} (${apiVariancePercent.toFixed(1)}% variance)`);
            
            return {
                success: true,
                apiTotal: apiTotal,
                pdfTotal: pdfTotal,
                variance: apiVariancePercent,
                aligned: apiVariancePercent <= 5
            };
        } else {
            console.log("❌ API test failed");
            return { success: false };
        }
    } catch (error) {
        console.log("❌ API test error:", error.message);
        return { success: false, error: error.message };
    }
}

// Execute the alignment check
console.log("Starting Singapore rates alignment verification...");
const apiTest = await testCurrentSystemAPI();

console.log("\n=== ALIGNMENT CHECK COMPLETE ===");
console.log(`System alignment with T&T PDF: ${alignmentPercentage}%`);
if (apiTest.success) {
    console.log(`API alignment with T&T PDF: ${apiTest.aligned ? 'ALIGNED' : 'NOT ALIGNED'} (${apiTest.variance.toFixed(1)}% variance)`);
}

export { alignmentResults, PDF_CONVERTED_TO_SQM, apiTest };