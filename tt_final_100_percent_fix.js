/**
 * Final T&T 100% Success Rate Fix
 * Fix remaining locations to achieve 100% validation success rate
 */

console.log("=== FINAL T&T 100% SUCCESS RATE FIX ===");

// Current system vs PDF source rates for remaining problematic locations
const REMAINING_ISSUES = {
    "Singapore/Singapore": {
        currentSystem: { total: 2600, construction: 1820, looseFurniture: 260, audioVisual: 182, professionalFees: 338 },
        pdfSource: { total: 3200, construction: 2288, looseFurniture: 343, audioVisual: 201, professionalFees: 368 },
        variance: 18.8 // Outside 15% tolerance
    }
};

// Also identify component-level issues across all locations
const COMPONENT_ACCURACY_ISSUES = {
    "looseFurniture": { success: "66.7%", needsImprovement: ["Canada/Toronto", "Canada/Vancouver", "Singapore/Singapore"] },
    "professionalFees": { success: "50.0%", needsImprovement: ["Canada/Toronto", "Canada/Vancouver", "United States/New York"] },
    "audioVisual": { success: "83.3%", needsImprovement: ["United States/New York"] }
};

function calculateAdjustmentFactors() {
    console.log("Calculating adjustment factors for remaining issues...");
    
    const adjustmentFactors = {};
    
    // Fix Singapore
    const singapore = REMAINING_ISSUES["Singapore/Singapore"];
    const singaporeFactors = {};
    
    console.log("\nSingapore/Singapore adjustment factors:");
    ["construction", "looseFurniture", "audioVisual", "professionalFees"].forEach(component => {
        const factor = singapore.pdfSource[component] / singapore.currentSystem[component];
        singaporeFactors[component] = factor;
        console.log(`  ${component}: multiply by ${factor.toFixed(3)}`);
    });
    
    adjustmentFactors["Singapore/Singapore"] = singaporeFactors;
    
    return adjustmentFactors;
}

function generateOptimalRates() {
    console.log("\nGenerating optimal rates for Singapore...");
    
    const singapore = REMAINING_ISSUES["Singapore/Singapore"];
    const adjustmentFactors = calculateAdjustmentFactors()["Singapore/Singapore"];
    
    // Calculate adjusted rates
    const adjustedRates = {};
    ["construction", "looseFurniture", "audioVisual", "professionalFees"].forEach(component => {
        adjustedRates[component] = Math.round(singapore.currentSystem[component] * adjustmentFactors[component]);
    });
    
    adjustedRates.total = Object.values(adjustedRates).reduce((sum, rate) => sum + rate, 0);
    
    console.log("Singapore adjusted rates:");
    console.log(`  Total: ${adjustedRates.total}/sqm (was ${singapore.currentSystem.total})`);
    console.log(`  Construction: ${adjustedRates.construction}/sqm (was ${singapore.currentSystem.construction})`);
    console.log(`  Loose Furniture: ${adjustedRates.looseFurniture}/sqm (was ${singapore.currentSystem.looseFurniture})`);
    console.log(`  Audio-Visual: ${adjustedRates.audioVisual}/sqm (was ${singapore.currentSystem.audioVisual})`);
    console.log(`  Professional Fees: ${adjustedRates.professionalFees}/sqm (was ${singapore.currentSystem.professionalFees})`);
    
    // Verify variance
    const newVariance = Math.abs((adjustedRates.total - singapore.pdfSource.total) / singapore.pdfSource.total * 100);
    console.log(`  New variance: ${newVariance.toFixed(1)}% (was ${singapore.variance}%)`);
    
    return {
        singapore: adjustedRates,
        variance: newVariance
    };
}

function identifyComponentIssues() {
    console.log("\n=== ANALYZING COMPONENT-LEVEL ISSUES ===");
    
    // Professional fees calculation seems to be the main issue
    // Based on the validation results, these locations need professional fees adjustments
    const professionalFeesIssues = {
        "Canada/Toronto": { current: 423, source: 187, variance: 126.2 },
        "Canada/Vancouver": { current: 410, source: 161, variance: 154.7 },
        "United States/New York": { current: 676, source: 326, variance: 107.4 }
    };
    
    console.log("Professional Fees calculation issues:");
    Object.entries(professionalFeesIssues).forEach(([location, data]) => {
        console.log(`  ${location}: ${data.current} vs ${data.source} (${data.variance}% variance)`);
    });
    
    // Audio-Visual issues
    const audioVisualIssues = {
        "United States/New York": { current: 364, source: 200, variance: 82.0 }
    };
    
    console.log("\nAudio-Visual calculation issues:");
    Object.entries(audioVisualIssues).forEach(([location, data]) => {
        console.log(`  ${location}: ${data.current} vs ${data.source} (${data.variance}% variance)`);
    });
    
    return { professionalFeesIssues, audioVisualIssues };
}

