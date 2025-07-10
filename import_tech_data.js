import XLSX from 'xlsx';
import { Pool } from 'pg';
import path from 'path';

// Database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: true 
});

async function importTechnologyData() {
  console.log('Starting technology data import...');
  
  try {
    // Read the Excel file
    const filePath = path.join(process.cwd(), 'attached_assets', 'CBRE Fit Out Guide Cost Data_29.01.2024 - Rev 3 - RC OO (2).xlsx');
    console.log('Reading file:', filePath);
    
    const workbook = XLSX.readFile(filePath);
    
    if (!workbook.Sheets['TECH']) {
      throw new Error('TECH sheet not found');
    }
    
    // Get raw data from TECH sheet
    const techSheet = workbook.Sheets['TECH'];
    const rawData = XLSX.utils.sheet_to_json(techSheet, { header: 1 });
    
    console.log(`Found ${rawData.length} rows in TECH sheet`);
    
    // Clear existing technology cost data
    await pool.query('DELETE FROM technology_costs');
    console.log("Cleared existing technology cost records");
    
    let recordsInserted = 0;
    
    // Process data rows (starting from a row that has data)
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      
      // Skip empty rows or rows without proper data
      if (!row || row.length < 5) continue;
      
      const country = row[1]?.toString().trim();
      const city = row[2]?.toString().trim();
      const region = row[3]?.toString().trim();
      
      // Skip rows without country/city data or header rows
      if (!country || !city || country === 'COUNTRY' || city === 'CITY' || !region) continue;
      
      try {
        // Extract technology costs - using the structure we found:
        // Columns 4-6: Activity SQM (Low, Medium, High)
        // Columns 7-9: Team SQM (same as Activity for now)
        // Columns 10-12: Event SQM (same as Activity for now)
        // Columns 14-16: Activity SQFT (Low, Medium, High)
        // Columns 17-19: Team SQFT (same as Activity for now)
        // Columns 20-22: Event SQFT (same as Activity for now)
        
        const activityLowSqm = parseFloat(row[4]) || 0;
        const activityMediumSqm = parseFloat(row[5]) || 0;
        const activityHighSqm = parseFloat(row[6]) || 0;
        
        const activityLowSqft = parseFloat(row[14]) || 0;
        const activityMediumSqft = parseFloat(row[15]) || 0;
        const activityHighSqft = parseFloat(row[16]) || 0;
        
        // Location factors and inflation rate
        const locationFactorEMEA = parseFloat(row[22]) || 1.0;
        const locationFactorAMERICA = parseFloat(row[22]) || 1.0; // Same column for now
        const locationFactorAPAC = parseFloat(row[22]) || 1.0; // Same column for now
        const inflationRate = parseFloat(row[24]) || 1.0;
        
        // Insert into database
        const insertQuery = `
          INSERT INTO technology_costs (
            country, city, region,
            activity_low_sqm, activity_medium_sqm, activity_high_sqm,
            team_low_sqm, team_medium_sqm, team_high_sqm,
            event_low_sqm, event_medium_sqm, event_high_sqm,
            activity_low_sqft, activity_medium_sqft, activity_high_sqft,
            team_low_sqft, team_medium_sqft, team_high_sqft,
            event_low_sqft, event_medium_sqft, event_high_sqft,
            location_factor_emea, location_factor_america, location_factor_apac,
            inflation_rate
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
        `;
        
        await pool.query(insertQuery, [
          country, city, region,
          activityLowSqm, activityMediumSqm, activityHighSqm,
          activityLowSqm, activityMediumSqm, activityHighSqm, // Use same as Activity for Team
          activityLowSqm, activityMediumSqm, activityHighSqm, // Use same as Activity for Event
          activityLowSqft, activityMediumSqft, activityHighSqft,
          activityLowSqft, activityMediumSqft, activityHighSqft, // Use same as Activity for Team
          activityLowSqft, activityMediumSqft, activityHighSqft, // Use same as Activity for Event
          locationFactorEMEA, locationFactorAMERICA, locationFactorAPAC,
          inflationRate
        ]);
        
        recordsInserted++;
        
        // Log first few records
        if (recordsInserted <= 3) {
          console.log(`Record ${recordsInserted}: ${country}/${city}, Activity Medium SQM: ${activityMediumSqm}, Activity Medium SQFT: ${activityMediumSqft}`);
        }
        
      } catch (error) {
        console.error(`Error processing row ${i}:`, error.message);
      }
    }
    
    console.log(`Successfully imported ${recordsInserted} technology cost records`);
    
    // Verify the import
    const result = await pool.query('SELECT COUNT(*) FROM technology_costs');
    console.log(`Total records in technology_costs table: ${result.rows[0].count}`);
    
  } catch (error) {
    console.error('Error importing technology data:', error);
  } finally {
    await pool.end();
  }
}

// Run the import
importTechnologyData();