// CBRE Global Validation Summary Report
// Based on comprehensive analysis of all CBRE source documents

import fs from 'fs';
import xlsx from 'xlsx';
import fetch from 'node-fetch';

console.log("=== CBRE GLOBAL VALIDATION SUMMARY ===");

// Quick validation of key global locations
async function validateKeyGlobalLocations() {
    const keyLocations = [
        { country: "United Kingdom", city: "London", region: "EMEA" },
        { country: "United States", city: "New York", region: "AMERICAS" },
        { country: "Singapore", city: "Singapore", region: "APAC" },
        { country: "Nigeria", city: "Abuja", region: "EMEA" },
        { country: "Australia", city: "Sydney", region: "APAC" },
        { country: "Germany", city: "Frankfurt", region: "EMEA" },
        { country: "Japan", city: "Tokyo", region: "APAC" },
        { country: "Canada", city: "Toronto", region: "AMERICAS" },
        { country: "France", city: "Paris", region: "EMEA" },
        { country: "India", city: "Mumbai", region: "APAC" }
    ];
    
    console.log("\n=== KEY GLOBAL LOCATIONS VALIDATION ===");
    
    const results = [];
    
    for (const location of keyLocations) {
        console.log(`\nTesting: ${location.city}, ${location.country}`);
        
        try {
            const response = await fetch('http://localhost:5000/api/calculate-budget', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project: {
                        name: `Global Test ${location.city}`,
                        country: location.country,
                        city: location.city,
                        totalArea: 1000,
                        areaUnit: "sqm",
                        currency: "USD"
                    },
                    budget: {
                        scope: "Complete",
                        specification: "Medium",
                        layout: "Activity",
                        primaryDataSource: "CBRE"
                    }
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                
                const locationResult = {
                    location: `${location.city}, ${location.country}`,
                    region: location.region,
                    success: true,
                    totalCost: result.totalCost,
                    unitCost: result.totalCost / 1000,
                    components: {
                        fitout: result.fitoutCost || 0,
                        technology: result.technologyCost || 0,
                        furniture: result.furnitureCost || 0,
                        professionalFees: result.costsBreakdown['PROFESSIONAL FEES'] || 0
                    },
                    dataSource: result.datasetInfo
                };
                
                results.push(locationResult);
                
                console.log(`  ✅ Success: $${result.totalCost.toLocaleString()} ($${(result.totalCost/1000).toFixed(2)}/sqm)`);
                console.log(`     Fitout: $${(result.fitoutCost || 0).toLocaleString()}`);
                console.log(`     Technology: $${(result.technologyCost || 0).toLocaleString()}`);
                console.log(`     Furniture: $${(result.furnitureCost || 0).toLocaleString()}`);
                
            } else {
                results.push({
                    location: `${location.city}, ${location.country}`,
                    region: location.region,
                    success: false,
                    error: `HTTP ${response.status}`
                });
                console.log(`  ❌ Failed: HTTP ${response.status}`);
            }
            
        } catch (error) {
            results.push({
                location: `${location.city}, ${location.country}`,
                region: location.region,
                success: false,
                error: error.message
            });
            console.log(`  ❌ Error: ${error.message}`);
        }
    }
    
    return results;
}

// Analyze CBRE coverage by region
function analyzeCBRECoverageByRegion(results) {
    console.log("\n=== REGIONAL COVERAGE ANALYSIS ===");
    
    const regionalData = {
        EMEA: { successful: 0, failed: 0, locations: [] },
        AMERICAS: { successful: 0, failed: 0, locations: [] },
        APAC: { successful: 0, failed: 0, locations: [] }
    };
    
    results.forEach(result => {
        const region = result.region;
        if (regionalData[region]) {
            regionalData[region].locations.push(result);
            if (result.success) {
                regionalData[region].successful++;
            } else {
                regionalData[region].failed++;
            }
        }
    });
    
    Object.entries(regionalData).forEach(([region, data]) => {
        const total = data.successful + data.failed;
        const successRate = total > 0 ? ((data.successful / total) * 100).toFixed(1) : '0';
        
        console.log(`\n--- ${region} REGION ---`);
        console.log(`  Total locations tested: ${total}`);
        console.log(`  Successful: ${data.successful}`);
        console.log(`  Failed: ${data.failed}`);
        console.log(`  Success rate: ${successRate}%`);
        
        if (data.successful > 0) {
            const avgCost = data.locations
                .filter(l => l.success)
                .reduce((sum, l) => sum + l.unitCost, 0) / data.successful;
            console.log(`  Average unit cost: $${avgCost.toFixed(2)}/sqm`);
        }
    });
    
    return regionalData;
}

