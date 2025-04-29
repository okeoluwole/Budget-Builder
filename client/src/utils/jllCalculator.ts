import { JLLLayout, JLLQuality, Project, SpaceAllocation } from "@shared/schema";
import { apiRequest } from '@/lib/queryClient';

// Apply inflation to a cost value
const applyInflation = (value: number, inflationRate: number): number => {
  return value * (1 + inflationRate);
};

// JLL cost breakdown percentages by region
export const jllCostsBreakdownPercentages = {
  // Global averages (fallback)
  'global': {
    'Builders Works': 0.37, // 37% 
    'M&E Services': 0.29,   // 29%
    'Furniture, Fixtures, Equipment': 0.14, // 14%
    'Security, IT & AV works': 0.12,     // 12%
    'Professional Services': 0.08  // 8%
  },
  // Asia Pacific
  'APAC': {
    'Builders Works': 0.36, // 36%
    'M&E Services': 0.32,   // 32%
    'Furniture, Fixtures, Equipment': 0.15, // 15%
    'Security, IT & AV works': 0.10,     // 10%
    'Professional Services': 0.07  // 7%
  },
  // Europe, Middle East, & Africa
  'EMEA': {
    'Builders Works': 0.35, // 35%
    'M&E Services': 0.31,   // 31%
    'Furniture, Fixtures, Equipment': 0.15, // 15%
    'Security, IT & AV works': 0.11,     // 11%
    'Professional Services': 0.08  // 8%
  },
  // Latin America
  'LATAM': {
    'Builders Works': 0.38, // 38%
    'M&E Services': 0.28,   // 28%
    'Furniture, Fixtures, Equipment': 0.14, // 14%
    'Security, IT & AV works': 0.12,     // 12%
    'Professional Services': 0.08  // 8%
  },
  // North America
  'NAM': {
    'Builders Works': 0.39, // 39%
    'M&E Services': 0.27,   // 27%
    'Furniture, Fixtures, Equipment': 0.12, // 12%
    'Security, IT & AV works': 0.13,     // 13%
    'Professional Services': 0.09  // 9%
  }
};

// Result type for JLL calculations
export interface JLLCalculationResult {
  fitoutCost: number;
  furnitureCost: number;
  totalCost: number;
  rawUnitCost: number;
  adjustedUnitCost: number;
  costsBreakdown: { [key: string]: number };
  defaultAllocation?: SpaceAllocation;
}

