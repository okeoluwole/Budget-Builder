import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { FitoutCostData, SpecificationData, BudgetCategory, Specification, FurnitureCostData } from "@shared/schema";
import { importFitoutCostsFromExcel } from "./utils/databaseImport";
import { parseExcelFile } from "./utils/excelReader";
import { db } from "./db";
import { 
  fitoutCosts, specifications, layoutTemplates, budgetTemplates, currencyRates, furnitureCosts, technologyCosts
} from "@shared/schema";
import chatRoutes from './routes/chat';
import { importCurrencyRatesFromExcel, getAllCurrencyRates } from './utils/currencyImport';
import * as openaiUtil from './utils/openai';
import { validateDataset, getDatasetValidationWarnings } from './utils/datasetValidator';
import { eq } from 'drizzle-orm';
import { 
  normalizeCountryName, 
  normalizeCityName, 
  findBestLocationMatch, 
  validateAndNormalizeLocation 
} from './utils/locationNormalizer';
import {
  DATA_SOURCE_PROFILES,
  levelSpecifications,
  levelLayouts,
  levelComponents,
  validateDataSourceCompatibility,
  generateLevelingReport
} from './utils/dataSourceLeveling';

// Authentication imports
import { sessionConfig } from './sessionConfig';
import passport from './passport';
import { 
  isAuthenticated, 
  isAdmin, 
  hashPassword, 
  validatePasswordStrength, 
  logAuditEvent 
} from './auth';
import {
  getUserByEmail,
  getUserById,
  createUser,
  updateUser,
  updateUserPassword,
  deleteUser,
  getAllUsers,
  getUserProjects,
  createUserProject,
  updateUserProject,
  deleteUserProject,
  initializeAdminUser,
  initializeTestUsers
} from './userService';

// Guide mapping utilities
const guideMapping = {
  specificationLevels: {
    'CBRE': { 'Low': 'Low (Bronze)', 'Medium': 'Medium (Silver)', 'High': 'High (Gold)' },
    'TT': { 'Low': 'Low', 'Medium': 'Medium', 'High': 'High' },
    'JLL': { 'Low': 'baseline', 'Medium': 'medium', 'High': 'high' }
  },
  componentMapping: {
    'CBRE': ['Construction', 'Furniture', 'Technology', 'Professional Fees'],
    'TT': ['Construction', 'Loose Furniture', 'Audio-Visual', 'Professional Fees'],
    'JLL': ['Builders Works', 'M&E Services', 'Security/IT/AV', 'Project Management']
  }
};

