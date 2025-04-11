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
  localCurrencyCode?: string;
  localCurrencyRate?: number;
  localCurrencyTotalCost?: number;
  localCurrencyCostsBreakdown?: { [key: string]: number };
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

// Cache for currency rates data
let cachedCurrencyRates: CurrencyRate[] | null = null;

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

    // Determine region for location factor
    let region: keyof typeof locationData.locationFactors = 'EMEA';
    if (locationData.region === 'AMERICA') {
      region = 'AMERICA';
    } else if (locationData.region === 'APAC') {
      region = 'APAC';
    }

    // Apply location factor
    const locationFactor = locationData.locationFactors[region] || 1.0;
    
    // Get specification factor
    const specificationFactor = getSpecificationFactor(budget.specification);
    
    // Calculate adjusted base cost per unit area
    const adjustedBaseRate = baseRate * locationFactor * specificationFactor;
    
    // Calculate total area cost
    const totalAreaCost = adjustedBaseRate * project.totalArea;
    
    // Apply inflation if specified
    const inflatedTotalCost = project.inflationRate 
      ? applyInflation(totalAreaCost, project.inflationRate)
      : totalAreaCost;

    // Initialize costs breakdown for fitout only
    const costsBreakdown: { [key: string]: number } = {};
    
    // Since we're only using fitout data, we'll use a single category
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
    let localCurrencyCode = budget.localCurrencyCode || project.currency;
    let localCurrencyRate: number | undefined;
    let localCurrencyTotalCost: number | undefined;
    let localCurrencyCostsBreakdown: { [key: string]: number } | undefined;
    
    console.log("Budget Calculator - Looking for currency:", localCurrencyCode);
    console.log("Project country:", project.country);
    
    if (localCurrencyCode && localCurrencyCode !== 'USD') {
      try {
        // Fetch currency rates if not already cached
        if (!cachedCurrencyRates) {
          console.log("Fetching currency rates from API");
          const ratesRes = await apiRequest('GET', '/api/currency-rates', undefined);
          const ratesData = await ratesRes.json();
          cachedCurrencyRates = ratesData;
          console.log("Cache updated with currency rates:", cachedCurrencyRates.length);
        }
        
        // Find the exchange rate for the selected currency
        const currencyData = cachedCurrencyRates?.find(rate => 
          rate.currencyCode === localCurrencyCode
        );
        
        console.log("Currency data found:", currencyData);
        
        if (currencyData) {
          localCurrencyRate = parseFloat(currencyData.exchangeRate.toString());
          console.log("Applied exchange rate:", localCurrencyRate);
          
          // Convert USD to local currency
          if (localCurrencyRate > 0) {
            localCurrencyTotalCost = parseFloat((inflatedTotalCost * localCurrencyRate).toFixed(2));
            console.log("Local currency total:", localCurrencyTotalCost);
            
            // Convert cost breakdown to local currency
            localCurrencyCostsBreakdown = {};
            Object.entries(costsBreakdown).forEach(([key, value]) => {
              localCurrencyCostsBreakdown![key] = parseFloat((value * localCurrencyRate!).toFixed(2));
            });
          }
        }
      } catch (error) {
        console.error('Error getting currency conversion:', error);
        // Continue without local currency if there's an error
      }
    }
    
    // Return the calculated total and breakdown
    return {
      totalCost: parseFloat(inflatedTotalCost.toFixed(2)),
      costsBreakdown,
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
export const estimateBudget = (
  project: Partial<Project>,
  specification: string,
  layout: string
): number => {
  if (!project.totalArea || !project.country || !specification || !layout) {
    return 0;
  }

  // Simplified estimation based on area and specification
  const baseRate = layout === 'Activity' ? 1200 : layout === 'Team' ? 1100 : 1300;
  const specFactor = specification === 'Bronze' ? 1.0 : specification === 'Silver' ? 1.4 : 1.8;
  
  // Apply a generic location factor (simplified)
  const locationFactor = project.country === 'United Kingdom' ? 1.2 :
                        project.country === 'United States' ? 1.3 :
                        project.country === 'Australia' ? 1.1 : 1.0;
  
  // Calculate estimated cost
  const estimatedCost = project.totalArea * baseRate * specFactor * locationFactor;
  
  // Apply inflation if specified
  return project.inflationRate 
    ? applyInflation(estimatedCost, project.inflationRate)
    : estimatedCost;
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