// Function to calculate JLL budget
export async function calculateJllBudget(
  project: Project,
  jllLayout: JLLLayout,
  jllQuality: JLLQuality,
  scope: string = 'Fitout'
): Promise<JLLCalculationResult> {
  console.log('====== JLL CALCULATION START ======');
  
  // Initialize the result
  let fitoutCost = 0;
  let furnitureCost = 0;
  let totalCost = 0;
  let costsBreakdown: { [key: string]: number } = {};
  let defaultAllocation: SpaceAllocation = {};
  
  try {
    // SIMPLIFIED APPROACH: Use fixed JLL rates from the 2025 JLL report
    // Global average costs matrix (in USD/sqm) from JLL 2025 guide
    const jllBaseRates = {
      'Open & flexible': {
        'Baseline': 1700, // $1,700/sqm
        'Medium': 1830,   // $1,830/sqm
        'High': 2090      // $2,090/sqm
      },
      'High spatial variety': {
        'Baseline': 1830, // $1,830/sqm
        'Medium': 1970,   // $1,970/sqm 
        'High': 2250      // $2,250/sqm
      },
      'Structured': {
        'Baseline': 1900, // $1,900/sqm
        'Medium': 2050,   // $2,050/sqm
        'High': 2360      // $2,360/sqm
      }
    };
    
    // Determine region-based adjustment factors
    let regionFactor = 1.0; // Default - no adjustment
    
    // Apply regional factors based on JLL 2025 data
    if (project.country === 'United States') {
      regionFactor = 1.05; // 5% higher than global average
    } else if (['United Kingdom', 'France', 'Germany'].includes(project.country)) {
      regionFactor = 1.08; // 8% higher for major European markets
    } else if (['Japan', 'Singapore', 'Hong Kong'].includes(project.country)) {
      regionFactor = 1.12; // 12% higher for premium Asian markets
    } else if (['China', 'India', 'Brazil'].includes(project.country)) {
      regionFactor = 0.92; // 8% lower for emerging markets
    }
    
    console.log(`Applied region factor for ${project.country}: ${regionFactor}`);
    
    // Get base rate for the selected layout and quality
    const baseRate = jllBaseRates[jllLayout][jllQuality];
    console.log(`JLL base rate for ${jllLayout}/${jllQuality}: ${baseRate} USD/sqm`);
    
    // Apply region factor to get adjusted rate
    const adjustedRate = baseRate * regionFactor;
    console.log(`Region-adjusted rate: ${adjustedRate} USD/sqm`);
    
    // If needed, convert from sqm to sqft or vice versa
    let calculationRate = adjustedRate;
    if (project.areaUnit === 'sqft') {
      // Convert rate from USD/sqm to USD/sqft (1 sqm = 10.764 sqft)
      calculationRate = adjustedRate / 10.764;
      console.log(`Converted to USD/sqft: ${calculationRate}`);
    }
    
    // Calculate raw cost
    const rawAreaCost = calculationRate * project.totalArea;
    console.log(`Raw area cost: ${rawAreaCost} USD`);
    
    // Apply inflation if specified
    const inflatedCost = project.inflationRate 
      ? applyInflation(rawAreaCost, project.inflationRate)
      : rawAreaCost;
    console.log(`After inflation: ${inflatedCost} USD`);
    
    // Use JLL's standard breakdown percentages by category
    const defaultBreakdown = {
      'Builders Works': 0.37, // 37% 
      'M&E Services': 0.29,   // 29%
      'Furniture, Fixtures, Equipment': 0.14, // 14% - For furniture portion
      'Security, IT & AV works': 0.12,    // 12%
      'Professional Services': 0.08  // 8%
    };
    
    // Apply breakdown based on scope
    if (scope === 'Fitout' || scope === 'Both') {
      // For fitout, exclude furniture percentage
      fitoutCost = inflatedCost * (1 - defaultBreakdown['Furniture, Fixtures, Equipment']);
      console.log(`Fitout cost: ${fitoutCost} USD`);
    }
    
    if (scope === 'Furniture' || scope === 'Both') {
      // For furniture, include only furniture percentage
      furnitureCost = inflatedCost * defaultBreakdown['Furniture, Fixtures, Equipment'];
      console.log(`Furniture cost: ${furnitureCost} USD`);
    }
    
    // Special case if scope is just furniture
    if (scope === 'Furniture') {
      // Override with just furniture (100%)
      furnitureCost = inflatedCost;
      console.log(`Furniture-only cost: ${furnitureCost} USD`);
    }
    
    // Set total cost based on scope
    totalCost = scope === 'Fitout' ? fitoutCost : 
              scope === 'Furniture' ? furnitureCost : 
              fitoutCost + furnitureCost; // For 'Both'
    
    console.log(`Total cost (${scope}): ${totalCost} USD`);
    console.log('====== JLL CALCULATION COMPLETE ======');
    
    // Initialize costs breakdown with JLL marker
    costsBreakdown['JLL DATA SOURCE'] = 1;  // Marker to identify JLL data source
    
    // Add basic breakdown to costs breakdown
    costsBreakdown['FITOUT BASE COSTS'] = parseFloat((scope === 'Fitout' || scope === 'Both' ? fitoutCost : 0).toFixed(2));
    costsBreakdown['FURNITURE BASE COSTS'] = parseFloat((scope === 'Furniture' || scope === 'Both' ? furnitureCost : 0).toFixed(2));
    
    // Add detailed JLL breakdown
    if (scope === 'Fitout' || scope === 'Both') {
      const fitoutPortion = inflatedCost * (1 - defaultBreakdown['Furniture, Fixtures, Equipment']);
      costsBreakdown['BUILDERS WORKS'] = parseFloat((fitoutPortion * defaultBreakdown['Builders Works'] / (1 - defaultBreakdown['Furniture, Fixtures, Equipment'])).toFixed(2));
      costsBreakdown['M&E SERVICES'] = parseFloat((fitoutPortion * defaultBreakdown['M&E Services'] / (1 - defaultBreakdown['Furniture, Fixtures, Equipment'])).toFixed(2));
      costsBreakdown['SECURITY, IT & AV'] = parseFloat((fitoutPortion * defaultBreakdown['Security, IT & AV works'] / (1 - defaultBreakdown['Furniture, Fixtures, Equipment'])).toFixed(2));
    }
    
    // Create default allocation based on JLL layout type
    if (jllLayout === 'Open & flexible') {
      defaultAllocation = {
        'Open workspace': { percentage: 65, area: project.totalArea * 0.65 },
        'Meeting areas': { percentage: 20, area: project.totalArea * 0.20 },
        'Support spaces': { percentage: 15, area: project.totalArea * 0.15 }
      };
    } else if (jllLayout === 'High spatial variety') {
      defaultAllocation = {
        'Open workspace': { percentage: 45, area: project.totalArea * 0.45 },
        'Focus rooms': { percentage: 15, area: project.totalArea * 0.15 },
        'Meeting areas': { percentage: 25, area: project.totalArea * 0.25 },
        'Support spaces': { percentage: 15, area: project.totalArea * 0.15 }
      };
    } else if (jllLayout === 'Structured') {
      defaultAllocation = {
        'Open workspace': { percentage: 40, area: project.totalArea * 0.40 },
        'Private offices': { percentage: 25, area: project.totalArea * 0.25 },
        'Meeting areas': { percentage: 20, area: project.totalArea * 0.20 },
        'Support spaces': { percentage: 15, area: project.totalArea * 0.15 }
      };
    }
    
    return {
      fitoutCost,
      furnitureCost,
      totalCost,
      rawUnitCost: calculationRate,
      adjustedUnitCost: calculationRate,
      costsBreakdown,
      defaultAllocation
    };
    
  } catch (error: any) {
    console.error('Error in JLL calculation', error);
    throw new Error(`JLL calculation error: ${error.message}`);
  }
}