function calculateComponentAdjustments() {
    console.log("\n=== CALCULATING COMPONENT ADJUSTMENTS ===");
    
    const componentIssues = identifyComponentIssues();
    const componentAdjustments = {};
    
    // Professional fees adjustments
    Object.entries(componentIssues.professionalFeesIssues).forEach(([location, data]) => {
        const adjustmentFactor = data.source / data.current;
        if (!componentAdjustments[location]) componentAdjustments[location] = {};
        componentAdjustments[location].professionalFees = adjustmentFactor;
        console.log(`${location} professional fees: multiply by ${adjustmentFactor.toFixed(3)}`);
    });
    
    // Audio-Visual adjustments
    Object.entries(componentIssues.audioVisualIssues).forEach(([location, data]) => {
        const adjustmentFactor = data.source / data.current;
        if (!componentAdjustments[location]) componentAdjustments[location] = {};
        componentAdjustments[location].audioVisual = adjustmentFactor;
        console.log(`${location} audio-visual: multiply by ${adjustmentFactor.toFixed(3)}`);
    });
    
    return componentAdjustments;
}

async function testPotentialImprovements() {
    console.log("\n=== TESTING POTENTIAL IMPROVEMENTS ===");
    
    // Test current Singapore rates vs what they should be
    const singaporeTest = await fetch('http://localhost:5000/api/calculate-budget', {
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
    
    if (singaporeTest.ok) {
        const result = await singaporeTest.json();
        console.log("Current Singapore API result:");
        console.log(`  Total: ${result.rawUnitCost}/sqm`);
        console.log(`  Construction: ${Math.round(result.costsBreakdown.Construction / 1000)}/sqm`);
        console.log(`  Loose Furniture: ${Math.round(result.costsBreakdown['Loose Furniture'] / 1000)}/sqm`);
        console.log(`  Audio-Visual: ${Math.round(result.costsBreakdown['Audio-Visual'] / 1000)}/sqm`);
        console.log(`  Professional Fees: ${Math.round(result.costsBreakdown['Professional Fees'] / 1000)}/sqm`);
        
        const variance = Math.abs((result.rawUnitCost - 3200) / 3200 * 100);
        console.log(`  Variance from PDF source: ${variance.toFixed(1)}%`);
        
        return {
            success: true,
            current: result.rawUnitCost,
            variance: variance
        };
    } else {
        console.log("❌ Singapore API test failed");
        return { success: false };
    }
}

function generateImplementationPlan() {
    console.log("\n=== FINAL IMPLEMENTATION PLAN ===");
    
    const adjustmentFactors = calculateAdjustmentFactors();
    const componentAdjustments = calculateComponentAdjustments();
    const optimalRates = generateOptimalRates();
    
    console.log("To achieve 100% T&T validation success rate:");
    
    console.log("\n1. Fix Singapore/Singapore (18.8% variance → 0.0%):");
    console.log("   Update client/src/utils/tt2025Data.ts Singapore entry:");
    console.log(`   - Total: ${optimalRates.singapore.total}/sqm`);
    console.log(`   - Construction: ${optimalRates.singapore.construction}/sqm`);
    console.log(`   - Loose Furniture: ${optimalRates.singapore.looseFurniture}/sqm`);
    console.log(`   - Audio-Visual: ${optimalRates.singapore.audioVisual}/sqm`);
    console.log(`   - Professional Fees: ${optimalRates.singapore.professionalFees}/sqm`);
    
    console.log("\n2. Consider component-level improvements:");
    console.log("   - Professional fees calculation methodology review");
    console.log("   - Audio-visual component rate validation");
    console.log("   - Loose furniture regional variations");
    
    console.log("\n3. Expected final results:");
    console.log("   - Singapore: 18.8% → 0.0% variance");
    console.log("   - Overall success rate: 85.7% → 100.0%");
    console.log("   - All 7 locations within 15% tolerance");
    
    return {
        adjustmentFactors,
        componentAdjustments,
        optimalRates,
        expectedSuccessRate: 100.0
    };
}

// Execute final fix analysis
console.log("Starting final T&T 100% success rate analysis...");

const adjustmentFactors = calculateAdjustmentFactors();
const componentIssues = identifyComponentIssues();
const componentAdjustments = calculateComponentAdjustments();
const optimalRates = generateOptimalRates();
const apiTest = await testPotentialImprovements();
const implementationPlan = generateImplementationPlan();

console.log("\n=== FINAL ANALYSIS COMPLETE ===");
console.log("Ready to implement Singapore rate adjustments");
console.log("Target: 100% T&T validation success rate");

export { implementationPlan, optimalRates, adjustmentFactors };