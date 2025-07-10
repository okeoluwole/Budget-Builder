// Debug Technology Rate for London High Spec
// Direct database query to find the exact rate

import { db } from './server/db.js';
import { technologyCosts } from './shared/schema.js';
import { eq, and } from 'drizzle-orm';

async function checkLondonTechnologyRate() {
    console.log("=== DEBUGGING LONDON TECHNOLOGY RATE ===");
    
    try {
        // Query all technology records for London
        const londonTechRecords = await db.select()
            .from(technologyCosts)
            .where(and(
                eq(technologyCosts.city, 'London'),
                eq(technologyCosts.country, 'United Kingdom')
            ));
        
        console.log(`Found ${londonTechRecords.length} London technology records:`);
        
        if (londonTechRecords.length > 0) {
            const record = londonTechRecords[0];
            console.log("\nLondon Technology Rates:");
            console.log(`Low: $${record.activityLowSqm}/sqm`);
            console.log(`Medium: $${record.activityMediumSqm}/sqm`);
            console.log(`High: $${record.activityHighSqm}/sqm`);
            
            // The answer to the user's question
            console.log(`\n🎯 ANSWER: London Technology High Spec = $${record.activityHighSqm}/sqm`);
        } else {
            console.log("❌ No London technology records found");
            
            // Check if there are any technology records at all
            const allTechRecords = await db.select().from(technologyCosts);
            console.log(`Total technology records in database: ${allTechRecords.length}`);
            
            if (allTechRecords.length > 0) {
                console.log("\nSample technology records:");
                allTechRecords.slice(0, 3).forEach((record, index) => {
                    console.log(`  ${index + 1}. ${record.city}, ${record.country} - High: $${record.activityHighSqm}/sqm`);
                });
            }
        }
        
    } catch (error) {
        console.error("Database query error:", error);
    }
}

checkLondonTechnologyRate();