// Generate data completeness report
function generateDataCompletenessReport(results) {
    console.log("\n=== DATA COMPLETENESS REPORT ===");
    
    const completeness = {
        hasAllComponents: 0,
        missingFitout: 0,
        missingTechnology: 0,
        missingFurniture: 0,
        furnitureOnly: 0
    };
    
    results.filter(r => r.success).forEach(result => {
        const { fitout, technology, furniture } = result.components;
        
        if (fitout > 0 && technology > 0 && furniture > 0) {
            completeness.hasAllComponents++;
        } else {
            if (fitout === 0) completeness.missingFitout++;
            if (technology === 0) completeness.missingTechnology++;
            if (furniture === 0) completeness.missingFurniture++;
            if (furniture > 0 && fitout === 0 && technology === 0) {
                completeness.furnitureOnly++;
            }
        }
    });
    
    const successfulLocations = results.filter(r => r.success).length;
    
    console.log(`  Locations with complete data: ${completeness.hasAllComponents}/${successfulLocations}`);
    console.log(`  Missing fitout data: ${completeness.missingFitout}`);
    console.log(`  Missing technology data: ${completeness.missingTechnology}`);
    console.log(`  Missing furniture data: ${completeness.missingFurniture}`);
    console.log(`  Furniture-only calculations: ${completeness.furnitureOnly}`);
    
    const completenessRate = successfulLocations > 0 ? 
        ((completeness.hasAllComponents / successfulLocations) * 100).toFixed(1) : '0';
    console.log(`  Data completeness rate: ${completenessRate}%`);
    
    return completeness;
}

// Create validation recommendations
function createValidationRecommendations(results, regionalData, completeness) {
    console.log("\n=== VALIDATION RECOMMENDATIONS ===");
    
    const recommendations = [];
    
    // Check overall success rate
    const totalSuccess = results.filter(r => r.success).length;
    const totalTests = results.length;
    const overallSuccessRate = (totalSuccess / totalTests) * 100;
    
    if (overallSuccessRate < 90) {
        recommendations.push("Investigate failed location calculations to improve coverage");
    }
    
    // Check regional performance
    Object.entries(regionalData).forEach(([region, data]) => {
        const regionSuccessRate = (data.successful / (data.successful + data.failed)) * 100;
        if (regionSuccessRate < 80) {
            recommendations.push(`Improve ${region} region data coverage (${regionSuccessRate.toFixed(1)}% success rate)`);
        }
    });
    
    // Check data completeness
    if (completeness.hasAllComponents < totalSuccess * 0.5) {
        recommendations.push("Address missing component data to improve calculation accuracy");
    }
    
    if (completeness.furnitureOnly > 3) {
        recommendations.push("Review furniture-only calculations and ensure fitout/technology data availability");
    }
    
    // Data source recommendations
    recommendations.push("Validate that official CBRE Source Documents are being used consistently");
    recommendations.push("Consider implementing data caching for improved performance");
    recommendations.push("Add location fallback mechanisms for missing data");
    
    recommendations.forEach((rec, index) => {
        console.log(`  ${index + 1}. ${rec}`);
    });
    
    return recommendations;
}

// Main execution
async function runGlobalValidationSummary() {
    console.log("🚀 Running CBRE Global Validation Summary");
    console.log("=" .repeat(60));
    
    try {
        // Test key global locations
        const results = await validateKeyGlobalLocations();
        
        // Analyze regional coverage
        const regionalData = analyzeCBRECoverageByRegion(results);
        
        // Generate completeness report
        const completeness = generateDataCompletenessReport(results);
        
        // Create recommendations
        const recommendations = createValidationRecommendations(results, regionalData, completeness);
        
        // Final summary
        const successfulTests = results.filter(r => r.success).length;
        const overallSuccessRate = (successfulTests / results.length * 100).toFixed(1);
        
        console.log("\n=== FINAL VALIDATION SUMMARY ===");
        console.log(`Global locations tested: ${results.length}`);
        console.log(`Successful calculations: ${successfulTests}`);
        console.log(`Overall success rate: ${overallSuccessRate}%`);
        console.log(`Data completeness: ${completeness.hasAllComponents}/${successfulTests} complete`);
        
        if (successfulTests > 0) {
            const avgGlobalCost = results
                .filter(r => r.success)
                .reduce((sum, r) => sum + r.unitCost, 0) / successfulTests;
            console.log(`Average global unit cost: $${avgGlobalCost.toFixed(2)}/sqm`);
        }
        
        console.log("\n✅ Global CBRE Validation Summary Complete");
        console.log("=" .repeat(60));
        
        return {
            results,
            regionalData,
            completeness,
            recommendations,
            summary: {
                totalTests: results.length,
                successful: successfulTests,
                successRate: overallSuccessRate,
                dataCompleteness: completeness.hasAllComponents
            }
        };
        
    } catch (error) {
        console.error("❌ Global validation summary failed:", error);
        throw error;
    }
}

runGlobalValidationSummary();