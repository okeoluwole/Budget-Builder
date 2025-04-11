import { Project, Budget, BudgetCategory, FitoutCostData, SpaceAllocation } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface BudgetCalculationParams {
  project: Project;
  budget: Partial<Budget> & { spaceAllocation?: SpaceAllocation };
  budgetStructure: BudgetCategory[];
}

interface CalculationResult {
  totalCost: number;
  costsBreakdown: { [key: string]: number };
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
    // Fetch fitout cost data
    const res = await apiRequest('GET', '/api/fitout-costs', undefined);
    const fitoutCostsData: FitoutCostData[] = await res.json();

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

    // Initialize costs breakdown based on budget structure
    const costsBreakdown: { [key: string]: number } = {};
    
    // Apply cost distribution based on budget structure
    let remainingCost = inflatedTotalCost;
    let allocatedCost = 0;
    
    // Predefined distribution percentages (would come from a real database)
    const distributionPercentages: { [key: string]: number } = {
      'CONSTRUCTION COSTS': 0.55,
      'MECHANICAL & ELECTRICAL': 0.25,
      'FURNITURE & EQUIPMENT': 0.12,
      'TECHNOLOGY': 0.05,
      'PROFESSIONAL FEES': 0.02,
      'CONTINGENCY & INFLATION': 0.01
    };

    // Distribute costs based on budget structure categories
    budgetStructure.forEach(category => {
      const categoryName = category.name;
      let categoryPercentage = distributionPercentages[categoryName] || 0;
      
      // Adjust percentage based on specification level
      if (budget.specification === 'Silver') {
        if (categoryName === 'FURNITURE & EQUIPMENT' || categoryName === 'TECHNOLOGY') {
          categoryPercentage *= 1.2; // Higher quality furniture and tech for Silver
        }
      } else if (budget.specification === 'Gold') {
        if (categoryName === 'FURNITURE & EQUIPMENT' || categoryName === 'TECHNOLOGY') {
          categoryPercentage *= 1.5; // Premium furniture and tech for Gold
        }
      }
      
      // Calculate cost for this category
      const categoryCost = inflatedTotalCost * categoryPercentage;
      costsBreakdown[categoryName] = parseFloat(categoryCost.toFixed(2));
      allocatedCost += categoryCost;

      // Distribute to subcategories for more detailed breakdown
      if (category.subcategories && category.subcategories.length > 0) {
        const subCategoryCount = category.subcategories.length;
        const subCategoryBaseCost = categoryCost / subCategoryCount;
        
        category.subcategories.forEach(subcategory => {
          // Skip adding subcategories to keep the breakdown cleaner for the UI
          // In a full implementation, you would add these for detailed reports
        });
      }
    });

    // Check if we've allocated all costs
    if (allocatedCost < inflatedTotalCost) {
      const remainder = inflatedTotalCost - allocatedCost;
      costsBreakdown['OTHER COSTS'] = parseFloat(remainder.toFixed(2));
    }

    // Return the calculated totals and breakdown
    return {
      totalCost: parseFloat(inflatedTotalCost.toFixed(2)),
      costsBreakdown
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
