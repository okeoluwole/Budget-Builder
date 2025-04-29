import { Project, Budget, BudgetCategory, FitoutCostData, SpaceAllocation, CurrencyRate, BudgetScope, FurnitureCostData, JLLLayout, JLLQuality, DataSourceType } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface BudgetCalculationParams {
  project: Project;
  budget: Partial<Budget> & { 
    spaceAllocation?: SpaceAllocation;
    primaryDataSource?: DataSourceType;
    jllLayout?: JLLLayout;
    jllQuality?: JLLQuality;
  };
  budgetStructure: BudgetCategory[];
}

interface CalculationResult {
  totalCost: number;
  fitoutCost?: number;      // Cost for fit-out portion
  furnitureCost?: number;   // Cost for furniture portion
  costsBreakdown: { [key: string]: number };
  rawUnitCost?: number;     // Raw unit cost from dataset
  adjustedUnitCost?: number; // Unit cost after applying factors
  areaUnit?: string;        // sqm or sqft
  localCurrencyCode?: string;
  localCurrencyRate?: number;
  localCurrencyTotalCost?: number;
  localCurrencyCostsBreakdown?: { [key: string]: number };
  datasetInfo?: {
    name: string;           // Dataset file name
    sheet: string;          // Sheet name used
    region: string;         // Region from dataset
    benchmark: string;      // Benchmark used
  };
}

// Calculate space allocation costs
export const calculateSpaceAllocationCosts = (
  totalCost: number,
  spaceAllocation: SpaceAllocation
): { [key: string]: number } => {
  const costs: { [key: string]: number } = {};
  
  Object.entries(spaceAllocation).forEach(([spaceName, space]) => {
    costs[spaceName] = totalCost * (space.percentage / 100);
  });
  
  return costs;
};

// Get the specification cost factor based on specification level
const getSpecificationFactor = (specification: string): number => {
  switch (specification) {
    case 'Bronze':
      return 1.0;
    case 'Silver':
      return 1.4;
    case 'Gold':
      return 1.8;
    default:
      return 1.0;
  }
};

// Apply inflation rate to costs
const applyInflation = (value: number, inflationRate: number, years: number = 1): number => {
  if (!inflationRate || inflationRate <= 0) return value;
  const factor = Math.pow(1 + (inflationRate / 100), years);
  return value * factor;
};