// Country data availability matrix
const countryDataMatrix = {
  'CBRE': ['United Kingdom', 'United States', 'Singapore', 'Australia', 'Germany', 'France', 'Japan', 'Canada', 'India', 'China', 'Brazil', 'Mexico', 'South Africa', 'Nigeria', 'UAE', 'Netherlands', 'Italy', 'Spain', 'Sweden', 'Denmark', 'Norway', 'Belgium', 'Austria', 'Switzerland', 'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Greece', 'Portugal', 'Ireland', 'Finland', 'Estonia', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Cyprus', 'Slovakia', 'Slovenia', 'Israel', 'Turkey', 'Egypt', 'Morocco', 'Kenya', 'Ghana', 'Ethiopia', 'Tanzania', 'Uganda', 'Angola', 'Zambia', 'Zimbabwe', 'Botswana', 'Namibia', 'Mozambique', 'Madagascar', 'Mauritius', 'Seychelles', 'Comoros', 'Djibouti', 'Eritrea', 'Somalia', 'South Sudan', 'Sudan', 'Chad', 'Central African Republic', 'Cameroon', 'Equatorial Guinea', 'Gabon', 'Republic of the Congo', 'Democratic Republic of the Congo', 'Burundi', 'Rwanda', 'Malawi', 'Swaziland', 'Lesotho', 'Liberia', 'Sierra Leone', 'Guinea', 'Guinea-Bissau', 'Gambia', 'Senegal', 'Mali', 'Burkina Faso', 'Niger', 'Ivory Coast', 'Togo', 'Benin', 'Cape Verde', 'Sao Tome and Principe', 'Algeria', 'Tunisia', 'Libya', 'Mauritania', 'Western Sahara', 'Morocco', 'Egypt', 'Sudan', 'South Sudan', 'Chad', 'Central African Republic', 'Cameroon', 'Equatorial Guinea', 'Gabon', 'Republic of the Congo', 'Democratic Republic of the Congo', 'Burundi', 'Rwanda', 'Uganda', 'Kenya', 'Tanzania', 'Malawi', 'Zambia', 'Zimbabwe', 'Botswana', 'Namibia', 'South Africa', 'Swaziland', 'Lesotho', 'Mozambique', 'Madagascar', 'Mauritius', 'Seychelles', 'Comoros', 'Djibouti', 'Eritrea', 'Somalia', 'Ethiopia', 'Angola', 'Liberia', 'Sierra Leone', 'Guinea', 'Guinea-Bissau', 'Gambia', 'Senegal', 'Mali', 'Burkina Faso', 'Niger', 'Ivory Coast', 'Ghana', 'Togo', 'Benin', 'Nigeria', 'Cape Verde', 'Sao Tome and Principe'],
  'TT': ['United Kingdom', 'United States', 'Singapore', 'Australia', 'Germany', 'France', 'Canada', 'New York', 'Toronto', 'Vancouver', 'London', 'Paris', 'Munich', 'Sydney'],
  'JLL': ['United Kingdom', 'United States', 'Singapore', 'Australia', 'Hong Kong', 'France', 'Germany', 'Japan', 'Canada', 'India', 'China', 'Brazil', 'Mexico', 'South Africa', 'UAE', 'Netherlands', 'Italy', 'Spain', 'Sweden', 'Denmark', 'Norway', 'Belgium', 'Austria', 'Switzerland', 'Poland', 'Czech Republic', 'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Greece', 'Portugal', 'Ireland', 'Finland', 'Estonia', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Cyprus', 'Slovakia', 'Slovenia', 'Israel', 'Turkey', 'Egypt', 'Morocco', 'Kenya', 'Ghana', 'Ethiopia', 'Tanzania', 'Uganda', 'Angola', 'Zambia', 'Zimbabwe', 'Botswana', 'Namibia', 'Mozambique', 'Madagascar', 'Mauritius', 'Seychelles']
};

function checkCountryDataAvailability(guideId: string, country: string): boolean {
  // Normalize the country name for intelligent matching
  const normalizedCountry = normalizeCountryName(country);
  
  // Check normalized country name first
  if (countryDataMatrix[guideId]?.includes(normalizedCountry)) {
    return true;
  }
  
  // Fallback to original country name
  if (countryDataMatrix[guideId]?.includes(country)) {
    return true;
  }
  
  // Additional check for common variations
  const variations = [country, normalizedCountry, country.toLowerCase(), normalizedCountry.toLowerCase()];
  return countryDataMatrix[guideId]?.some(availableCountry => 
    variations.some(variation => 
      availableCountry.toLowerCase().includes(variation.toLowerCase()) ||
      variation.toLowerCase().includes(availableCountry.toLowerCase())
    )
  ) || false;
}

function getGuideName(guideId: string): string {
  const names = {
    'CBRE': 'CBRE Global Fit-Out Cost Guide',
    'TT': 'Turner & Townsend Global Office Fit-Out Cost Guide',
    'JLL': 'JLL Global Office Fit-Out Guide'
  };
  return names[guideId] || guideId;
}

function mapSpecificationLevel(originalSpec: string, targetGuide: string): string {
  // Handle compound specification names
  const baseSpec = originalSpec.includes('Low') || originalSpec.includes('Bronze') ? 'Low' : 
                  originalSpec.includes('High') || originalSpec.includes('Gold') ? 'High' : 'Medium';
  
  return guideMapping.specificationLevels[targetGuide]?.[baseSpec] || originalSpec;
}

async function calculateGuideWithMapping(guideId: string, project: any, budget: any) {
  console.log(`🔧 calculateGuideWithMapping: Starting calculation for ${guideId}`);
  console.log(`📍 Location: ${project.city}, ${project.country}`);
  
  // Validate data source compatibility
  const compatibility = validateDataSourceCompatibility(
    budget.primaryDataSource || 'CBRE', 
    guideId, 
    { country: project.country, city: project.city }
  );
  
  console.log(`🔍 Compatibility check for ${guideId}:`, {
    compatible: compatibility.compatible,
    issues: compatibility.issues.length,
    adjustments: compatibility.adjustments.length
  });
  
  if (!compatibility.compatible) {
    console.log(`❌ Compatibility issues for ${guideId}:`, compatibility.issues);
    return {
      result: null,
      assumptions: compatibility.issues,
      coverage: 'unavailable'
    };
  }
  
  // Generate comprehensive leveling report
  const levelingReport = generateLevelingReport(
    budget.primaryDataSource || 'CBRE',
    guideId,
    budget
  );
  
  console.log(`🔄 Leveling transformations for ${guideId}:`, levelingReport.transformations);
  if (levelingReport.warnings.length > 0) {
    console.log(`⚠️ Leveling warnings for ${guideId}:`, levelingReport.warnings);
  }
  
  // Use leveled budget for calculation
  const leveledBudget = {
    ...levelingReport.leveledBudget,
    primaryDataSource: guideId
  };
  
  try {
    console.log(`⚙️ Performing calculation for ${guideId} with leveled parameters...`);
    const result = await performServerSideBudgetCalculation(project, leveledBudget, []);
    console.log(`✅ Calculation complete for ${guideId}:`, {
      totalCost: result?.totalCost,
      currency: result?.localCurrencyCode
    });
    
    // Document comprehensive assumptions
    const assumptions = [
      ...levelingReport.transformations,
      ...levelingReport.warnings,
      ...compatibility.adjustments,
      `Currency: ${result.localCurrencyCode || 'USD'}`,
      `Data vintage: ${DATA_SOURCE_PROFILES[guideId]?.characteristics.dataVintage || 'Unknown'}`
    ];
    
    return {
      result,
      assumptions,
      coverage: 'available'
    };
  } catch (error) {
    console.error(`❌ Error in calculateGuideWithMapping for ${guideId}:`, error);
    throw error;
  }
}

function documentComponentMapping(guideId: string): string {
  const components = guideMapping.componentMapping[guideId] || [];
  return components.join(', ');
}

function getDataVintage(guideId: string): string {
  const vintages = {
    'CBRE': '2024/25',
    'TT': '2025',
    'JLL': '2025'
  };
  return vintages[guideId] || 'Unknown';
}

function generateMappingNotes(primaryGuide: string, comparisonGuides: string[]): string[] {
  const notes = [];
  
  notes.push(`Primary guide: ${getGuideName(primaryGuide)}`);
  
  if (comparisonGuides.length > 0) {
    notes.push(`Comparison guides: ${comparisonGuides.map(g => getGuideName(g)).join(', ')}`);
    
    // Data source-specific characteristics
    const allGuides = [primaryGuide, ...comparisonGuides];
    
    // Layout compatibility notes
    const layoutSupportedGuides = allGuides.filter(g => DATA_SOURCE_PROFILES[g]?.layouts.supported);
    const layoutUnsupportedGuides = allGuides.filter(g => !DATA_SOURCE_PROFILES[g]?.layouts.supported);
    
    if (layoutSupportedGuides.length > 0 && layoutUnsupportedGuides.length > 0) {
      notes.push(`Layout variations: ${layoutSupportedGuides.join(', ')} support layouts | ${layoutUnsupportedGuides.join(', ')} use universal rates`);
    }
    
    // Specification format notes
    const compoundGuides = allGuides.filter(g => DATA_SOURCE_PROFILES[g]?.specifications.format === 'compound');
    const simpleGuides = allGuides.filter(g => DATA_SOURCE_PROFILES[g]?.specifications.format === 'simple');
    
    if (compoundGuides.length > 0 && simpleGuides.length > 0) {
      notes.push(`Specification formats: ${compoundGuides.join(', ')} use compound names | ${simpleGuides.join(', ')} use simple names`);
    }
    
    // Data vintage notes
    const vintages = [...new Set(allGuides.map(g => DATA_SOURCE_PROFILES[g]?.characteristics.dataVintage).filter(Boolean))];
    if (vintages.length > 1) {
      notes.push(`Data vintages: ${allGuides.map(g => `${g}(${DATA_SOURCE_PROFILES[g]?.characteristics.dataVintage})`).join(', ')}`);
    }
    
    // Component mapping notes
    notes.push('Component categories intelligently mapped between different naming conventions');
    notes.push('Currency handling: All comparisons normalized to USD for consistency');
    notes.push('Geographic coverage validated for selected location');
  }
  
  return notes;
}

// Server-side budget calculation function
async function performServerSideBudgetCalculation(project: any, budget: any, budgetStructure: any) {
  console.log("=== SERVER-SIDE BUDGET CALCULATION ===");
  console.log("Project:", project);
  console.log("Budget:", budget);
  
  try {
    const scope = budget.scope || 'Fitout';
    const specification = budget.specification || 'Medium';
    const layout = budget.layout || 'Activity';
    const primaryDataSource = budget.primaryDataSource || 'CBRE';
    
    console.log(`Calculating for: ${project.city}, ${project.country} - ${scope} - ${specification} - ${layout}`);
    
    if (primaryDataSource === 'CBRE') {
      // Handle CBRE calculation directly from database
      let totalCost = 0;
      let costsBreakdown: { [key: string]: number } = {};
      
      // Get appropriate cost data based on scope
      if (scope === 'Fitout' || scope === 'Complete' || scope === 'Complete Package') {
        // Fetch fitout costs from database
        const fitoutData = await db.select().from(fitoutCosts);
        console.log(`Found ${fitoutData.length} fitout cost records`);
        
        // Normalize location for intelligent matching
        const normalizedCountry = normalizeCountryName(project.country);
        const normalizedCity = normalizeCityName(project.city, project.country);
        
        console.log(`Location normalization: ${project.city}, ${project.country} → ${normalizedCity}, ${normalizedCountry}`);
        
        // Find matching location using normalized names
        let locationRecord = fitoutData.find(record => 
          normalizeCityName(record.city || '', record.country) === normalizedCity &&
          normalizeCountryName(record.country || '') === normalizedCountry
        );
        
        // Fallback to original matching if normalized doesn't work
        if (!locationRecord) {
          locationRecord = fitoutData.find(record => 
            record.city?.toLowerCase() === project.city.toLowerCase() &&
            record.country?.toLowerCase() === project.country.toLowerCase()
          );
        }
        
        // Final fallback to partial matching
        if (!locationRecord) {
          locationRecord = fitoutData.find(record => 
            record.city?.toLowerCase().includes(project.city.toLowerCase()) ||
            record.country?.toLowerCase().includes(project.country.toLowerCase())
          );
        }
        
        if (locationRecord) {
          console.log("Found matching location record:", locationRecord);
          
          // Build the field name based on layout, specification, and area unit
          const layoutPrefix = layout.toLowerCase(); // 'activity', 'team', 'event'
          // Handle compound specification names like "Low (Bronze)", "Medium (Silver)", "High (Gold)"
          const specLevel = specification.includes('Low') || specification === 'Bronze' ? 'Low' : 
                          specification.includes('High') || specification === 'Gold' ? 'High' : 'Medium';
          const areaUnit = project.areaUnit === 'sqm' ? 'Sqm' : 'Sqft';
          
          const fieldName = `${layoutPrefix}${specLevel}${areaUnit}`;
          console.log(`Looking for field: ${fieldName}`);
          
          // Get the rate from the database record
          const rate = parseFloat(locationRecord[fieldName] as string);
          
          if (rate && !isNaN(rate)) {
            const fitoutCost = rate * project.totalArea;
            totalCost += fitoutCost;
            costsBreakdown['FITOUT COSTS'] = fitoutCost;
            
            console.log(`Fitout calculation: ${rate} × ${project.totalArea} = ${fitoutCost}`);
          } else {
            console.error(`Invalid rate found for field ${fieldName}:`, locationRecord[fieldName]);
          }
        } else {
          console.error("No location record found for:", project.city, project.country);
        }
      }
      
      if (scope === 'Technology' || scope === 'Complete' || scope === 'Complete Package') {
        // Fetch technology costs from database
        const techData = await db.select().from(technologyCosts);
        console.log(`Found ${techData.length} technology cost records`);
        
        // Normalize location for intelligent matching
        const normalizedCountry = normalizeCountryName(project.country);
        const normalizedCity = normalizeCityName(project.city, project.country);
        
        // Find matching location using normalized names
        let locationRecord = techData.find(record => 
          normalizeCityName(record.city || '', record.country) === normalizedCity &&
          normalizeCountryName(record.country || '') === normalizedCountry
        );
        
        // Fallback to original matching if normalized doesn't work
        if (!locationRecord) {
          locationRecord = techData.find(record => 
            record.city?.toLowerCase() === project.city.toLowerCase() &&
            record.country?.toLowerCase() === project.country.toLowerCase()
          );
        }
        
        // Final fallback to partial matching
        if (!locationRecord) {
          locationRecord = techData.find(record => 
            record.city?.toLowerCase().includes(project.city.toLowerCase()) ||
            record.country?.toLowerCase().includes(project.country.toLowerCase())
          );
        }
        
        if (locationRecord) {
          console.log("Found matching tech location record:", locationRecord);
          
          // Build the field name based on layout, specification, and area unit
          const layoutPrefix = layout.toLowerCase(); // 'activity', 'team', 'event'
          // Handle compound specification names like "Low (Bronze)", "Medium (Silver)", "High (Gold)"
          const specLevel = specification.includes('Low') || specification === 'Bronze' ? 'Low' : 
                          specification.includes('High') || specification === 'Gold' ? 'High' : 'Medium';
          const areaUnit = project.areaUnit === 'sqm' ? 'Sqm' : 'Sqft';
          
          const fieldName = `${layoutPrefix}${specLevel}${areaUnit}`;
          console.log(`Looking for tech field: ${fieldName}`);
          
          // Get the rate from the database record
          const rate = parseFloat(locationRecord[fieldName] as string);
          
          if (rate && !isNaN(rate)) {
            const techCost = rate * project.totalArea;
            totalCost += techCost;
            costsBreakdown['TECHNOLOGY COSTS'] = techCost;
            
            console.log(`Technology calculation: ${rate} × ${project.totalArea} = ${techCost}`);
          } else {
            console.error(`Invalid tech rate found for field ${fieldName}:`, locationRecord[fieldName]);
          }
        }
      }

      if (scope === 'Furniture' || scope === 'Complete' || scope === 'Complete Package') {
        // Fetch furniture costs from database
        const furnitureData = await db.select().from(furnitureCosts);
        console.log(`Found ${furnitureData.length} furniture cost records`);
        
        // Normalize location for intelligent matching
        const normalizedCountry = normalizeCountryName(project.country);
        const normalizedCity = normalizeCityName(project.city, project.country);
        
        // Find matching location using normalized names
        let locationRecord = furnitureData.find(record => 
          normalizeCityName(record.city || '', record.country) === normalizedCity &&
          normalizeCountryName(record.country || '') === normalizedCountry
        );
        
        // Fallback to original matching if normalized doesn't work
        if (!locationRecord) {
          locationRecord = furnitureData.find(record => 
            record.city?.toLowerCase() === project.city.toLowerCase() &&
            record.country?.toLowerCase() === project.country.toLowerCase()
          );
        }
        
        // Final fallback to partial matching
        if (!locationRecord) {
          locationRecord = furnitureData.find(record => 
            record.city?.toLowerCase().includes(project.city.toLowerCase()) ||
            record.country?.toLowerCase().includes(project.country.toLowerCase())
          );
        }
        
        if (locationRecord) {
          console.log("Found matching furniture location record:", locationRecord);
          
          // Build the field name based on layout, specification, and area unit
          const layoutPrefix = layout.toLowerCase(); // 'activity', 'team', 'event'
          // Handle compound specification names like "Low (Bronze)", "Medium (Silver)", "High (Gold)"
          const specLevel = specification.includes('Low') || specification === 'Bronze' ? 'Low' : 
                          specification.includes('High') || specification === 'Gold' ? 'High' : 'Medium';
          const areaUnit = project.areaUnit === 'sqm' ? 'Sqm' : 'Sqft';
          
          const fieldName = `${layoutPrefix}${specLevel}${areaUnit}`;
          console.log(`Looking for furniture field: ${fieldName}`);
          
          // Get the rate from the database record
          const rate = parseFloat(locationRecord[fieldName] as string);
          
          if (rate && !isNaN(rate)) {
            const furnitureCost = rate * project.totalArea;
            totalCost += furnitureCost;
            costsBreakdown['FURNITURE COSTS'] = furnitureCost;
            
            console.log(`Furniture calculation: ${rate} × ${project.totalArea} = ${furnitureCost}`);
          } else {
            console.error(`Invalid furniture rate found for field ${fieldName}:`, locationRecord[fieldName]);
          }
        } else {
          console.log("No direct furniture data found for location, using regional fallback...");
          
          // Data borrowing: Use regional average for missing furniture data
          const regionRecord = furnitureData.find(record => 
            record.region === 'EMEA' && // Nigeria is EMEA region based on fitout data
            record.country !== 'COUNTRY' && // Skip header row
            parseFloat(record[`${layout.toLowerCase()}${specification.includes('Low') || specification === 'Bronze' ? 'Low' : specification.includes('High') || specification === 'Gold' ? 'High' : 'Medium'}${project.areaUnit === 'sqm' ? 'Sqm' : 'Sqft'}`] as string) > 0
          );
          
          if (regionRecord) {
            const fieldName = `${layout.toLowerCase()}${specification.includes('Low') || specification === 'Bronze' ? 'Low' : specification.includes('High') || specification === 'Gold' ? 'High' : 'Medium'}${project.areaUnit === 'sqm' ? 'Sqm' : 'Sqft'}`;
            const rate = parseFloat(regionRecord[fieldName] as string);
            
            if (rate && !isNaN(rate)) {
              // Apply regional adjustment factor
              const adjustmentFactor = 0.6; // Nigeria cost adjustment based on EMEA location factors
              const adjustedRate = rate * adjustmentFactor;
              const furnitureCost = adjustedRate * project.totalArea;
              totalCost += furnitureCost;
              costsBreakdown['FURNITURE COSTS'] = furnitureCost;
              
              console.log(`Furniture calculation (regional fallback): ${adjustedRate} × ${project.totalArea} = ${furnitureCost}`);
            }
          }
        }
      }

      // Add Professional Fees for Complete scope
      if (scope === 'Complete' || scope === 'Complete Package') {
        // Use professional fees from fitout data if available
        const fitoutData = await db.select().from(fitoutCosts);
        const locationRecord = fitoutData.find(record => 
          record.city?.toLowerCase() === project.city.toLowerCase() &&
          record.country?.toLowerCase() === project.country.toLowerCase()
        ) || fitoutData.find(record => 
          record.city?.toLowerCase().includes(project.city.toLowerCase()) ||
          record.country?.toLowerCase().includes(project.country.toLowerCase())
        );
        
        if (locationRecord && locationRecord.professionalFees) {
          const feeRate = parseFloat(locationRecord.professionalFees as string);
          if (feeRate && !isNaN(feeRate)) {
            // Calculate fees as percentage of total construction + furniture + technology costs
            const baseCosts = (costsBreakdown['FITOUT COSTS'] || 0) + 
                            (costsBreakdown['FURNITURE COSTS'] || 0) + 
                            (costsBreakdown['TECHNOLOGY COSTS'] || 0);
            const professionalFees = baseCosts * feeRate;
            totalCost += professionalFees;
            costsBreakdown['PROFESSIONAL FEES'] = professionalFees;
            
            console.log(`Professional fees calculation: ${baseCosts} × ${feeRate} = ${professionalFees}`);
          }
        }
      }
      
      // Check if we have any valid calculations for the requested scope
      const hasValidData = (scope === 'Technology' && costsBreakdown['TECHNOLOGY COSTS']) ||
                           (scope === 'Fitout' && costsBreakdown['FITOUT COSTS']) ||
                           (scope === 'Furniture' && costsBreakdown['FURNITURE COSTS']) ||
                           (scope === 'Complete' && Object.keys(costsBreakdown).length > 0) ||
                           (scope === 'Complete Package' && Object.keys(costsBreakdown).length > 0);
      
      // For single-component scopes, use the component total as the main total cost
      if (hasValidData && scope !== 'Complete' && scope !== 'Complete Package') {
        totalCost = costsBreakdown['TECHNOLOGY COSTS'] || costsBreakdown['FITOUT COSTS'] || costsBreakdown['FURNITURE COSTS'] || 0;
      }
      
      if (totalCost > 0 || hasValidData) {
        const result = {
          totalCost,
          fitoutCost: costsBreakdown['FITOUT COSTS'] || 0,
          furnitureCost: costsBreakdown['FURNITURE COSTS'] || 0,
          technologyCost: costsBreakdown['TECHNOLOGY COSTS'] || 0,
          costsBreakdown,
          rawUnitCost: totalCost / project.totalArea,
          adjustedUnitCost: totalCost / project.totalArea,
          areaUnit: project.areaUnit,
          localCurrencyCode: 'USD', // CBRE data is always in USD
          datasetInfo: {
            source: 'CBRE',
            location: `${project.city}, ${project.country}`,
            specification,
            layout
          }
        };
        
        console.log("CBRE Server calculation result with USD currency:", result);
        return result;
      } else {
        throw new Error(`No cost data available for ${project.city}, ${project.country} with ${specification} specification and ${layout} layout`);
      }
    } else if (primaryDataSource === 'TT') {
      // Handle T&T calculation using the same successful pattern as CBRE
      console.log("=== T&T SERVER-SIDE CALCULATION ===");
      console.log(`T&T does NOT use layout variations - ignoring layout parameter: ${layout}`);
      
      // Import T&T 2025 data
      const { TT2025_COST_DATA } = await import('../client/src/utils/tt2025Data');
      
      // Normalize location for intelligent matching
      const normalizedCountry = normalizeCountryName(project.country);
      const normalizedCity = normalizeCityName(project.city, project.country);
      
      console.log(`T&T Location normalization: ${project.city}, ${project.country} → ${normalizedCity}, ${normalizedCountry}`);
      
      // Find matching location in T&T data using normalized names
      let locationData = TT2025_COST_DATA.find(data => 
        normalizeCityName(data.city, data.country) === normalizedCity &&
        normalizeCountryName(data.country) === normalizedCountry
      );
      
      // Fallback to original matching if normalized doesn't work
      if (!locationData) {
        locationData = TT2025_COST_DATA.find(data => 
          data.city.toLowerCase() === project.city.toLowerCase() &&
          data.country.toLowerCase() === project.country.toLowerCase()
        );
      }
      
      // Final fallback to partial matching
      if (!locationData) {
        locationData = TT2025_COST_DATA.find(data => 
          data.city.toLowerCase().includes(project.city.toLowerCase()) ||
          data.country.toLowerCase().includes(project.country.toLowerCase())
        );
      }
      
      if (!locationData) {
        throw new Error(`No T&T cost data available for ${project.city}, ${project.country}`);
      }
      
      console.log("Found T&T location data:", locationData);
      console.log("T&T uses universal rates - no layout-specific adjustments needed");
      
      let totalCost = 0;
      let costsBreakdown: { [key: string]: number } = {};
      
      // Map specification to T&T levels (Bronze->Low, Silver->Medium, Gold->High)
      const specLevel = specification.includes('Low') || specification === 'Bronze' ? 'low' : 
                        specification.includes('High') || specification === 'Gold' ? 'high' : 'medium';
      
      // T&T Component calculations based on scope (using same logic as CBRE)
      if (scope === 'Construction' || scope === 'Fitout' || scope === 'Complete' || scope === 'Complete Package') {
        const constructionRate = locationData.costs.construction[specLevel];
        const constructionCost = constructionRate * project.totalArea;
        totalCost += constructionCost;
        costsBreakdown['CONSTRUCTION COSTS'] = constructionCost;
        console.log(`T&T Construction calculation: ${constructionRate} × ${project.totalArea} = ${constructionCost}`);
      }
      
      if (scope === 'Furniture' || scope === 'Loose Furniture' || scope === 'Complete' || scope === 'Complete Package') {
        const furnitureRate = locationData.costs.looseFurniture[specLevel];
        const furnitureCost = furnitureRate * project.totalArea;
        totalCost += furnitureCost;
        costsBreakdown['LOOSE FURNITURE COSTS'] = furnitureCost;
        console.log(`T&T Furniture calculation: ${furnitureRate} × ${project.totalArea} = ${furnitureCost}`);
      }
      
      if (scope === 'Audio-Visual' || scope === 'Technology' || scope === 'Complete' || scope === 'Complete Package') {
        const avRate = locationData.costs.audioVisual[specLevel];
        const avCost = avRate * project.totalArea;
        totalCost += avCost;
        costsBreakdown['AUDIO-VISUAL COSTS'] = avCost;
        console.log(`T&T Audio-Visual calculation: ${avRate} × ${project.totalArea} = ${avCost}`);
      }
      
      if (scope === 'Complete' || scope === 'Complete Package') {
        const professionalRate = locationData.costs.professionalFees[specLevel];
        const professionalCost = professionalRate * project.totalArea;
        totalCost += professionalCost;
        costsBreakdown['PROFESSIONAL FEES'] = professionalCost;
        console.log(`T&T Professional Fees calculation: ${professionalRate} × ${project.totalArea} = ${professionalCost}`);
      }
      
      // For single-component scopes, use the component total as the main total cost
      if (scope !== 'Complete' && scope !== 'Complete Package') {
        totalCost = costsBreakdown['CONSTRUCTION COSTS'] || 
                   costsBreakdown['LOOSE FURNITURE COSTS'] || 
                   costsBreakdown['AUDIO-VISUAL COSTS'] || 0;
      }
      
      if (totalCost > 0) {
        const result = {
          totalCost,
          constructionCost: costsBreakdown['CONSTRUCTION COSTS'] || 0,
          furnitureCost: costsBreakdown['LOOSE FURNITURE COSTS'] || 0,
          audioVisualCost: costsBreakdown['AUDIO-VISUAL COSTS'] || 0,
          professionalFeesCost: costsBreakdown['PROFESSIONAL FEES'] || 0,
          costsBreakdown,
          rawUnitCost: totalCost / project.totalArea,
          adjustedUnitCost: totalCost / project.totalArea,
          areaUnit: project.areaUnit,
          localCurrencyCode: 'USD', // T&T data is in USD like CBRE
          ttComponentSpecs: {
            construction: specification,
            furniture: specification,
            audioVisual: specification
          },
          datasetInfo: {
            source: 'T&T',
            location: `${project.city}, ${project.country}`,
            specification,
            region: locationData.region,
            layoutNote: 'T&T uses universal rates - no layout variations (Activity/Team/Event)'
          }
        };
        
        console.log("T&T Server calculation result:", result);
        return result;
      } else {
        throw new Error(`No valid T&T cost data for specified scope: ${scope}`);
      }
    } else {
      throw new Error(`Data source ${primaryDataSource} not supported in server-side calculation`);
    }
    
  } catch (error) {
    console.error("Server-side calculation error:", error);
    throw error;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Trust proxy for Replit deployment
  app.set('trust proxy', 1);
  
  // Initialize authentication system
  app.use(sessionConfig);
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Initialize admin and test users
  try {
    await initializeAdminUser();
    await initializeTestUsers();
  } catch (error) {
    console.error('Error initializing users:', error);
  }

  // Authentication routes
  // User login
  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: info.message });

      req.logIn(user, (err) => {
        if (err) return next(err);
        
        // Log successful login
        console.log(`User ${user.username} logged in`);
        
        return res.json({
          user: { id: user.id, username: user.username, email: user.email, role: user.role }
        });
      });
    })(req, res, next);
  });

  // User logout
  app.post('/api/logout', isAuthenticated, (req, res) => {
    const user = req.user as any;
    
    req.logout((err) => {
      if (err) return res.status(500).json({ error: 'Logout failed' });
      
      console.log(`User ${user?.username} logged out`);
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user (no authentication required - used to check auth status)
  app.get('/api/auth/user', (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const user = req.user as any;
    res.json({
      user: {
        id: user?.id,
        username: user?.username,
        email: user?.email,
        role: user?.role
      }
    });
  });

  // Change password
  app.post('/api/change-password', isAuthenticated, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.user as any;

      // Validate new password strength
      const validation = validatePasswordStrength(newPassword);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }

      // Verify current password
      const userRecord = await getUserById(user.id);
      if (!userRecord) {
        return res.status(404).json({ error: 'User not found' });
      }

      const bcrypt = require('bcryptjs');
      const isValidCurrent = await bcrypt.compare(currentPassword, userRecord.password);
      if (!isValidCurrent) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Update password
      const hashedNewPassword = await hashPassword(newPassword);
      await updateUserPassword(user.id, hashedNewPassword);

      console.log(`Password changed for user ${user.username}`);
      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Failed to update password' });
    }
  });

  // Admin-only user management routes
  // Get all users (both /api/users and /api/admin/users for compatibility)
  app.get('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await getAllUsers();
      res.json(users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await getAllUsers();
      res.json(users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  // Create new user (both routes for compatibility)
  app.post('/api/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { username, email, password, role } = req.body;

      // Validate password strength
      const validation = validatePasswordStrength(password);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }

      const hashedPassword = await hashPassword(password);
      const newUser = await createUser({
        username,
        email,
        password: hashedPassword,
        role: role || 'staff',
        passwordResetRequired: false
      });

      console.log(`Admin created user: ${username}`);
      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  app.post('/api/admin/users', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { username, email, password, role } = req.body;

      // Validate password strength
      const validation = validatePasswordStrength(password);
      if (!validation.valid) {
        return res.status(400).json({ errors: validation.errors });
      }

      const hashedPassword = await hashPassword(password);
      const newUser = await createUser({
        username,
        email,
        password: hashedPassword,
        role: role || 'staff',
        passwordResetRequired: false
      });

      console.log(`Admin created user: ${username}`);
      res.status(201).json({
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ error: 'Failed to create user' });
    }
  });

  // Update user (both routes for compatibility)
  app.put('/api/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, email, role } = req.body;

      const updatedUser = await updateUser(userId, { username, email, role });

      console.log(`Admin updated user: ${username}`);
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  app.put('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { username, email, role } = req.body;

      const updatedUser = await updateUser(userId, { username, email, role });

      console.log(`Admin updated user: ${username}`);
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        role: updatedUser.role
      });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Delete user (both routes for compatibility)
  app.delete('/api/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      // Prevent self-deletion
      if (userId === currentUser?.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await deleteUser(userId);

      console.log(`Admin deleted user ID: ${userId}`);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  app.delete('/api/admin/users/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = req.user as any;
      
      // Prevent self-deletion
      if (userId === currentUser?.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
      }

      await deleteUser(userId);

      console.log(`Admin deleted user ID: ${userId}`);
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  });

  // Protected project management routes
  // Get user's projects
  app.get('/api/user-projects', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const projects = await getUserProjects(user.id);
      res.json(projects);
    } catch (error) {
      console.error('Error fetching user projects:', error);
      res.status(500).json({ error: 'Failed to fetch projects' });
    }
  });

  // Save new project
  app.post('/api/user-projects', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const { projectName, projectData, dataSource } = req.body;

      const newProject = await createUserProject({
        userId: user.id,
        projectName,
        projectData,
        dataSource
      });

      console.log(`User ${user.username} saved project: ${projectName}`);
      res.status(201).json(newProject);
    } catch (error) {
      console.error('Error saving project:', error);
      res.status(500).json({ error: 'Failed to save project' });
    }
  });

  // API routes with /api prefix
  
  // Chat AI routes (now protected)
  app.use('/api/chat', isAuthenticated, chatRoutes);
  
  // Direct API handlers for chat functionality for better compatibility
  app.get('/api/chat/sessions', async (req, res) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const sessions = await storage.getAllChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      res.status(500).json({ message: 'Failed to fetch chat sessions' });
    }
  });
  
  // Create new chat session
  app.post('/api/chat/sessions', async (req, res) => {
    try {
      const { title = 'New Conversation' } = req.body;
      const session = await storage.createChatSession({ title });
      res.status(201).json(session);
    } catch (error) {
      console.error('Error creating chat session:', error);
      res.status(500).json({ message: 'Failed to create chat session' });
    }
  });
  
  // Get messages for a specific session
  app.get('/api/chat/sessions/:id/messages', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const messages = await storage.getChatMessagesBySession(sessionId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ message: 'Failed to fetch chat messages' });
    }
  });
  
  // Send a message in a session
  app.post('/api/chat/sessions/:id/messages', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { content, role = 'user' } = req.body;
      
      // Create user message
      const userMessage = await storage.addChatMessage({
        sessionId,
        content,
        role: role as 'user' | 'assistant' | 'system',
      });
      
      // Get message history
      const messageHistory = await storage.getChatMessagesBySession(sessionId);
      
      // Get context for AI response
      const context = {
        projects: await storage.getAllProjects(),
        budgets: await storage.getAllBudgets(),
        fitoutCosts: await db.select().from(fitoutCosts)
      };
      
      // Import the local chat module
      const localChat = await import('./utils/localChat');
      
      // Convert messages to the expected format
      const chatMessages = messageHistory.map(msg => ({
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content
      }));
      
      // Get AI response using local implementation
      const aiResponse = await localChat.getChatCompletion(chatMessages, context);
      
      // Store AI response
      const assistantMessage = await storage.addChatMessage({
        sessionId,
        content: aiResponse,
        role: 'assistant',
      });
      
      // Return both messages
      res.status(201).json({
        userMessage: userMessage,
        assistantMessage: assistantMessage
      });
    } catch (error) {
      console.error('Error sending chat message:', error);
      res.status(500).json({ message: 'Failed to process chat message' });
    }
  });
  
  // Delete a chat session
  app.delete('/api/chat/sessions/:id', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const success = await storage.deleteChatSession(sessionId);
      if (!success) {
        return res.status(404).json({ message: 'Chat session not found' });
      }
      res.status(200).json({ message: 'Chat session deleted successfully' });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      res.status(500).json({ message: 'Failed to delete chat session' });
    }
  });
  
  // Projects (user-specific)
  app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const projects = await storage.getProjectsByUser(user.id);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      // Check if user owns this project
      if (project.userId !== user.id && user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied' });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch project' });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const projectData = { ...req.body, userId: user.id };
      const project = await storage.createProject(projectData);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create project' });
    }
  });

  app.put('/api/projects/:id', async (req, res) => {
    try {
      const project = await storage.updateProject(parseInt(req.params.id), req.body);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update project' });
    }
  });

  // Budgets (user-specific)
  app.get('/api/budgets', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const budgets = await storage.getBudgetsByUser(user.id);
      res.json(budgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      res.status(500).json({ message: 'Failed to fetch budgets' });
    }
  });

  app.get('/api/projects/:projectId/budgets', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const projectId = parseInt(req.params.projectId);
      
      // Verify user owns the project
      const project = await storage.getProject(projectId);
      if (!project || (project.userId !== user.id && user.role !== 'admin')) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const budgets = await storage.getBudgetsByProject(projectId);
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch budgets' });
    }
  });

  app.get('/api/budgets/:id', isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const budget = await storage.getBudget(parseInt(req.params.id));
      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      
      // Verify user owns the project containing this budget
      const project = await storage.getProject(budget.projectId);
      if (!project || (project.userId !== user.id && user.role !== 'admin')) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      res.json(budget);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch budget' });
    }
  });

  app.post('/api/budgets', isAuthenticated, async (req, res) => {
    try {
      console.log('Creating budget with data:', JSON.stringify(req.body, null, 2));
      
      // Validate required fields
      if (!req.body.projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }
      
      // Ensure ttComponentSpecs is properly formatted as JSON string if it's an object
      if (req.body.ttComponentSpecs && typeof req.body.ttComponentSpecs === 'object') {
        req.body.ttComponentSpecs = JSON.stringify(req.body.ttComponentSpecs);
      }
      
      // Ensure spaceAllocation is properly formatted as JSON string if it's an object
      if (req.body.spaceAllocation && typeof req.body.spaceAllocation === 'object') {
        req.body.spaceAllocation = JSON.stringify(req.body.spaceAllocation);
      }
      
      // Ensure costsBreakdown is properly formatted as JSON string if it's an object
      if (req.body.costsBreakdown && typeof req.body.costsBreakdown === 'object') {
        req.body.costsBreakdown = JSON.stringify(req.body.costsBreakdown);
      }
      
      const budget = await storage.createBudget(req.body);
      console.log('Budget created successfully:', budget.id);
      res.status(201).json(budget);
    } catch (error: any) {
      console.error('Budget creation error:', error);
      res.status(400).json({ 
        message: 'Failed to create budget',
        error: error.message,
        details: error.stack
      });
    }
  });

  app.put('/api/budgets/:id', async (req, res) => {
    try {
      const budget = await storage.updateBudget(parseInt(req.params.id), req.body);
      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      res.json(budget);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update budget' });
    }
  });

  // Fitout cost data from database
  app.get('/api/fitout-costs', async (req, res) => {
    try {
      // Get all fitout cost records from the database
      const records = await db.select().from(fitoutCosts);
      
      if (records.length === 0) {
        return res.status(404).json({ message: 'No fitout cost data found in database' });
      }
      
      // Transform database records to FitoutCostData format
      const data: FitoutCostData[] = records.map(record => ({
        country: record.country,
        city: record.city,
        region: record.region,
        costs: {
          sqm: {
            Activity: {
              Low: parseFloat(record.activityLowSqm || '0'),
              Medium: parseFloat(record.activityMediumSqm || '0'),
              High: parseFloat(record.activityHighSqm || '0')
            },
            Team: {
              Low: parseFloat(record.teamLowSqm || '0'),
              Medium: parseFloat(record.teamMediumSqm || '0'),
              High: parseFloat(record.teamHighSqm || '0')
            },
            Event: {
              Low: parseFloat(record.eventLowSqm || '0'),
              Medium: parseFloat(record.eventMediumSqm || '0'),
              High: parseFloat(record.eventHighSqm || '0')
            }
          },
          sqft: {
            Activity: {
              Low: parseFloat(record.activityLowSqft || '0'),
              Medium: parseFloat(record.activityMediumSqft || '0'),
              High: parseFloat(record.activityHighSqft || '0')
            },
            Team: {
              Low: parseFloat(record.teamLowSqft || '0'),
              Medium: parseFloat(record.teamMediumSqft || '0'),
              High: parseFloat(record.teamHighSqft || '0')
            },
            Event: {
              Low: parseFloat(record.eventLowSqft || '0'),
              Medium: parseFloat(record.eventMediumSqft || '0'),
              High: parseFloat(record.eventHighSqft || '0')
            }
          }
        },
        locationFactors: {
          EMEA: parseFloat(record.locationFactorEMEA || '1.0'),
          AMERICA: parseFloat(record.locationFactorAMERICA || '1.0'),
          APAC: parseFloat(record.locationFactorAPAC || '1.0')
        },
        professionalFees: record.professionalFees?.toString() || '0.15'
      }));
      
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching fitout cost data:', error);
      res.status(500).json({ 
        message: 'Failed to fetch fitout cost data',
        error: error.message
      });
    }
  });
  
  // Furniture cost data from database
  app.get('/api/furniture-costs', async (req, res) => {
    try {
      // Get all furniture cost records from the database
      const records = await db.select().from(furnitureCosts);
      
      if (records.length === 0) {
        return res.status(404).json({ message: 'No furniture cost data found in database' });
      }
      
      // Transform database records to FurnitureCostData format
      const data: FurnitureCostData[] = records.map(record => ({
        country: record.country,
        city: record.city,
        region: record.region,
        costs: {
          sqm: {
            Activity: {
              Low: parseFloat(record.activityLowSqm || '0'),
              Medium: parseFloat(record.activityMediumSqm || '0'),
              High: parseFloat(record.activityHighSqm || '0')
            },
            Team: {
              Low: parseFloat(record.teamLowSqm || '0'),
              Medium: parseFloat(record.teamMediumSqm || '0'),
              High: parseFloat(record.teamHighSqm || '0')
            },
            Event: {
              Low: parseFloat(record.eventLowSqm || '0'),
              Medium: parseFloat(record.eventMediumSqm || '0'),
              High: parseFloat(record.eventHighSqm || '0')
            }
          },
          sqft: {
            Activity: {
              Low: parseFloat(record.activityLowSqft || '0'),
              Medium: parseFloat(record.activityMediumSqft || '0'),
              High: parseFloat(record.activityHighSqft || '0')
            },
            Team: {
              Low: parseFloat(record.teamLowSqft || '0'),
              Medium: parseFloat(record.teamMediumSqft || '0'),
              High: parseFloat(record.teamHighSqft || '0')
            },
            Event: {
              Low: parseFloat(record.eventLowSqft || '0'),
              Medium: parseFloat(record.eventMediumSqft || '0'),
              High: parseFloat(record.eventHighSqft || '0')
            }
          }
        },
        locationFactors: {
          EMEA: parseFloat(record.locationFactorEMEA || '1.0'),
          AMERICA: parseFloat(record.locationFactorAMERICA || '1.0'),
          APAC: parseFloat(record.locationFactorAPAC || '1.0')
        }
      }));
      
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching furniture cost data:', error);
      res.status(500).json({ 
        message: 'Failed to fetch furniture cost data',
        error: error.message
      });
    }
  });

  // Technology cost data from database
  app.get('/api/technology-costs', async (req, res) => {
    try {
      // Get all technology cost records from the database
      const records = await db.select().from(technologyCosts);
      
      if (records.length === 0) {
        return res.status(404).json({ message: 'No technology cost data found in database' });
      }
      
      // Transform database records to TechnologyCostData format
      const data = records.map(record => ({
        country: record.country,
        city: record.city,
        region: record.region,
        costs: {
          sqm: {
            Activity: {
              Low: parseFloat(record.activityLowSqm || '0'),
              Medium: parseFloat(record.activityMediumSqm || '0'),
              High: parseFloat(record.activityHighSqm || '0')
            },
            Team: {
              Low: parseFloat(record.teamLowSqm || '0'),
              Medium: parseFloat(record.teamMediumSqm || '0'),
              High: parseFloat(record.teamHighSqm || '0')
            },
            Event: {
              Low: parseFloat(record.eventLowSqm || '0'),
              Medium: parseFloat(record.eventMediumSqm || '0'),
              High: parseFloat(record.eventHighSqm || '0')
            }
          },
          sqft: {
            Activity: {
              Low: parseFloat(record.activityLowSqft || '0'),
              Medium: parseFloat(record.activityMediumSqft || '0'),
              High: parseFloat(record.activityHighSqft || '0')
            },
            Team: {
              Low: parseFloat(record.teamLowSqft || '0'),
              Medium: parseFloat(record.teamMediumSqft || '0'),
              High: parseFloat(record.teamHighSqft || '0')
            },
            Event: {
              Low: parseFloat(record.eventLowSqft || '0'),
              Medium: parseFloat(record.eventMediumSqft || '0'),
              High: parseFloat(record.eventHighSqft || '0')
            }
          }
        },
        locationFactors: {
          EMEA: parseFloat(record.locationFactorEMEA || '1.0'),
          AMERICA: parseFloat(record.locationFactorAMERICA || '1.0'),
          APAC: parseFloat(record.locationFactorAPAC || '1.0')
        },
        inflationRate: parseFloat(record.inflationRate?.toString() || '1.0')
      }));
      
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching technology cost data:', error);
      res.status(500).json({ 
        message: 'Failed to fetch technology cost data',
        error: error.message
      });
    }
  });

  // Countries and cities from authentic T&T 2025 data only
  app.get('/api/locations', async (req, res) => {
    try {
      // Only return authentic T&T 2025 locations
      const { TT2025_COST_DATA } = await import('../client/src/utils/tt2025Data');
      
      // Extract unique countries and their cities from authentic T&T data only
      const locations: { [country: string]: string[] } = {};
      
      TT2025_COST_DATA.forEach(item => {
        if (!locations[item.country]) {
          locations[item.country] = [];
        }
        if (!locations[item.country].includes(item.city)) {
          locations[item.country].push(item.city);
        }
      });
      
      // Sort countries and cities alphabetically
      const sortedLocations: { [country: string]: string[] } = {};
      Object.keys(locations).sort().forEach(country => {
        sortedLocations[country] = locations[country].sort();
      });
      
      console.log(`Returning ${Object.keys(locations).length} authentic T&T countries with ${Object.values(locations).flat().length} total cities`);
      
      res.json(sortedLocations);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ 
        message: 'Failed to fetch locations',
        error: error.message
      });
    }
  });

  // Specifications from database
  app.get('/api/specifications', async (req, res) => {
    try {
      const dataSource = req.query.dataSource as string;
      
      // For T&T data source, return Low/Medium/High specifications
      if (dataSource === 'TT') {
        const ttSpecs: SpecificationData[] = [
          {
            name: 'Low' as any,
            description: 'Standard office fit-out with basic finishes and fixtures',
            walls: 'Painted walls with minimal branding',
            partitions: {
              type: 'Single glazed',
              acousticRating: '38dB Rw',
              costFactor: 1.0
            },
            flooring: 'Standard carpet tiles',
            ceiling: 'Standard suspended ceiling',
            furniture: {
              desks: 'Fixed desks',
              chairs: 'Basic task chairs',
              storage: 'Basic storage solutions'
            },
            technology: {
              av: 'Basic AV with audio conferencing',
              security: 'Standard security features'
            },
            fittings: 'Basic fittings and finishes',
            recommendedFor: 'Standard office spaces with budget constraints'
          },
          {
            name: 'Medium' as any,
            description: 'Enhanced office fit-out with quality finishes and improved functionality',
            walls: 'Feature walls with special finishes',
            partitions: {
              type: 'Double glazed',
              acousticRating: '45dB Rw',
              costFactor: 1.4
            },
            flooring: 'Upgraded options, timber/LVT in specific areas',
            ceiling: 'Feature ceiling elements',
            furniture: {
              desks: 'Mix of static and height-adjustable desks',
              chairs: 'Mid-tier ergonomic chairs',
              storage: 'Enhanced storage solutions'
            },
            technology: {
              av: 'Enhanced AV throughout with video conferencing',
              security: 'Enhanced security features'
            },
            fittings: 'Higher quality fittings and finishes',
            recommendedFor: 'Enhanced office environments requiring more customization'
          },
          {
            name: 'High' as any,
            description: 'Premium office fit-out with high-end finishes and advanced technology',
            walls: 'Feature wall concepts throughout, extensive branding',
            partitions: {
              type: 'Double glazed with high performance',
              acousticRating: '50dB Rw',
              costFactor: 1.8
            },
            flooring: 'High-specification (ceramic, porcelain)',
            ceiling: 'Comprehensive feature ceiling concepts',
            furniture: {
              desks: 'Height-adjustable desks throughout',
              chairs: 'Premium ergonomic chairs',
              storage: 'Premium storage solutions'
            },
            technology: {
              av: 'Premium AV systems with advanced video conferencing',
              security: 'Advanced security systems'
            },
            fittings: 'Premium fittings and finishes throughout',
            recommendedFor: 'High-end office environments with premium requirements'
          }
        ];
        return res.json(ttSpecs);
      }
      
      // Get all specification records from the database for other data sources
      const records = await db.select().from(specifications);
      
      if (records.length === 0) {
        // Fall back to JSON file if no database records
        const dataPath = path.join(process.cwd(), 'data', 'specifications.json');
        if (!fs.existsSync(dataPath)) {
          return res.status(404).json({ message: 'Specifications data not found' });
        }
        
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as SpecificationData[];
        return res.json(data);
      }
      
      // Transform database records to SpecificationData format
      const data: SpecificationData[] = records.map(record => ({
        name: record.name as Specification,
        description: record.description,
        walls: record.walls,
        partitions: {
          type: record.partitionType,
          acousticRating: record.partitionAcousticRating,
          costFactor: parseFloat(record.partitionCostFactor)
        },
        flooring: record.flooring,
        ceiling: record.ceiling,
        furniture: {
          desks: record.furnitureDesks,
          chairs: record.furnitureChairs,
          storage: record.furnitureStorage
        },
        technology: {
          av: record.technologyAV,
          security: record.technologySecurity
        },
        fittings: record.fittings,
        recommendedFor: record.recommendedFor
      }));
      
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching specifications:', error);
      res.status(500).json({ 
        message: 'Failed to fetch specifications',
        error: error.message
      });
    }
  });
  
  // Get layout templates
  app.get('/api/layout-templates', async (req, res) => {
    try {
      const dataSource = req.query.dataSource as string;
      
      // For T&T data source, return T&T-specific layout templates
      if (dataSource === 'TT') {
        const ttLayouts = [
          {
            name: 'Standard Office',
            description: 'Traditional office layout with private offices and open workspace',
            benefits: ['Clear hierarchy', 'Privacy for focused work', 'Meeting spaces'],
            spaceTypes: {
              'Private Offices': { percentage: 40, area: 0 },
              'Open Workspace': { percentage: 35, area: 0 },
              'Meeting Rooms': { percentage: 15, area: 0 },
              'Support Areas': { percentage: 10, area: 0 }
            }
          },
          {
            name: 'Open Plan',
            description: 'Modern open plan office with collaboration zones',
            benefits: ['Maximum collaboration', 'Flexible workspace', 'Cost effective'],
            spaceTypes: {
              'Open Workspace': { percentage: 60, area: 0 },
              'Collaboration Areas': { percentage: 20, area: 0 },
              'Meeting Rooms': { percentage: 15, area: 0 },
              'Support Areas': { percentage: 5, area: 0 }
            }
          },
          {
            name: 'Hybrid Workspace',
            description: 'Flexible hybrid workspace supporting various work styles',
            benefits: ['Activity-based working', 'Flexible arrangements', 'Future-ready'],
            spaceTypes: {
              'Open Workspace': { percentage: 45, area: 0 },
              'Private Focus Areas': { percentage: 20, area: 0 },
              'Collaboration Areas': { percentage: 20, area: 0 },
              'Meeting Rooms': { percentage: 10, area: 0 },
              'Support Areas': { percentage: 5, area: 0 }
            }
          }
        ];
        return res.json(ttLayouts);
      }
      
      // Get all layout template records from the database for other data sources
      const records = await db.select().from(layoutTemplates);
      
      if (records.length === 0) {
        // Fall back to JSON file if no database records
        const dataPath = path.join(process.cwd(), 'data', 'layout_templates.json');
        if (!fs.existsSync(dataPath)) {
          return res.status(404).json({ message: 'Layout templates data not found' });
        }
        
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        return res.json(data);
      }
      
      // Transform database records to the expected format
      const data = records.map(record => ({
        name: record.name,
        description: record.description,
        benefits: record.benefits ? JSON.parse(record.benefits) : [],
        spaceTypes: record.defaultAllocation
      }));
      
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching layout templates:', error);
      res.status(500).json({ 
        message: 'Failed to fetch layout templates',
        error: error.message
      });
    }
  });

  // Budget template structure from database
  app.get('/api/budget-template', async (req, res) => {
    try {
      // Get budget template from the database
      const records = await db.select().from(budgetTemplates);
      
      if (records.length === 0) {
        // Fall back to JSON file if no database records
        const dataPath = path.join(process.cwd(), 'data', 'budget_template_structure.json');
        if (!fs.existsSync(dataPath)) {
          return res.status(404).json({ message: 'Budget template structure not found' });
        }
        
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as BudgetCategory[];
        return res.json(data);
      }
      
      // Use the first template
      const template = records[0];
      const data = template.structure as BudgetCategory[];
      
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching budget template structure:', error);
      res.status(500).json({ 
        message: 'Failed to fetch budget template structure',
        error: error.message
      });
    }
  });

  // Analyze Excel file structure
  app.get('/api/admin/analyze-excel', async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'attached_assets', 'CBRE Fit Out Guide Cost Data_Fitout Only.xlsx');
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Excel file not found' });
      }
      
      const excelData = await parseExcelFile(filePath);
      
      res.status(200).json({ 
        message: 'Excel file parsed successfully',
        sheetNames: Object.keys(excelData),
        // For each sheet, include the first row and row count
        sheets: Object.entries(excelData).reduce<Record<string, any>>((acc, [sheetName, data]) => {
          if (Array.isArray(data)) {
            acc[sheetName] = {
              rowCount: data.length,
              firstRow: data.length > 0 ? data[0] : null
            };
          } else {
            acc[sheetName] = { rowCount: 0, firstRow: null };
          }
          return acc;
        }, {})
      });
    } catch (error: any) {
      console.error('Error analyzing Excel file:', error);
      res.status(500).json({ 
        message: 'Failed to analyze Excel file', 
        error: error.message
      });
    }
  });

  // Get all currency rates
  app.get('/api/currency-rates', async (req, res) => {
    try {
      // Import the currency functions
      const { getAllCurrencyRates } = await import('./utils/currencyImport');
      
      // Get all currency rates
      const currencyRates = await getAllCurrencyRates();
      
      if (currencyRates.length === 0) {
        return res.status(404).json({ message: 'No currency rates found in database' });
      }
      
      console.log("Returning currency rates:", currencyRates.length);
      console.log("Sample EUR:", currencyRates.find((rate: any) => rate.currencyCode === 'EUR'));
      console.log("Sample GBP:", currencyRates.find((rate: any) => rate.currencyCode === 'GBP'));
      
      res.json(currencyRates);
    } catch (error: any) {
      console.error('Error fetching currency rates:', error);
      res.status(500).json({ 
        message: 'Failed to fetch currency rates', 
        error: error.message
      });
    }
  });
  
  // Debug currency rates for a specific country
  app.get('/api/currency-rates/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const { getCurrencyExchangeRate } = await import('./utils/currencyImport');
      
      const rate = await getCurrencyExchangeRate(code.toUpperCase());
      
      if (rate === null) {
        return res.status(404).json({ message: `Currency code ${code} not found` });
      }
      
      res.json({ code: code.toUpperCase(), rate });
    } catch (error: any) {
      console.error(`Error fetching currency rate for ${req.params.code}:`, error);
      res.status(500).json({ 
        message: 'Failed to fetch currency rate', 
        error: error.message
      });
    }
  });
  
  // Import technology costs from Excel
  app.post('/api/admin/import-technology-costs', async (req, res) => {
    try {
      // Import the technology import function
      const { importTechnologyCostsFromExcel } = await import('./utils/technologyImport');
      
      // Build file path - use main CBRE file with TECH sheet
      const filePath = path.join(process.cwd(), 'attached_assets', 'CBRE Fit Out Guide Cost Data_29.01.2024 - Rev 3 - RC OO (2).xlsx');
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File not found at ${filePath}`);
        return res.status(404).json({ message: 'Technology costs Excel file not found' });
      }
      
      // Import technology costs from Excel
      await importTechnologyCostsFromExcel(filePath);
      
      // Fetch the imported data from the database
      const techRecords = await db.select().from(technologyCosts);
      
      res.status(200).json({ 
        message: 'Technology costs imported successfully', 
        count: techRecords.length,
        data: techRecords.slice(0, 5) // Only return first 5 records to avoid huge response
      });
    } catch (error: any) {
      console.error('Error importing technology costs:', error);
      res.status(500).json({ 
        message: 'Failed to import technology costs', 
        error: error.message
      });
    }
  });

  // Import currency rates from Excel
  app.post('/api/admin/import-currency-rates', async (req, res) => {
    try {
      // Import the currency import function
      const { importCurrencyRatesFromExcel } = await import('./utils/currencyImport');
      
      // Build file path - use Budget Template 1
      const filePath = path.join(process.cwd(), 'attached_assets', 'Budget Template 1.xlsx');
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File not found at ${filePath}`);
        return res.status(404).json({ message: 'Currency rates Excel file not found' });
      }
      
      // Import currency rates from Excel
      await importCurrencyRatesFromExcel(filePath);
      
      // Fetch the imported data from the database
      const { getAllCurrencyRates } = await import('./utils/currencyImport');
      const currencyRatesData = await getAllCurrencyRates();
      
      res.status(200).json({ 
        message: 'Currency rates imported successfully', 
        count: currencyRatesData.length,
        data: currencyRatesData.slice(0, 10) // Only return first 10 records to avoid huge response
      });
    } catch (error: any) {
      console.error('Error importing currency rates:', error);
      res.status(500).json({ 
        message: 'Failed to import currency rates', 
        error: error.message
      });
    }
  });

  // Initialize database with reference data
  app.post('/api/admin/initialize-database', async (req, res) => {
    try {
      const { importFitoutCosts = false } = req.body;
      
      // Import the initialization function
      const { initializeDatabase } = await import('./utils/databaseImport');
      
      // Initialize the database with reference data
      await initializeDatabase();
      
      // Optionally import fitout costs from Excel if requested
      if (importFitoutCosts) {
        const filePath = path.join(process.cwd(), 'attached_assets', 'CBRE Fit Out Guide Cost Data_Fitout Only.xlsx');
        if (fs.existsSync(filePath)) {
          await importFitoutCostsFromExcel(filePath);
        }
      }
      
      // Return success response with counts from each table
      const fitoutCostsCount = (await db.select().from(fitoutCosts)).length;
      const specificationsCount = (await db.select().from(specifications)).length;
      const layoutTemplatesCount = (await db.select().from(layoutTemplates)).length;
      const budgetTemplatesCount = (await db.select().from(budgetTemplates)).length;
      
      res.status(200).json({
        message: 'Database initialized successfully',
        counts: {
          fitoutCosts: Number(fitoutCostsCount),
          specifications: Number(specificationsCount),
          layoutTemplates: Number(layoutTemplatesCount),
          budgetTemplates: Number(budgetTemplatesCount)
        }
      });
    } catch (error: any) {
      console.error('Error initializing database:', error);
      res.status(500).json({
        message: 'Failed to initialize database',
        error: error.message
      });
    }
  });

  // Budget calculation endpoint
  app.post('/api/calculate-budget', async (req, res) => {
    try {
      const { project, budget } = req.body;
      
      console.log("=== BUDGET CALCULATION API ENDPOINT ===");
      console.log("Project:", project);
      console.log("Budget:", budget);
      
      // Validate required fields
      if (!project || !budget) {
        return res.status(400).json({ 
          message: 'Missing required fields: project and budget are required',
          received: { project: !!project, budget: !!budget }
        });
      }
      
      if (!project.country || !project.city || !project.totalArea) {
        return res.status(400).json({ 
          message: 'Missing required project fields: country, city, and totalArea are required',
          received: { 
            country: !!project.country, 
            city: !!project.city, 
            totalArea: !!project.totalArea 
          }
        });
      }
      
      if (!budget.specification || !budget.scope) {
        return res.status(400).json({ 
          message: 'Missing required budget fields: specification and scope are required',
          received: { 
            specification: !!budget.specification, 
            scope: !!budget.scope 
          }
        });
      }
      
      // Get budget template structure for calculation
      const budgetTemplateRecords = await db.select().from(budgetTemplates);
      let budgetStructure = [];
      
      if (budgetTemplateRecords.length > 0) {
        budgetStructure = budgetTemplateRecords[0].structure;
      } else {
        // Fallback to JSON file
        const dataPath = path.join(process.cwd(), 'data', 'budget_template_structure.json');
        if (fs.existsSync(dataPath)) {
          budgetStructure = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        }
      }
      
      // Perform server-side budget calculation without API calls for CBRE
      if (budget.primaryDataSource === 'CBRE') {
        const result = await performServerSideBudgetCalculation(project, budget, budgetStructure);
        console.log("Server-side calculation result:", result);
        res.json(result);
        return;
      }
      
      // For other data sources, fall back to client-side calculator
      const { calculateBudget } = await import('../client/src/utils/budgetCalculator');
      const result = await calculateBudget({
        project,
        budget,
        budgetStructure
      });
      
      console.log("Budget calculation result:", result);
      
      res.json(result);
      
    } catch (error: any) {
      console.error('Budget calculation API error:', error);
      res.status(500).json({ 
        message: 'Budget calculation failed', 
        error: error.message,
        stack: error.stack
      });
    }
  });

  // Import fit-out costs from Excel endpoint
  app.post('/api/admin/import-fitout-costs', async (req, res) => {
    try {
      console.log("Import endpoint called, current directory:", process.cwd());
      
      // List files in attached_assets directory to verify
      const assetsDir = path.join(process.cwd(), 'attached_assets');
      try {
        const files = fs.readdirSync(assetsDir);
        console.log("Files in attached_assets directory:", files);
      } catch (err) {
        console.error("Error reading attached_assets directory:", err);
      }
      
      // Build file path
      const filePath = path.join(process.cwd(), 'attached_assets', 'CBRE Fit Out Guide Cost Data_Fitout Only.xlsx');
      console.log("Full Excel file path:", filePath);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File not found at ${filePath}`);
        return res.status(404).json({ message: 'Fit-out costs Excel file not found' });
      }
      
      console.log("File exists, attempting to import...");
      
      // Import Excel data to database
      await importFitoutCostsFromExcel(filePath);
      
      // Fetch the imported data from the database
      console.log("Import complete, checking database for imported records...");
      const importedData = await db.select().from(fitoutCosts);
      console.log(`Found ${importedData.length} imported records`);
      
      res.status(200).json({ 
        message: 'Fit-out costs imported successfully', 
        count: importedData.length,
        data: importedData.slice(0, 5) // Only return first 5 records to avoid huge response
      });
    } catch (error: any) {
      console.error('Error importing fit-out costs:', error);
      res.status(500).json({ 
        message: 'Failed to import fit-out costs', 
        error: error.message, 
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      });
    }
  });

  // Dataset validation endpoint
  app.get('/api/validate-dataset', async (req, res) => {
    try {
      const validation = await validateDataset();
      
      res.status(200).json({
        isValid: validation.isValid,
        datasetName: validation.datasetName,
        timestamp: validation.timestamp,
        issues: validation.issues,
        message: validation.isValid 
          ? 'Dataset validation successful' 
          : 'Dataset validation failed - using incorrect dataset'
      });
    } catch (error: any) {
      console.error('Error validating dataset:', error);
      res.status(500).json({ 
        message: 'Failed to validate dataset', 
        error: error.message
      });
    }
  });

  // Get dataset validation warnings (shorter response for UI)
  app.get('/api/dataset-warnings', async (req, res) => {
    try {
      const warnings = await getDatasetValidationWarnings();
      
      res.status(200).json({
        hasWarnings: warnings.length > 0,
        warnings
      });
    } catch (error: any) {
      console.error('Error getting dataset warnings:', error);
      res.status(500).json({ 
        message: 'Failed to get dataset warnings', 
        error: error.message
      });
    }
  });

  // Multi-source comparison endpoint
  app.post('/api/calculate-multi-guide', isAuthenticated, async (req: any, res) => {
    try {
      const { 
        primaryGuide, 
        comparisonGuides, 
        project,
        budget
      } = req.body;

      console.log('🔍 Multi-guide calculation request:', { 
        primaryGuide, 
        comparisonGuides, 
        project: { country: project.country, city: project.city }, 
        budget: { specification: budget.specification, scope: budget.scope }
      });

      // Validate input parameters
      if (!primaryGuide || !comparisonGuides || !project || !budget) {
        throw new Error('Missing required parameters');
      }

      // Calculate primary guide result
      console.log('📊 Calculating primary guide:', primaryGuide);
      const primaryResult = await performServerSideBudgetCalculation(project, { ...budget, primaryDataSource: primaryGuide }, []);
      console.log('✅ Primary guide calculation complete:', {
        totalCost: primaryResult?.totalCost,
        currency: primaryResult?.localCurrencyCode
      });
      
      // Calculate comparison guides with mapping
      console.log('🔄 Calculating comparison guides:', comparisonGuides);
      const comparisonResults = await Promise.all(
        comparisonGuides.map(async (guideId: string) => {
          try {
            console.log(`📈 Processing comparison guide: ${guideId}`);
            const guideData = await calculateGuideWithMapping(guideId, project, budget);
            console.log(`✅ ${guideId} calculation complete:`, {
              totalCost: guideData.result?.totalCost,
              coverage: guideData.coverage
            });
            return {
              guideId,
              guideName: getGuideName(guideId),
              result: guideData.result,
              assumptions: guideData.assumptions,
              dataAvailability: guideData.coverage,
              error: null
            };
          } catch (error) {
            console.error(`❌ Error calculating ${guideId}:`, error.message);
            return {
              guideId,
              guideName: getGuideName(guideId),
              result: null,
              assumptions: [],
              dataAvailability: 'error',
              error: error.message
            };
          }
        })
      );

      const response = {
        primary: {
          guideId: primaryGuide,
          guideName: getGuideName(primaryGuide),
          result: primaryResult
        },
        comparisons: comparisonResults,
        mappingNotes: generateMappingNotes(primaryGuide, comparisonGuides)
      };

      console.log('🎯 Multi-guide calculation response prepared:', {
        primaryTotal: primaryResult?.totalCost,
        comparisonsCount: comparisonResults.length,
        successfulComparisons: comparisonResults.filter(c => c.dataAvailability === 'available').length
      });

      res.json(response);

    } catch (error) {
      console.error('❌ Multi-guide calculation error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
