import { Project, Budget, BudgetCategory, FitoutCostData, SpaceAllocation, CurrencyRate } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface BudgetCalculationParams {
  project: Project;
  budget: Partial<Budget> & { spaceAllocation?: SpaceAllocation };
  budgetStructure: BudgetCategory[];
}

interface CalculationResult {
  totalCost: number;
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

// Cache for fitout costs data to avoid repeated API calls
let cachedFitoutCostsData: FitoutCostData[] | null = null;

// We don't need currency rates cache as we use direct endpoint
// let cachedCurrencyRates: CurrencyRate[] | null = null;

// Calculate budget based on project and budget data
export const calculateBudget = async ({
  project,
  budget,
  budgetStructure
}: BudgetCalculationParams): Promise<CalculationResult> => {
  if (!project || !budget || !budget.specification || !budget.layout || !budget.spaceAllocation) {
    throw new Error('Missing required budget parameters');
  }

  try {
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
    const locationData = fitoutCostsData.find(item => 
      item.country === project.country && item.city === project.city
    );

    if (!locationData) {
      throw new Error(`No cost data found for ${project.city}, ${project.country}`);
    }

    // Get base costs based on layout type and specification level
    const specificationLevel = budget.specification === 'Bronze' ? 'Low' : 
                             budget.specification === 'Silver' ? 'Medium' : 'High';
    
    const areaUnit = project.areaUnit === 'sqm' ? 'sqm' : 'sqft';
    const layoutType = budget.layout as keyof typeof locationData.costs[typeof areaUnit];
    
    // Get base rate per unit area
    const baseRate = locationData.costs[areaUnit][layoutType][specificationLevel];
    if (!baseRate) {
      throw new Error(`No base rate found for ${budget.layout} layout with ${budget.specification} specification`);
    }

    // REMOVED: Previously we were applying a location factor here, but the CBRE data 
    // already contains location-specific costs, so applying location factors is redundant
    
    // Get specification factor if we need to adjust for custom specifications
    // NOTE: This might also be redundant if CBRE data already specifies Low/Medium/High costs
    // that correspond to our Bronze/Silver/Gold specifications
    const specificationFactor = 1.0; // Removed specification factor application
    
    // Use the base rate directly from the location-specific CBRE data
    // without applying duplicate location factors
    const adjustedBaseRate = baseRate;
    
    // Calculate total area cost
    const totalAreaCost = adjustedBaseRate * project.totalArea;
    
    // Store the raw unit cost from dataset and adjusted unit cost for reference
    const rawUnitCost = baseRate;
    const adjustedUnitCost = adjustedBaseRate;
    
    // Apply inflation if specified
    const inflatedTotalCost = project.inflationRate 
      ? applyInflation(totalAreaCost, project.inflationRate)
      : totalAreaCost;

    // Initialize costs breakdown for fitout only
    const costsBreakdown: { [key: string]: number } = {};
    
    // Only use a single category - FITOUT COSTS
    // Note: We're ignoring professional fees entirely now as per requirement
    costsBreakdown['FITOUT COSTS'] = parseFloat(inflatedTotalCost.toFixed(2));
    
    // We can add space allocation breakdown for reference
    if (budget.spaceAllocation) {
      const spaceAllocationCosts = calculateSpaceAllocationCosts(inflatedTotalCost, budget.spaceAllocation);
      
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
    // The correct approach: currency rates from Budget Template's "2025 FX Rates" sheet
    // Note: The values in the 2025 FX rates show rates in the direction of "USD to Local Currency"
    // For EUR = 0.95 (meaning 1 USD = 0.95 EUR)
    // For GBP = 0.79 (meaning 1 USD = 0.79 GBP)
    
    // But: The client wanted the 2nd Pass Budget Rate (Column K) which is "1/FX Rate"
    // This means we see EUR = 1.05 (which is 1/0.95)
    // GBP = 1.27 (which is 1/0.79)
    
    if (localCurrencyCode) {
      try {
        console.log(`Looking up rate for ${localCurrencyCode}`);
        // Get rate directly from API by currency code
        const rateRes = await apiRequest('GET', `/api/currency-rates/${localCurrencyCode}`, undefined);
        const rateData = await rateRes.json();
        
        if (rateData && rateData.rate) {
          localCurrencyRate = parseFloat(rateData.rate.toString());
          
          console.log(`Currency rate for ${localCurrencyCode}: ${localCurrencyRate}`);
          
          // Convert USD to local currency using the exchange rate
          // Note: Rate is formatted as USD to Local, so we multiply
          localCurrencyTotalCost = parseFloat((inflatedTotalCost * localCurrencyRate).toFixed(2));
          
          // Convert cost breakdown to local currency
          localCurrencyCostsBreakdown = {};
          Object.entries(costsBreakdown).forEach(([key, value]) => {
            localCurrencyCostsBreakdown![key] = parseFloat((value * localCurrencyRate!).toFixed(2));
          });
          
          console.log(`Converted ${inflatedTotalCost} USD to ${localCurrencyTotalCost} ${localCurrencyCode}`);
        } else {
          console.log(`No rate found for ${localCurrencyCode}`);
        }
      } catch (error) {
        console.error(`Error getting currency rate for ${localCurrencyCode}:`, error);
      }
    }
    // Only use the direct endpoint - previous code removed
    
    // Log currency information before returning
    console.log("Budget calculation results:", {
      totalCost: parseFloat(inflatedTotalCost.toFixed(2)),
      localCurrencyCode,
      localCurrencyRate,
      localCurrencyTotalCost
    });
    
    // Determine the sheet name used based on the layout and area unit
    const sheetName = `Table ${budget.layout === 'Activity' ? '1' : budget.layout === 'Team' ? '2' : '3'}_${budget.layout} BYOB ${areaUnit === 'sqm' ? 'Sqm' : 'SqFt'}`;
    
    // Create dataset information for revalidation and transparency
    const datasetInfo = {
      name: 'CBRE Fit Out Guide Cost Data_Fitout Only.xlsx', // Hardcoded as this is the required dataset
      sheet: sheetName,
      region: locationData.region,
      benchmark: `${project.country}/${project.city}`
    };
    
    // Return the calculated total and breakdown with detailed unit costs and dataset info
    return {
      totalCost: parseFloat(inflatedTotalCost.toFixed(2)),
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
  layout: string
): Promise<number> => {
  if (!project.totalArea || !project.country || !specification || !layout) {
    return 0;
  }

  try {
    // Try to use actual cost data if available
    if (project.country && project.city) {
      // Fetch costs data
      const res = await apiRequest('GET', '/api/fitout-costs', undefined);
      const fitoutCostsData = await res.json();
      
      // Find the location data
      const locationData = fitoutCostsData.find((item: any) => 
        item.country === project.country && item.city === project.city
      );
      
      if (locationData) {
        // Map specification to data format
        const specLevel = specification === 'Bronze' ? 'Low' : 
                        specification === 'Silver' ? 'Medium' : 'High';
        
        // Determine area unit
        const areaUnit = project.areaUnit === 'sqm' ? 'sqm' : 'sqft';
        const layoutType = layout as string;
        
        // Get the appropriate base rate
        const baseRate = locationData.costs[areaUnit][layoutType][specLevel];
        
        if (baseRate) {
          // Calculate cost - without applying location factors as they're redundant
          const totalCost = baseRate * (project.totalArea || 0);
          
          // Apply inflation if specified
          return project.inflationRate 
            ? applyInflation(totalCost, project.inflationRate as number)
            : totalCost;
        }
      }
    }
  } catch (error) {
    console.error('Error in budget estimation, using fallback method:', error);
  }
  
  // Fallback to simplified estimation if real data isn't available
  // This provides a basic estimate without location or other adjustments
  const fallbackBaseRate = layout === 'Activity' ? 1200 : layout === 'Team' ? 1100 : 1300;
  const fallbackEstimatedCost = (project.totalArea || 0) * fallbackBaseRate;
  
  // Apply inflation if specified
  return project.inflationRate 
    ? applyInflation(fallbackEstimatedCost, project.inflationRate as number)
    : fallbackEstimatedCost;
};

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

export default {
  calculateBudget,
  estimateBudget,
  calculateSpaceAllocationCosts
};