// Get JLL rate based on layout and quality
const getJllRateFactor = (layout: JLLLayout, quality: JLLQuality): number => {
  // Global average costs matrix (in USD/sqm) from JLL 2025 guide
  // Base values for each JLL layout and quality combination
  const globalAverageCosts = {
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

  // Reference USD/sqm value using Medium quality in the Open & flexible layout
  const baselineValue = 1830; // Medium quality, Open & flexible
  
  // Return a factor relative to the baseline
  return globalAverageCosts[layout][quality] / baselineValue;
};

// JLL costs breakdown percentages by region
const jllCostsBreakdownPercentages = {
  // Global averages (default)
  'global': {
    'Builders Works': 0.37, // 37%
    'M&E Services': 0.29,   // 29%
    'Furniture, Fixtures, Equipment': 0.13, // 13%
    'Security, IT & AV works': 0.12,     // 12%
    'Professional Services': 0.08  // 8%
  },
  // Region-specific breakdowns
  'APAC': {
    'Builders Works': 0.34, // 34%
    'M&E Services': 0.32,   // 32%
    'Furniture, Fixtures, Equipment': 0.15, // 15%
    'Security, IT & AV works': 0.12,     // 12%
    'Professional Services': 0.07  // 7%
  },
  'EMEA': {
    'Builders Works': 0.36, // 36%
    'M&E Services': 0.30,   // 30%
    'Furniture, Fixtures, Equipment': 0.13, // 13%
    'Security, IT & AV works': 0.11,     // 11%
    'Professional Services': 0.10  // 10%
  },
  'LATAM': {
    'Builders Works': 0.38, // 38%
    'M&E Services': 0.28,   // 28%
    'Furniture, Fixtures, Equipment': 0.14, // 14%
    'Security, IT & AV works': 0.12,     // 12%
    'Professional Services': 0.08  // 8%
  },
  'NAM': {
    'Builders Works': 0.39, // 39%
    'M&E Services': 0.27,   // 27%
    'Furniture, Fixtures, Equipment': 0.12, // 12%
    'Security, IT & AV works': 0.13,     // 13%
    'Professional Services': 0.09  // 9%
  }
};

// Cache for data to avoid repeated API calls
let cachedFitoutCostsData: FitoutCostData[] | null = null;
let cachedFurnitureCostsData: FurnitureCostData[] | null = null;
let cachedJllCostsData: any[] | null = null;

// Calculate budget based on project and budget data
export const calculateBudget = async ({
  project,
  budget,
  budgetStructure
}: BudgetCalculationParams): Promise<CalculationResult> => {
  // Check required parameters, but make space allocation optional for JLL data source
  if (!project || !budget || !budget.specification || !budget.layout) {
    throw new Error('Missing required budget parameters');
  }
  
  // If using JLL data source, we don't require space allocation
  if (budget.primaryDataSource !== 'JLL' && !budget.spaceAllocation) {
    throw new Error('Space allocation is required for non-JLL data sources');
  }

  try {
    // Get the scope from the budget
    const scope = budget.scope || 'Fitout';
    console.log(`Calculating budget for scope: ${scope}`);
    console.log('Using data source:', budget.primaryDataSource || 'CBRE'); // Log selected data source
    
    let fitoutCost = 0;
    let furnitureCost = 0;
    let totalCost = 0;
    
    // Handle JLL data source calculation
    if (budget.primaryDataSource && budget.primaryDataSource === 'JLL') {
      if (!budget.jllLayout || !budget.jllQuality) {
        console.warn('JLL data source selected but missing layout or quality settings');
        // Fall back to default values if not specified
        budget.jllLayout = budget.jllLayout || 'Open & flexible';
        budget.jllQuality = budget.jllQuality || 'Medium';
      }
      
      console.log(`Using JLL layout: ${budget.jllLayout} and quality: ${budget.jllQuality}`);
      
      // For demonstration, we'll base JLL costs on CBRE costs with modifiers
      // This is a simplification - in a real implementation we would use actual JLL data from API
      
      // Get JLL cost factor based on selected layout and quality
      const jllFactor = getJllRateFactor(budget.jllLayout, budget.jllQuality);
      console.log(`JLL factor for ${budget.jllLayout}/${budget.jllQuality}: ${jllFactor}`);
      
      // First get base rates from CBRE data (same as normal calculation)
      // Use cached data if available, otherwise fetch from API
      let fitoutCostsData: FitoutCostData[];
      if (cachedFitoutCostsData) {
        console.log("Using cached fitout costs data as base for JLL calculation");
        fitoutCostsData = cachedFitoutCostsData;
      } else {
        console.log("Fetching fitout costs data from API as base for JLL calculation");
        const res = await apiRequest('GET', '/api/fitout-costs', undefined);
        fitoutCostsData = await res.json();
        cachedFitoutCostsData = fitoutCostsData; // Cache the results
      }
      
      // Find location-specific cost data
      const fitoutLocationData = fitoutCostsData.find(item => 
        item.country === project.country && item.city === project.city
      );
      
      if (!fitoutLocationData) {
        throw new Error(`No cost data found for ${project.city}, ${project.country}`);
      }
      
      // Get base costs - map CBRE specification to closest JLL quality
      // JLL uses Baseline, Medium, High while CBRE uses Low, Medium, High
      const specificationLevel = budget.jllQuality === 'Baseline' ? 'Low' : 
                              budget.jllQuality === 'Medium' ? 'Medium' : 'High';
      
      const areaUnit = project.areaUnit === 'sqm' ? 'sqm' : 'sqft';
      
      // For JLL, we'll use Activity layout as base since it's most versatile
      const baseLayoutType = 'Activity' as keyof typeof fitoutLocationData.costs[typeof areaUnit];
      
      // Get base rate per unit area
      const baseRate = fitoutLocationData.costs[areaUnit][baseLayoutType][specificationLevel];
      if (!baseRate) {
        throw new Error(`No base rate found for JLL calculation`);
      }
      
      // Get the region from location data to apply region-specific JLL costs
      const region = fitoutLocationData.region; // AMERICAS, EMEA, APAC
      console.log(`JLL calculation using region: ${region}`);

      // Map CBRE regions to JLL regions
      let jllRegion = 'global'; // Default to global averages
      if (region === 'AMERICAS') {
        // CBRE's AMERICAS region maps to JLL's NAM (North America) or LATAM (Latin America)
        // For simplicity, we'll use NAM for US/Canada and LATAM for other American countries
        if (['United States', 'Canada'].includes(project.country)) {
          jllRegion = 'NAM';
        } else {
          jllRegion = 'LATAM';
        }
      } else if (region === 'EMEA') {
        jllRegion = 'EMEA';
      } else if (region === 'APAC') {
        jllRegion = 'APAC';
      }
      console.log(`Mapped to JLL region: ${jllRegion}`);

      // Apply JLL-specific factor to the base rate
      const jllRate = baseRate * jllFactor;
      console.log(`Base rate: ${baseRate}, JLL-adjusted rate: ${jllRate}`);
      
      // Calculate cost
      const jllAreaCost = jllRate * project.totalArea;
      
      // Apply inflation if specified
      const inflatedCost = project.inflationRate 
        ? applyInflation(jllAreaCost, project.inflationRate)
        : jllAreaCost;
      
      // Get JLL regional cost breakdown percentages
      // Use the mapped JLL region to get the right cost breakdown percentages
      console.log(`Using ${jllRegion} cost breakdown percentages`);
      const jllBreakdownPercentages = jllRegion === 'APAC' || jllRegion === 'EMEA' || 
                                jllRegion === 'LATAM' || jllRegion === 'NAM' 
                                  ? jllCostsBreakdownPercentages[jllRegion as keyof typeof jllCostsBreakdownPercentages] 
                                  : jllCostsBreakdownPercentages.global;
      
      // For JLL, we'll directly apply the furniture percentage from JLL's breakdown
      const furniturePercentage = jllBreakdownPercentages['Furniture, Fixtures, Equipment']; // 12-15% depending on region
      
      // Based on scope, assign to fitout or furniture cost
      if (scope === 'Fitout' || scope === 'Both') {
        // For fitout, exclude furniture percentage (as it's calculated separately)
        fitoutCost = inflatedCost * (1 - furniturePercentage);
      }
      
      if (scope === 'Furniture' || scope === 'Both') {
        // For furniture, apply only furniture percentage
        furnitureCost = inflatedCost * furniturePercentage;
      }
      
      // If it's just furniture, we need a different calculation
      if (scope === 'Furniture') {
        // Just use the furniture portion directly (100% of cost is furniture)
        furnitureCost = inflatedCost;
      }
      
      // For JLL, the total depends on the scope
      totalCost = scope === 'Fitout' ? fitoutCost : 
                scope === 'Furniture' ? furnitureCost : 
                fitoutCost + furnitureCost; // For 'Both'
                
    } else {
      // Standard calculation for other data sources
    
      // Calculate fitout costs if scope is 'Fitout' or 'Both'
      if (scope === 'Fitout' || scope === 'Both') {
        // Use cached data if available, otherwise fetch from API
        let fitoutCostsData: FitoutCostData[];
        if (cachedFitoutCostsData) {
          console.log("Using cached fitout costs data");
          fitoutCostsData = cachedFitoutCostsData;
        } else {
          console.log("Fetching fitout costs data from API");
          const res = await apiRequest('GET', '/api/fitout-costs', undefined);
          fitoutCostsData = await res.json();
          cachedFitoutCostsData = fitoutCostsData; // Cache the results
        }

        // Find location-specific cost data
        const fitoutLocationData = fitoutCostsData.find(item => 
          item.country === project.country && item.city === project.city
        );

        if (!fitoutLocationData) {
          throw new Error(`No fitout cost data found for ${project.city}, ${project.country}`);
        }

        // Get base costs based on layout type and specification level
        const specificationLevel = budget.specification === 'Bronze' ? 'Low' : 
                                 budget.specification === 'Silver' ? 'Medium' : 'High';
        
        const areaUnit = project.areaUnit === 'sqm' ? 'sqm' : 'sqft';
        const layoutType = budget.layout as keyof typeof fitoutLocationData.costs[typeof areaUnit];
        
        // Get base rate per unit area
        const fitoutBaseRate = fitoutLocationData.costs[areaUnit][layoutType][specificationLevel];
        if (!fitoutBaseRate) {
          throw new Error(`No fitout base rate found for ${budget.layout} layout with ${budget.specification} specification`);
        }
        
        // Calculate fitout cost
        const fitoutAreaCost = fitoutBaseRate * project.totalArea;
        
        // Apply inflation if specified for fitout cost
        fitoutCost = project.inflationRate 
          ? applyInflation(fitoutAreaCost, project.inflationRate)
          : fitoutAreaCost;
      }
      
      // Calculate furniture costs if scope is 'Furniture' or 'Both'
      if (scope === 'Furniture' || scope === 'Both') {
        // Use cached data if available, otherwise fetch from API
        let furnitureCostsData: FurnitureCostData[];
        if (cachedFurnitureCostsData) {
          console.log("Using cached furniture costs data");
          furnitureCostsData = cachedFurnitureCostsData;
        } else {
          console.log("Fetching furniture costs data from API");
          const res = await apiRequest('GET', '/api/furniture-costs', undefined);
          furnitureCostsData = await res.json();
          cachedFurnitureCostsData = furnitureCostsData; // Cache the results
        }

        // Find location-specific cost data
        const furnitureLocationData = furnitureCostsData.find(item => 
          item.country === project.country && item.city === project.city
        );

        if (!furnitureLocationData) {
          throw new Error(`No furniture cost data found for ${project.city}, ${project.country}`);
        }

        // Get base costs based on layout type and specification level
        const specificationLevel = budget.specification === 'Bronze' ? 'Low' : 
                                 budget.specification === 'Silver' ? 'Medium' : 'High';
        
        const areaUnit = project.areaUnit === 'sqm' ? 'sqm' : 'sqft';
        const layoutType = budget.layout as keyof typeof furnitureLocationData.costs[typeof areaUnit];
        
        // Get base rate per unit area
        const furnitureBaseRate = furnitureLocationData.costs[areaUnit][layoutType][specificationLevel];
        if (!furnitureBaseRate) {
          throw new Error(`No furniture base rate found for ${budget.layout} layout with ${budget.specification} specification`);
        }
        
        // Calculate furniture cost
        const furnitureAreaCost = furnitureBaseRate * project.totalArea;
        
        // Apply inflation if specified for furniture cost
        furnitureCost = project.inflationRate 
          ? applyInflation(furnitureAreaCost, project.inflationRate)
          : furnitureAreaCost;
      }
      
      // Calculate total cost based on scope
      totalCost = scope === 'Fitout' ? fitoutCost : 
                  scope === 'Furniture' ? furnitureCost : 
                  fitoutCost + furnitureCost; // For 'Both'
    }
    
    // Store the raw unit cost and adjusted unit cost for reference
    // For 'Both' scope, we need to ensure the rate calculation is consistent with individual components
    let rawUnitCost = 0;
    
    if (scope === 'Both') {
      // For combined scope, use weighted average of individual rates
      if (fitoutCost > 0 && furnitureCost > 0) {
        // If both costs exist, use the weighted average of both rates
        const fitoutRate = fitoutCost / project.totalArea;
        const furnitureRate = furnitureCost / project.totalArea;
        
        // Calculate individual rates for logging
        console.log("Fitout Rate:", fitoutRate, "Furniture Rate:", furnitureRate);
        
        // For combined scope we should display a weighted average of both rates
        // Calculate the proportion of each cost to the total
        const fitoutProportion = fitoutCost / (fitoutCost + furnitureCost);
        const furnitureProportion = furnitureCost / (fitoutCost + furnitureCost);
        
        // Calculate weighted average rate
        const weightedRate = (fitoutRate * fitoutProportion) + (furnitureRate * furnitureProportion);
        console.log("Weighted Rate Calculation:", 
          `(${fitoutRate} × ${fitoutProportion.toFixed(3)}) + (${furnitureRate} × ${furnitureProportion.toFixed(3)}) = ${weightedRate}`);
        
        rawUnitCost = weightedRate;
      } 
      else if (fitoutCost > 0) {
        // If only fitout costs exist, use that rate
        rawUnitCost = fitoutCost / project.totalArea;
      } 
      else if (furnitureCost > 0) {
        // If only furniture costs exist, use that rate
        rawUnitCost = furnitureCost / project.totalArea;
      }
    } else {
      // For individual scopes, use the appropriate rate
      rawUnitCost = scope === 'Fitout' ? 
        (fitoutCost / project.totalArea) : 
        (furnitureCost / project.totalArea);
    }
    
    // In all cases, adjusted unit cost is the same as raw unit cost
    // There's no additional adjustment being applied
    const adjustedUnitCost = rawUnitCost;
    
    // Initialize costs breakdown
    const costsBreakdown: { [key: string]: number } = {};
    
    // Handle cost breakdown differently depending on data source
    if (budget.primaryDataSource && budget.primaryDataSource === 'JLL') {
      // For JLL, we provide a more detailed breakdown based on their standard percentages
      // If it's fitout or both, add the JLL breakdown categories
      if (scope === 'Fitout' || scope === 'Both') {
        // Add the main fitout cost
        costsBreakdown['FITOUT COSTS'] = parseFloat(fitoutCost.toFixed(2));
        
        // Get JLL regional cost breakdown percentages for the current region
        // Use the region information from the cached data
        let currentRegion = 'AMERICAS'; // Default if we can't determine
        
        // Find the location data from cached data
        if (cachedFitoutCostsData) {
          const locationData = cachedFitoutCostsData.find(item => 
            item.country === project.country && item.city === project.city
          );
          
          if (locationData) {
            currentRegion = locationData.region; // AMERICAS, EMEA, APAC
          }
        }
        
        // Map to JLL's region structure
        let currentJllRegion = 'global'; // Default to global averages
        if (currentRegion === 'AMERICAS') {
          // CBRE's AMERICAS region maps to JLL's NAM (North America) or LATAM (Latin America)
          if (['United States', 'Canada'].includes(project.country)) {
            currentJllRegion = 'NAM';
          } else {
            currentJllRegion = 'LATAM';
          }
        } else if (currentRegion === 'EMEA') {
          currentJllRegion = 'EMEA';
        } else if (currentRegion === 'APAC') {
          currentJllRegion = 'APAC';
        }
        
        // Get the breakdown percentages for the current region
        const jllBreakdownPercentages = currentJllRegion === 'APAC' || 
                                    currentJllRegion === 'EMEA' || 
                                    currentJllRegion === 'LATAM' || 
                                    currentJllRegion === 'NAM' 
                                      ? jllCostsBreakdownPercentages[currentJllRegion] 
                                      : jllCostsBreakdownPercentages.global;
        
        console.log('JLL breakdown percentages:', jllBreakdownPercentages);
        
        // Add JLL-specific breakdown categories using the correct region with error handling
        try {
          // Using the local variable with proper error handling
          costsBreakdown['BUILDERS WORKS'] = parseFloat(
            (totalCost * jllBreakdownPercentages['Builders Works']).toFixed(2)
          );
          
          costsBreakdown['M&E SERVICES'] = parseFloat(
            (totalCost * jllBreakdownPercentages['M&E Services']).toFixed(2)
          );
          
          costsBreakdown['SECURITY, IT & AV WORKS'] = parseFloat(
            (totalCost * jllBreakdownPercentages['Security, IT & AV works']).toFixed(2)
          );
          
          costsBreakdown['PROFESSIONAL SERVICES'] = parseFloat(
            (totalCost * jllBreakdownPercentages['Professional Services']).toFixed(2)
          );
        } catch (err) {
          console.error('Error calculating JLL cost breakdown:', err);
          // Use global averages as fallback
          costsBreakdown['BUILDERS WORKS'] = parseFloat((totalCost * 0.37).toFixed(2));
          costsBreakdown['M&E SERVICES'] = parseFloat((totalCost * 0.29).toFixed(2));
          costsBreakdown['SECURITY, IT & AV WORKS'] = parseFloat((totalCost * 0.12).toFixed(2));
          costsBreakdown['PROFESSIONAL SERVICES'] = parseFloat((totalCost * 0.08).toFixed(2));
        }
      }
      
      // Add furniture costs as appropriate
      if (scope === 'Furniture' || scope === 'Both') {
        costsBreakdown['FURNITURE, FIXTURES, EQUIPMENT'] = parseFloat(furnitureCost.toFixed(2));
      }
    } else {
      // Standard breakdown for other data sources
      // Add the appropriate cost category based on scope
      if (scope === 'Fitout' || scope === 'Both') {
        costsBreakdown['FITOUT COSTS'] = parseFloat(fitoutCost.toFixed(2));
      }
      
      if (scope === 'Furniture' || scope === 'Both') {
        costsBreakdown['FURNITURE COSTS'] = parseFloat(furnitureCost.toFixed(2));
      }
    }
    
    // We can add space allocation breakdown for reference
    if (budget.spaceAllocation) {
      const spaceAllocationCosts = calculateSpaceAllocationCosts(totalCost, budget.spaceAllocation);
      
      // Add space type costs for reference 
      Object.entries(spaceAllocationCosts).forEach(([spaceName, cost]) => {
        costsBreakdown[`SPACE: ${spaceName}`] = parseFloat(cost.toFixed(2));
      });
    } else if (budget.primaryDataSource === 'JLL') {
      // For JLL, we create a simplified space allocation based on the JLL layout
      // This ensures the budget results don't depend on actual space allocation
      let defaultJllAllocation: SpaceAllocation = {};
      
      // Create default allocation based on JLL layout type
      if (budget.jllLayout === 'Open & flexible') {
        defaultJllAllocation = {
          'Open workspace': { percentage: 65, area: project.totalArea * 0.65 },
          'Meeting areas': { percentage: 20, area: project.totalArea * 0.20 },
          'Support spaces': { percentage: 15, area: project.totalArea * 0.15 }
        };
      } else if (budget.jllLayout === 'High spatial variety') {
        defaultJllAllocation = {
          'Open workspace': { percentage: 45, area: project.totalArea * 0.45 },
          'Focus rooms': { percentage: 15, area: project.totalArea * 0.15 },
          'Meeting areas': { percentage: 25, area: project.totalArea * 0.25 },
          'Support spaces': { percentage: 15, area: project.totalArea * 0.15 }
        };
      } else if (budget.jllLayout === 'Structured') {
        defaultJllAllocation = {
          'Open workspace': { percentage: 40, area: project.totalArea * 0.40 },
          'Private offices': { percentage: 25, area: project.totalArea * 0.25 },
          'Meeting areas': { percentage: 20, area: project.totalArea * 0.20 },
          'Support spaces': { percentage: 15, area: project.totalArea * 0.15 }
        };
      }
      
      const spaceAllocationCosts = calculateSpaceAllocationCosts(totalCost, defaultJllAllocation);
      
      // Add space type costs for reference 
      Object.entries(spaceAllocationCosts).forEach(([spaceName, cost]) => {
        costsBreakdown[`SPACE: ${spaceName}`] = parseFloat(cost.toFixed(2));
      });
    }

    // Get currency conversion data if available
    // Always set localCurrencyCode based on country to implement 
    // auto-currency detection for all countries
    
    // Map countries to their ISO currency codes - maintain exact copy of mapping in BudgetResultsStep
    const countryToCurrency: Record<string, string> = {
      // Europe
      'Austria': 'EUR',
      'Belgium': 'EUR',
      'Bulgaria': 'BGN',
      'Croatia': 'EUR',
      'Cyprus': 'EUR',
      'Czech Republic': 'CZK',
      'Denmark': 'DKK',
      'Estonia': 'EUR',
      'Finland': 'EUR',
      'France': 'EUR',
      'Germany': 'EUR',
      'Greece': 'EUR',
      'Hungary': 'HUF',
      'Ireland': 'EUR',
      'Italy': 'EUR',
      'Latvia': 'EUR',
      'Lithuania': 'EUR',
      'Luxembourg': 'EUR',
      'Malta': 'EUR',
      'Netherlands': 'EUR',
      'Poland': 'PLN',
      'Portugal': 'EUR',
      'Romania': 'RON',
      'Slovakia': 'EUR',
      'Slovenia': 'EUR',
      'Spain': 'EUR',
      'Sweden': 'SEK',
      'United Kingdom': 'GBP',
      'Switzerland': 'CHF',
      'Norway': 'NOK',
      
      // North America
      'United States': 'USD',
      'Canada': 'CAD',
      'Mexico': 'MXN',
      
      // Asia Pacific
      'Australia': 'AUD',
      'New Zealand': 'NZD',
      'Japan': 'JPY',
      'China': 'CNY',
      'Singapore': 'SGD',
      'Hong Kong': 'HKD',
      'India': 'INR',
      'Indonesia': 'IDR',
      'Malaysia': 'MYR',
      'Philippines': 'PHP',
      'South Korea': 'KRW',
      'Taiwan': 'TWD',
      'Thailand': 'THB',
      'Vietnam': 'VND',
      
      // South America
      'Brazil': 'BRL',
      'Argentina': 'ARS',
      'Chile': 'CLP',
      'Colombia': 'COP',
      'Peru': 'PEN',
      'Venezuela': 'VES',
      
      // Africa
      'South Africa': 'ZAR',
      'Nigeria': 'NGN',
      'Egypt': 'EGP',
      'Kenya': 'KES',
      'Morocco': 'MAD',
      'Ghana': 'GHS',
      'Ethiopia': 'ETB',
      'Tanzania': 'TZS',
      'Uganda': 'UGX',
      'Angola': 'AOA',
      'Mozambique': 'MZN',
      'Zimbabwe': 'ZWL',
      'Botswana': 'BWP',
      'Namibia': 'NAD',
      'Mauritius': 'MUR',
      
      // Middle East
      'Saudi Arabia': 'SAR',
      'United Arab Emirates': 'AED',
      'Qatar': 'QAR',
      'Israel': 'ILS',
      'Turkey': 'TRY',
      'Jordan': 'JOD',
      'Kuwait': 'KWD',
      'Bahrain': 'BHD',
      'Oman': 'OMR',
      'Lebanon': 'LBP',
      'Iraq': 'IQD',
      
      // Other
      'Russia': 'RUB'
    };
    
    // Auto-detect currency from country
    let localCurrencyCode = countryToCurrency[project.country] || budget.localCurrencyCode || project.currency || 'USD';
    let localCurrencyRate: number | undefined;
    let localCurrencyTotalCost: number | undefined;
    let localCurrencyCostsBreakdown: { [key: string]: number } | undefined;
    
    console.log("Budget Calculator - Country:", project.country);
    console.log("Budget Calculator - Detected currency code:", localCurrencyCode);
    
    // Get direct currency exchange rates - 2025 Budget Template rates
    if (localCurrencyCode) {
      try {
        console.log(`Looking up rate for ${localCurrencyCode}`);
        // Get rate directly from API by currency code
        const rateRes = await apiRequest('GET', `/api/currency-rates/${localCurrencyCode}`, undefined);
        const rateData = await rateRes.json();
        
        if (rateData && rateData.rate) {
          localCurrencyRate = parseFloat(rateData.rate.toString());
          
          console.log(`Currency rate for ${localCurrencyCode}: ${localCurrencyRate}`);
          
          // Convert USD to local currency using the exchange rate will be done later
          // after we have calculated the total cost
          console.log(`Will convert USD to ${localCurrencyCode} using rate ${localCurrencyRate}`);
        } else {
          console.log(`No rate found for ${localCurrencyCode}`);
        }
      } catch (error) {
        console.error(`Error getting currency rate for ${localCurrencyCode}:`, error);
      }
    }
    
    // Log currency information before returning
    console.log("Budget calculation results:", {
      totalCost: parseFloat(totalCost.toFixed(2)),
      fitoutCost: parseFloat(fitoutCost.toFixed(2)),
      furnitureCost: parseFloat(furnitureCost.toFixed(2)),
      localCurrencyCode,
      localCurrencyRate,
      localCurrencyTotalCost
    });
    
    // Get the area unit from the project
    const areaUnitToUse = project.areaUnit === 'sqm' ? 'sqm' : 'sqft';
    
    // Determine the sheet name used based on the layout and area unit
    const sheetName = `Table ${budget.layout === 'Activity' ? '1' : budget.layout === 'Team' ? '2' : '3'}_${budget.layout} BYOB ${areaUnitToUse === 'sqm' ? 'Sqm' : 'SqFt'}`;
    
    // Create dataset information for revalidation and transparency
    const datasetFileInfo = scope === 'Fitout' ? 'CBRE Fit Out Guide Cost Data_Fitout Only.xlsx' :
                        scope === 'Furniture' ? 'CBRE Fit Out Guide Cost Data_Furniture Only.xlsx' :
                        'CBRE Fit Out Guide Cost Data_Combined.xlsx';
    
    // We need to be sure we have region information
    let region = '';
    if (scope === 'Fitout' || scope === 'Both') {
      const fitoutLocationData = cachedFitoutCostsData?.find(item => 
        item.country === project.country && item.city === project.city
      );
      if (fitoutLocationData) {
        region = fitoutLocationData.region;
      }
    } else if (scope === 'Furniture') {
      const furnitureLocationData = cachedFurnitureCostsData?.find(item => 
        item.country === project.country && item.city === project.city
      );
      if (furnitureLocationData) {
        region = furnitureLocationData.region;
      }
    }
    
    const datasetInfo = {
      name: datasetFileInfo,
      sheet: sheetName,
      region: region,
      benchmark: `${project.country}/${project.city}`
    };
    
    // Convert local currency values if needed
    if (localCurrencyRate) {
      localCurrencyTotalCost = parseFloat((totalCost * localCurrencyRate).toFixed(2));
      
      // Convert cost breakdown to local currency
      localCurrencyCostsBreakdown = {};
      Object.entries(costsBreakdown).forEach(([key, value]) => {
        if (localCurrencyCostsBreakdown && localCurrencyRate) {
          localCurrencyCostsBreakdown[key] = parseFloat((value * localCurrencyRate).toFixed(2));
        }
      });
    }
    
    // Return the calculated total and breakdown with detailed unit costs and dataset info
    return {
      totalCost: parseFloat(totalCost.toFixed(2)),
      fitoutCost: scope === 'Fitout' || scope === 'Both' ? parseFloat(fitoutCost.toFixed(2)) : undefined,
      furnitureCost: scope === 'Furniture' || scope === 'Both' ? parseFloat(furnitureCost.toFixed(2)) : undefined,
      costsBreakdown,
      rawUnitCost: parseFloat(rawUnitCost.toFixed(2)),
      adjustedUnitCost: parseFloat(adjustedUnitCost.toFixed(2)),
      areaUnit: project.areaUnit,
      datasetInfo,
      localCurrencyCode,
      localCurrencyRate,
      localCurrencyTotalCost,
      localCurrencyCostsBreakdown
    };
  } catch (error) {
    console.error('Error in budget calculation:', error);
    throw error;
  }
};

// Function to estimate budget without detailed allocation
export const estimateBudget = async (
  project: Partial<Project>,
  specification: string,
  layout: string,
  scope: BudgetScope = 'Fitout'
): Promise<number> => {
  if (!project.totalArea || !project.country || !specification || !layout) {
    return 0;
  }

  let fitoutCost = 0;
  let furnitureCost = 0;

  try {
    // Calculate fitout cost if scope is 'Fitout' or 'Both'
    if (scope === 'Fitout' || scope === 'Both') {
      // Try to use actual cost data if available
      if (project.country && project.city) {
        // Fetch costs data
        const fitoutRes = await apiRequest('GET', '/api/fitout-costs', undefined);
        const fitoutCostsData = await fitoutRes.json();
        
        // Find the location data
        const fitoutLocationData = fitoutCostsData.find((item: any) => 
          item.country === project.country && item.city === project.city
        );
        
        if (fitoutLocationData) {
          // Map specification to data format
          const specLevel = specification === 'Bronze' ? 'Low' : 
                          specification === 'Silver' ? 'Medium' : 'High';
          
          // Determine area unit
          const areaUnit = project.areaUnit === 'sqm' ? 'sqm' : 'sqft';
          const layoutType = layout as string;
          
          // Get the appropriate base rate
          const fitoutBaseRate = fitoutLocationData.costs[areaUnit][layoutType][specLevel];
          
          if (fitoutBaseRate) {
            // Calculate cost - without applying location factors as they're redundant
            const rawFitoutCost = fitoutBaseRate * (project.totalArea || 0);
            
            // Apply inflation if specified
            fitoutCost = project.inflationRate 
              ? applyInflation(rawFitoutCost, project.inflationRate as number)
              : rawFitoutCost;
          }
        }
      }
    }
    
    // Calculate furniture cost if scope is 'Furniture' or 'Both'
    if (scope === 'Furniture' || scope === 'Both') {
      // Try to use actual cost data if available
      if (project.country && project.city) {
        // Fetch costs data
        const furnitureRes = await apiRequest('GET', '/api/furniture-costs', undefined);
        const furnitureCostsData = await furnitureRes.json();
        
        // Find the location data
        const furnitureLocationData = furnitureCostsData.find((item: any) => 
          item.country === project.country && item.city === project.city
        );
        
        if (furnitureLocationData) {
          // Map specification to data format
          const specLevel = specification === 'Bronze' ? 'Low' : 
                          specification === 'Silver' ? 'Medium' : 'High';
          
          // Determine area unit
          const areaUnit = project.areaUnit === 'sqm' ? 'sqm' : 'sqft';
          const layoutType = layout as string;
          
          // Get the appropriate base rate
          const furnitureBaseRate = furnitureLocationData.costs[areaUnit][layoutType][specLevel];
          
          if (furnitureBaseRate) {
            // Calculate cost - without applying location factors as they're redundant
            const rawFurnitureCost = furnitureBaseRate * (project.totalArea || 0);
            
            // Apply inflation if specified
            furnitureCost = project.inflationRate 
              ? applyInflation(rawFurnitureCost, project.inflationRate as number)
              : rawFurnitureCost;
          }
        }
      }
    }
    
    // Calculate total based on scope
    const totalCost = scope === 'Fitout' ? fitoutCost : 
                      scope === 'Furniture' ? furnitureCost : 
                      fitoutCost + furnitureCost; // For 'Both'
    
    return totalCost;
  } catch (error) {
    console.error('Error in budget estimation, using fallback method:', error);
    
    // Fallback to simplified estimation if real data isn't available
    // This provides a basic estimate without location or other adjustments
    const fallbackBaseRate = layout === 'Activity' ? 1200 : layout === 'Team' ? 1100 : 1300;
    let fallbackEstimatedCost = (project.totalArea || 0) * fallbackBaseRate;
    
    // Adjust fallback cost based on scope
    if (scope === 'Furniture') {
      fallbackEstimatedCost *= 0.4; // Furniture is typically 40% of fitout cost
    } else if (scope === 'Both') {
      fallbackEstimatedCost *= 1.4; // Both is typically 140% of fitout cost
    }
    
    // Apply inflation if specified
    return project.inflationRate 
      ? applyInflation(fallbackEstimatedCost, project.inflationRate as number)
      : fallbackEstimatedCost;
  }
};

export default {
  calculateBudget,
  estimateBudget,
  calculateSpaceAllocationCosts
};