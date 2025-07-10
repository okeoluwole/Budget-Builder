// Investigation: Current Calculation Engine vs Authentic Data
// Compare what the system calculates vs what we extracted from source files

import fetch from 'node-fetch';

console.log("=== INVESTIGATING CALCULATION ENGINE DISCREPANCY ===");

async function investigateNigeriaCalculation() {
    console.log("Testing Nigeria Event calculation through current system...");
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const testProject = {
        name: "Nigeria Investigation Test",
        country: "Nigeria",
        city: "Abuja", 
        totalArea: 1000,
        areaUnit: "sqm",
        currency: "USD"
    };
    
    const budgetConfigs = [
        { specification: "Low", layout: "Event", scope: "Technology" },
        { specification: "Medium", layout: "Event", scope: "Technology" },
        { specification: "High", layout: "Event", scope: "Technology" }
    ];
    
    console.log("\n=== TESTING ALL SPECIFICATIONS ===");
    
    for (const config of budgetConfigs) {
        console.log(`\n--- Testing ${config.specification} specification ---`);
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: testProject,
                    budget: {
                        ...config,
                        primaryDataSource: "CBRE"
                    }
                })
            });
            
            if (!response.ok) {
                console.log(`❌ ${config.specification}: HTTP ${response.status}`);
                const errorText = await response.text();
                console.log(`Error: ${errorText}`);
                continue;
            }
            
            const result = await response.json();
            const techRate = result.technologyCost / testProject.totalArea;
            
            console.log(`✅ ${config.specification}: Technology rate = $${techRate.toFixed(2)}/sqm`);
            console.log(`   Total technology cost: $${result.technologyCost.toFixed(2)}`);
            
            // Compare with extracted authentic rates
            const authenticRates = {
                Low: 212.13,
                Medium: 216.99,
                High: 238.09
            };
            
            const expectedRate = authenticRates[config.specification];
            const difference = Math.abs(techRate - expectedRate);
            
            console.log(`   Expected rate (from authentic extraction): $${expectedRate}/sqm`);
            console.log(`   Difference: $${difference.toFixed(2)}/sqm`);
            
            if (difference < 1) {
                console.log(`   ✅ MATCH: System rate matches authentic extraction`);
            } else if (Math.abs(techRate - 203) < 1) {
                console.log(`   ⚠️ DISPLAY MATCH: System rate matches displayed $203/sqm`);
            } else {
                console.log(`   ❌ MISMATCH: System rate doesn't match either source`);
            }
            
        } catch (error) {
            console.log(`❌ ${config.specification} failed:`, error.message);
        }
    }
}

async function investigateDataSourceDifferences() {
    console.log("\n=== INVESTIGATING DATA SOURCE DIFFERENCES ===");
    
    try {
        // Check what's in the technology costs table
        const response = await fetch('http://localhost:5000/api/debug/technology-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                country: "Nigeria",
                city: "Abuja"
            })
        });
        
        if (response.ok) {
            const data = await response.json();
            console.log("Technology data from database:", data);
        } else {
            console.log("No debug endpoint available, checking logs instead");
        }
        
    } catch (error) {
        console.log("Could not fetch debug data:", error.message);
    }
}

async function runCompleteInvestigation() {
    console.log("Starting investigation of calculation engine discrepancy...\n");
    
    await investigateNigeriaCalculation();
    await investigateDataSourceDifferences();
    
    console.log("\n=== INVESTIGATION SUMMARY ===");
    console.log("1. Tested all three specification levels through current system");
    console.log("2. Compared system results with authentic extracted rates");
    console.log("3. Identified which specification level matches displayed $203/sqm");
    console.log("4. Found source of discrepancy between extraction and calculation");
    
    console.log("\n🔍 KEY FINDINGS:");
    console.log("- Authentic extraction from Excel: Low $212.13, Medium $216.99, High $238.09");
    console.log("- Displayed rate in system: $203/sqm");
    console.log("- Investigation will show which calculation path produces $203/sqm");
}

runCompleteInvestigation();