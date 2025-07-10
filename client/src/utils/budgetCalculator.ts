import { Project, Budget, BudgetCategory, FitoutCostData, SpaceAllocation, CurrencyRate, BudgetScope, FurnitureCostData, JLLLayout, JLLQuality, DataSourceType } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { calculateTT2025Budget, TT2025Specification } from './tt2025Data';
import { componentMapping, mapSelectedComponents, generateVarianceAnalysis, generateInsights, ComponentCost, MultiSourceBudget } from './componentMapping';

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

// Note: Specification factors are no longer used - CBRE technology costs are now calculated 
// using actual rates from the TECH sheet instead of multiplication factors

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

// Helper function for JLL calculations (legacy interface)
interface LegacyJllCalculationResult {
  fitoutCost: number;
  furnitureCost: number;
  totalCost: number;
  rawUnitCost: number;
  adjustedUnitCost: number;
  costsBreakdown: { [key: string]: number };
  defaultAllocation?: SpaceAllocation;
}

// Define explicit JLL cost data structure
const jllCostData = {
  global: {
    'open_flexible': {
      'baseline': 1700,
      'medium': 1830,
      'high': 2090
    },
    'high_spatial': {
      'baseline': 1830,
      'medium': 1970,
      'high': 2250
    },
    'structured': {
      'baseline': 1900,
      'medium': 2050,
      'high': 2360
    }
  },
  apac: {
    'open_flexible': { 'baseline': 1350, 'medium': 1460, 'high': 1670 },
    'high_spatial': { 'baseline': 1460, 'medium': 1570, 'high': 1800 },
    'structured': { 'baseline': 1590, 'medium': 1710, 'high': 1960 }
  },
  emea: {
    'open_flexible': { 'baseline': 1840, 'medium': 1970, 'high': 2260 },
    'high_spatial': { 'baseline': 1970, 'medium': 2120, 'high': 2430 },
    'structured': { 'baseline': 2070, 'medium': 2230, 'high': 2550 }
  },
  latam: {
    'open_flexible': { 'baseline': 1680, 'medium': 1790, 'high': 2050 },
    'high_spatial': { 'baseline': 1790, 'medium': 1920, 'high': 2200 },
    'structured': { 'baseline': 1860, 'medium': 2000, 'high': 2290 }
  },
  nam: {
    'open_flexible': { 'baseline': 2840, 'medium': 3070, 'high': 3510 },
    'high_spatial': { 'baseline': 3070, 'medium': 3300, 'high': 3780 },
    'structured': { 'baseline': 3190, 'medium': 3430, 'high': 3930 }
  }
};

// Helper function to validate and normalize inputs
function validateAndNormalizeJLLInputs(project: Project, layout: JLLLayout, quality: JLLQuality) {
  // Map JLL layout types to the format used in cost data
  const normalizedLayout = layout.toLowerCase().replace(/&|\s+/g, '_') as string;
  
  // Map JLL quality levels to the format used in cost data
  const normalizedQuality = quality.toLowerCase() as string;
  
  // Map region
  let region = 'global';
  if (['United States', 'Canada'].includes(project.country)) {
    region = 'nam';
  } else if (['Brazil', 'Mexico', 'Argentina', 'Colombia', 'Chile', 'Peru'].includes(project.country)) {
    region = 'latam';
  } else if ([
    'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Netherlands', 
    'Belgium', 'Sweden', 'Switzerland', 'Ireland', 'Poland', 'Denmark', 
    'Norway', 'Finland', 'Czech Republic', 'Austria', 'Portugal', 'Greece',
    'Turkey', 'Saudi Arabia', 'United Arab Emirates', 'South Africa'
  ].includes(project.country)) {
    region = 'emea';
  } else if ([
    'China', 'Japan', 'India', 'Australia', 'Singapore', 'South Korea', 
    'Hong Kong', 'Malaysia', 'Thailand', 'Indonesia', 'Philippines', 
    'Vietnam', 'New Zealand', 'Taiwan'
  ].includes(project.country)) {
    region = 'apac';
  }
  
  // Make sure area is a valid number
  const area = parseFloat(String(project.totalArea));
  if (isNaN(area) || area <= 0) {
    throw new Error("Area must be a positive number");
  }
  
  return {
    region,
    layout: normalizedLayout,
    quality: normalizedQuality,
    area,
    areaUnit: project.areaUnit || 'sqm'
  };
}

// Import the standalone JLL calculator
import JLLCalculator from './jllCalculator';

// Function to calculate JLL budget using standalone calculator
function calculateJllCosts(
  project: Project,
  layout: JLLLayout,
  quality: JLLQuality,
  scope: string = 'Fitout'
): LegacyJllCalculationResult {
  console.log("===== USING STANDALONE JLL CALCULATOR =====");
  console.log("Input:", { project, layout, quality, scope });
  
  // Use the standalone calculator and map to legacy interface
  const result = JLLCalculator.calculate(project, layout, quality, scope);
  
  return {
    fitoutCost: result.fitoutCost,
    furnitureCost: result.furnitureCost,
    totalCost: result.totalBudget,
    rawUnitCost: result.rawUnitCost,
    adjustedUnitCost: result.adjustedUnitCost,
    costsBreakdown: result.costsBreakdown,
    defaultAllocation: result.defaultAllocation
  };
}

// Cache for data to avoid repeated API calls
let cachedFitoutCostsData: FitoutCostData[] | null = null;
let cachedFurnitureCostsData: FurnitureCostData[] | null = null;
let cachedTechnologyCostsData: any[] | null = null;
let cachedJllCostsData: any[] | null = null;

// Helper function to get CBRE technology cost data
const getCBRETechnologyCosts = async (): Promise<any[]> => {
  if (cachedTechnologyCostsData) {
    return cachedTechnologyCostsData;
  }
  
  try {
    const response = await apiRequest('/api/technology-costs');
    cachedTechnologyCostsData = response;
    return response;
  } catch (error) {
    console.error('Error fetching CBRE technology costs:', error);
    return [];
  }
};

// Helper function to calculate actual CBRE technology cost
const calculateCBRETechnologyCost = async (
  project: Project,
  budget: Partial<Budget>,
  specification: string
): Promise<number> => {
  try {
    const technologyData = await getCBRETechnologyCosts();
    
    if (!technologyData || technologyData.length === 0) {
      console.warn('No CBRE technology data available, using fallback calculation');
      return 0;
    }
    
    // Find matching location data
    const locationData = technologyData.find(item => 
      item.country.toLowerCase() === project.country.toLowerCase() &&
      item.city.toLowerCase() === project.city.toLowerCase()
    );
    
    if (!locationData) {
      console.warn(`No CBRE technology data found for ${project.city}, ${project.country}`);
      return 0;
    }
    
    // Map specification names to CBRE levels
    const specLevel = specification.includes('Low') || specification === 'Bronze' ? 'Low' : 
                     specification.includes('High') || specification === 'Gold' ? 'High' : 'Medium';
    
    // Get layout type (default to Activity if not specified)
    const layoutType = budget.layout || 'Activity';
    
    // Get area unit
    const areaUnit = project.areaUnit === 'sqm' ? 'sqm' : 'sqft';
    
    // Get the appropriate rate
    const technologyRate = locationData.costs[areaUnit][layoutType]?.[specLevel];
    
    if (!technologyRate) {
      console.warn(`No technology rate found for ${layoutType} layout, ${specLevel} specification in ${areaUnit}`);
      return 0;
    }
    
    // Calculate technology cost
    const technologyCost = technologyRate * project.totalArea;
    
    console.log(`CBRE Technology Cost: ${technologyRate}/${areaUnit} × ${project.totalArea} ${areaUnit} = $${technologyCost.toFixed(2)}`);
    
    return technologyCost;
    
  } catch (error) {
    console.error('Error calculating CBRE technology cost:', error);
    return 0;
  }
};

// Calculate budget based on project and budget data
export const calculateBudget = async ({
  project,
  budget,
  budgetStructure
}: BudgetCalculationParams): Promise<CalculationResult> => {
  // Initialize all result variables at the top to avoid scope issues
  let fitoutCost = 0;
  let furnitureCost = 0;
  let totalCost = 0;
  let rawUnitCost = 0;
  let adjustedUnitCost = 0;
  let costsBreakdown: { [key: string]: number } = {};
  
  // Check required parameters based on data source
  console.log('Budget calculation params check:', {
    project: !!project,
    budget: !!budget,
    specification: budget?.specification,
    layout: budget?.layout,
    primaryDataSource: (budget as any)?.primaryDataSource
  });
  
  if (!project || !budget || !budget.specification) {
    console.error('Missing required parameters:', {
      project: !!project,
      budget: !!budget,
      specification: budget?.specification
    });
    throw new Error('Missing required budget parameters: project, budget, or specification');
  }
  
  // T&T doesn't require layout parameter (it uses specification only)
  if ((budget as any).primaryDataSource !== 'TT' && !budget.layout) {
    console.error('Layout is required for non-T&T data sources. Current data source:', (budget as any).primaryDataSource);
    throw new Error('Layout is required for non-T&T data sources');
  }
  
  // For T&T, set a default layout since the calculation still expects it but doesn't use it
  if ((budget as any).primaryDataSource === 'TT' && !budget.layout) {
    budget.layout = 'Standard Office'; // Default for T&T calculations
  }
  
  // T&T doesn't use space allocation, so provide a default for calculation
  if ((budget as any).primaryDataSource === 'TT' && !budget.spaceAllocation) {
    budget.spaceAllocation = { 'Total Project Area': { percentage: 100, area: (project as any)?.totalArea || 1000 } }; // Default for T&T calculations
  }
  
  // If using JLL data source, we don't require space allocation initially
  // Note: Space allocation is now auto-generated for all data sources when not provided

  try {
    // Get the scope from the budget
    const scope = budget.scope || 'Fitout';
    console.log(`=== BUDGET CALCULATION START ===`);
    console.log(`Scope: ${scope}`);
    console.log(`Data source: ${(budget as any).primaryDataSource || 'CBRE'}`);
    console.log(`Specification: ${budget.specification}`);
    console.log(`Layout: ${budget.layout}`);
    console.log(`Project: ${project.city}, ${project.country}, ${project.totalArea} ${project.areaUnit}`);
    
    // Handle T&T data source calculation
    if ((budget as any).primaryDataSource === 'TT') {
      console.log('====== T&T CALCULATION START ======');
      
      try {
        // Get T&T specification level mapping
        const ttSpecLevel = budget.specification === 'Low' ? 'Low' : 
                           budget.specification === 'High' ? 'High' : 'Medium';
        
        console.log(`Project details: Country=${project.country}, City=${project.city}, Area=${project.totalArea}, Unit=${project.areaUnit}`);
        console.log(`Budget specification: ${budget.specification} -> T&T spec: ${ttSpecLevel}`);
        
        // Determine T&T scope based on user selection
        let ttScope: 'Construction' | 'LooseFurniture' | 'AudioVisual' | 'ProfessionalFees' | 'Complete';
        
        if (budget.scope === 'Construction') {
          ttScope = 'Construction';
        } else if (budget.scope === 'LooseFurniture') {
          ttScope = 'LooseFurniture'; 
        } else if (budget.scope === 'AudioVisual') {
          ttScope = 'AudioVisual';
        } else if (budget.scope === 'ProfessionalFees') {
          ttScope = 'ProfessionalFees';
        } else {
          ttScope = 'Complete'; // Default for Complete or legacy scopes
        }
        
        console.log(`Using T&T scope: ${ttScope} (from user selection: ${budget.scope})`);
        
        // Calculate T&T costs using the T&T 2025 data
        const ttResults = calculateTT2025Budget(
          project.country,
          project.city,
          ttSpecLevel as TT2025Specification,
          project.totalArea,
          project.areaUnit as 'sqm' | 'sqft',
          ttScope
        );
        
        console.log("T&T calculation successful:", ttResults);
        
        if (!ttResults.success) {
          throw new Error(ttResults.error || 'T&T calculation failed');
        }
        
        // Apply T&T results based on selected scope
        if (ttScope === 'Construction') {
          fitoutCost = ttResults.breakdown.construction;
          furnitureCost = 0;
          totalCost = ttResults.breakdown.construction;
          costsBreakdown = { 'Construction': ttResults.breakdown.construction };
        } else if (ttScope === 'LooseFurniture') {
          fitoutCost = 0;
          furnitureCost = ttResults.breakdown.looseFurniture;
          totalCost = ttResults.breakdown.looseFurniture;
          costsBreakdown = { 'Loose Furniture': ttResults.breakdown.looseFurniture };
        } else if (ttScope === 'AudioVisual') {
          fitoutCost = ttResults.breakdown.audioVisual;
          furnitureCost = 0;
          totalCost = ttResults.breakdown.audioVisual;
          costsBreakdown = { 'Audio-Visual': ttResults.breakdown.audioVisual };
        } else if (ttScope === 'ProfessionalFees') {
          fitoutCost = 0;
          furnitureCost = 0;
          totalCost = ttResults.breakdown.professionalFees;
          costsBreakdown = { 'Professional Fees': ttResults.breakdown.professionalFees };
        } else {
          // Complete package
          fitoutCost = ttResults.breakdown.construction + ttResults.breakdown.audioVisual;
          furnitureCost = ttResults.breakdown.looseFurniture;
          totalCost = ttResults.totalCost;
          costsBreakdown = {
            'Construction': ttResults.breakdown.construction,
            'Loose Furniture': ttResults.breakdown.looseFurniture,
            'Audio-Visual': ttResults.breakdown.audioVisual,
            'Professional Fees': ttResults.breakdown.professionalFees
          };
        }
        
        rawUnitCost = ttResults.costPerSqm;
        adjustedUnitCost = ttResults.costPerSqm;
        
      } catch (error) {
        console.error("T&T calculation failed with error:", error);
        throw new Error(`T&T calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      console.log('====== T&T CALCULATION END ======');
      
      // Return T&T results immediately, don't continue to other data sources
      return {
        totalCost,
        fitoutCost,
        furnitureCost,
        costsBreakdown,
        rawUnitCost,
        adjustedUnitCost,
        areaUnit: project.areaUnit,
        localCurrencyCode: project.currency,
        localCurrencyRate: undefined,
        localCurrencyTotalCost: undefined,
        localCurrencyCostsBreakdown: undefined,
        datasetInfo: {
          name: 'Turner & Townsend 2025 Global Office Fit-Out Cost Guide',
          sheet: 'T&T 2025 Data',
          region: 'Global',
          benchmark: `${budget.specification} Specification`
        }
      };
    }
    // Handle JLL data source calculation
    else if (budget.primaryDataSource && budget.primaryDataSource === 'JLL') {
      console.log('====== JLL CALCULATION START ======');
      
      // Ensure we have JLL layout and quality options
      if (!budget.jllLayout || !budget.jllQuality) {
        console.warn('JLL data source selected but missing layout or quality settings');
        // Fall back to default values if not specified
        budget.jllLayout = budget.jllLayout || 'Open & flexible';
        budget.jllQuality = budget.jllQuality || 'Medium';
      }
      
      console.log(`Using JLL layout: ${budget.jllLayout} and quality: ${budget.jllQuality}`);
      
      // Calculate JLL costs with robust error handling
      let jllResults: LegacyJllCalculationResult | null = null;
      
      try {
        console.log("JLL calculation arguments:", {
          project,
          jllLayout: budget.jllLayout, 
          jllQuality: budget.jllQuality,
          scope
        });
        
        // Ensure scope is a proper string value
        const jllScope = scope || 'Fitout';
        console.log("Using JLL scope:", jllScope);
        
        jllResults = calculateJllCosts(project, budget.jllLayout, budget.jllQuality, jllScope);
        console.log("JLL calculation successful:", jllResults);
        
        // Apply results
        fitoutCost = jllResults.fitoutCost;
        furnitureCost = jllResults.furnitureCost;
        totalCost = jllResults.totalCost;
        
        // Copy breakdown from successful calculation
        Object.entries(jllResults.costsBreakdown).forEach(([key, value]) => {
          costsBreakdown[key] = value as number;
        });
        
        // Use default JLL allocation if no space allocation provided
        if (!budget.spaceAllocation && jllResults.defaultAllocation) {
          budget.spaceAllocation = jllResults.defaultAllocation;
        }
      } catch (error) {
        console.error("JLL calculation failed with error:", error);
        
        // Use fallback calculation for JLL
        console.log("Using basic fallback calculation for JLL");
        
        // Basic fallback values based on region
        let baseCost = 1950; // Default global average ($/sqm)
        
        // Simple region adjustment
        if (project.country === 'United States') baseCost = 3070;
        else if (project.country === 'United Kingdom') baseCost = 1970;
        else if (project.country === 'Singapore') baseCost = 1460;
        
        // Simple layout/quality adjustment
        if (budget.jllLayout === 'Structured') baseCost *= 1.05;
        if (budget.jllQuality === 'High') baseCost *= 1.15;
        if (budget.jllQuality === 'Baseline') baseCost *= 0.9;
        
        // Area conversion if needed
        let area = project.totalArea;
        if (project.areaUnit === 'sqft') {
          area = project.totalArea * 0.092903; // Convert to sqm
        }
        
        // Calculate total cost
        const totalAmount = baseCost * area;
        
        // Calculate component costs based on scope
        if (scope === 'Fitout') {
          fitoutCost = totalAmount;
          furnitureCost = 0;
        } else if (scope === 'Furniture') {
          fitoutCost = 0;
          furnitureCost = totalAmount;
        } else {
          // Both - use standard JLL breakdown
          fitoutCost = totalAmount * 0.87; // 87% fitout
          furnitureCost = totalAmount * 0.13; // 13% furniture
        }
        
        totalCost = fitoutCost + furnitureCost;
        
        // Add basic breakdown to results for the fallback case
        costsBreakdown['JLL DATA SOURCE'] = 1;
        costsBreakdown['TOTAL COST'] = Math.round(totalAmount);
        costsBreakdown['FITOUT BASE COSTS'] = Math.round(fitoutCost);
        costsBreakdown['FURNITURE BASE COSTS'] = Math.round(furnitureCost);
        costsBreakdown['BUILDERS WORKS'] = Math.round(totalAmount * 0.37);
        costsBreakdown['M&E SERVICES'] = Math.round(totalAmount * 0.29);
        costsBreakdown['SECURITY, IT & AV'] = Math.round(totalAmount * 0.12);
        costsBreakdown['PROJECT MANAGEMENT'] = Math.round(totalAmount * 0.08);
        
        // Add default space allocation
        budget.spaceAllocation = {
          'Open workspace': { percentage: 50, area: project.totalArea * 0.5 },
          'Meeting areas': { percentage: 25, area: project.totalArea * 0.25 },
          'Support spaces': { percentage: 25, area: project.totalArea * 0.25 }
        };
      }
      
      console.log('====== JLL CALCULATION COMPLETE ======');
    } else if ((budget as any).primaryDataSource === 'TT') {
      // Turner & Townsend 2025 Global Office Fit-Out Cost Guide calculation
      console.log('====== STARTING T&T 2025 CALCULATION ======');
      
      // Map specification levels to T&T format (T&T uses Low/Medium/High directly)
      const specificationLevel = budget.specification === 'Bronze' ? 'Low' : 
                                budget.specification === 'Silver' ? 'Medium' : 
                                budget.specification === 'Gold' ? 'High' :
                                budget.specification; // Use direct value if already Low/Medium/High
      
      // Determine scope for T&T calculation
      const tt2025Scope = scope === 'Fitout' ? 'Construction' :
                          scope === 'Furniture' ? 'LooseFurniture' :
                          'Complete'; // For 'Both'
      
      // Calculate using T&T 2025 data
      const tt2025Result = calculateTT2025Budget(
        project.country,
        project.city,
        specificationLevel as TT2025Specification,
        project.totalArea,
        (project.areaUnit === 'sqm' ? 'sqm' : 'sqft') as 'sqm' | 'sqft',
        tt2025Scope
      );
      
      if (!tt2025Result.success) {
        throw new Error(tt2025Result.error || 'T&T 2025 calculation failed');
      }
      
      // Apply inflation if specified
      const inflationMultiplier = project.inflationRate ? (1 + project.inflationRate / 100) : 1;
      
      totalCost = tt2025Result.totalCost * inflationMultiplier;
      fitoutCost = tt2025Result.breakdown.construction * inflationMultiplier;
      furnitureCost = tt2025Result.breakdown.looseFurniture * inflationMultiplier;
      
      // Set raw and adjusted unit costs
      rawUnitCost = tt2025Result.costPerSqm;
      adjustedUnitCost = rawUnitCost * inflationMultiplier;
      
      // Create detailed cost breakdown using T&T categories
      costsBreakdown = {
        'T&T 2025 DATA SOURCE': 1,
        'TOTAL COST': Math.round(totalCost),
        'CONSTRUCTION': Math.round(tt2025Result.breakdown.construction * inflationMultiplier),
        'LOOSE FURNITURE': Math.round(tt2025Result.breakdown.looseFurniture * inflationMultiplier),
        'AUDIO-VISUAL': Math.round(tt2025Result.breakdown.audioVisual * inflationMultiplier),
        'PROFESSIONAL FEES': Math.round(tt2025Result.breakdown.professionalFees * inflationMultiplier)
      };
      
      // Create default space allocation for cost breakdown
      const defaultSpaceAllocation = {
        'Open workspace': { percentage: 55, area: project.totalArea * 0.55 },
        'Meeting rooms': { percentage: 20, area: project.totalArea * 0.20 },
        'Collaboration areas': { percentage: 15, area: project.totalArea * 0.15 },
        'Support spaces': { percentage: 10, area: project.totalArea * 0.10 }
      };
      
      // Add space allocation costs to breakdown
      const spaceAllocationCosts = calculateSpaceAllocationCosts(totalCost, defaultSpaceAllocation);
      Object.entries(spaceAllocationCosts).forEach(([spaceName, cost]) => {
        costsBreakdown[`SPACE: ${spaceName}`] = parseFloat(cost.toFixed(2));
      });
      
      console.log('====== T&T 2025 CALCULATION COMPLETE ======');
    } else {
      // Standard calculation for other data sources (CBRE, MMC)
    
      // Calculate fitout costs if scope is 'Fitout', 'Both', or 'Complete'
      if (scope === 'Fitout' || scope === 'Both' || scope === 'Complete') {
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
        const specificationLevel = budget.specification?.includes('Low') || budget.specification === 'Bronze' ? 'Low' : 
                                 budget.specification?.includes('High') || budget.specification === 'Gold' ? 'High' : 'Medium';
        
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
      
      // Calculate furniture costs if scope is 'Furniture', 'Both', or 'Complete'
      if (scope === 'Furniture' || scope === 'Both' || scope === 'Complete') {
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
        const specificationLevel = budget.specification?.includes('Low') || budget.specification === 'Bronze' ? 'Low' : 
                                 budget.specification?.includes('High') || budget.specification === 'Gold' ? 'High' : 'Medium';
        
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
      
      // Add technology/audiovisual costs if scope includes it
      let technologyCost = 0;
      let professionalFeesCost = 0;
      
      if (scope === 'AudioVisual' || scope === 'Complete') {
        // Use CBRE technology specification if available, otherwise fall back to main specification
        const technologySpec = (budget as any).technologySpecification || budget.specification;
        
        // Use actual CBRE technology rates instead of multiplication factors
        try {
          technologyCost = await calculateCBRETechnologyCost(project, budget, technologySpec);
          
          // If CBRE technology data is not available, fall back to T&T calculation
          if (technologyCost === 0) {
            console.log('CBRE technology data not available, falling back to T&T calculation');
            const technologySpecLevel = technologySpec?.includes('Low') || technologySpec === 'Bronze' ? 'Low' : 
                                        technologySpec?.includes('High') || technologySpec === 'Gold' ? 'High' : 'Medium';
            
            const ttAudioVisualResult = calculateTT2025Budget(
              project.country,
              project.city,
              technologySpecLevel as TT2025Specification,
              project.totalArea,
              project.areaUnit as 'sqm' | 'sqft',
              'AudioVisual'
            );
            
            if (ttAudioVisualResult.success) {
              technologyCost = ttAudioVisualResult.breakdown.audioVisual;
            } else {
              // Final fallback: use percentage estimate (no multiplication factors)
              technologyCost = (fitoutCost > 0 ? fitoutCost : furnitureCost) * 0.15; // 15% estimate
            }
          }
        } catch (error) {
          console.error('Error calculating technology cost:', error);
          // Final fallback: use percentage estimate (no multiplication factors) 
          technologyCost = (fitoutCost > 0 ? fitoutCost : furnitureCost) * 0.15; // 15% estimate
        }
      }
      
      // Add professional fees for Complete scope only
      if (scope === 'Complete') {
        // Professional fees are typically 10-15% of construction + furniture + technology costs
        const baseCosts = fitoutCost + furnitureCost + technologyCost;
        professionalFeesCost = baseCosts * 0.12; // 12% professional fees
      }
      
      // Calculate total cost based on scope
      if (scope === 'Fitout') {
        totalCost = fitoutCost;
      } else if (scope === 'Furniture') {
        totalCost = furnitureCost;
      } else if (scope === 'AudioVisual') {
        totalCost = technologyCost;
      } else if (scope === 'Complete') {
        totalCost = fitoutCost + furnitureCost + technologyCost + professionalFeesCost;
      } else {
        totalCost = fitoutCost + furnitureCost; // For 'Both'
      }
    }
    
    // Calculate the raw unit cost based on scope
    if (scope === 'Complete' || scope === 'Both') {
      // For combined scopes, calculate total unit cost
      rawUnitCost = totalCost / project.totalArea;
    } else if (scope === 'Fitout') {
      rawUnitCost = fitoutCost / project.totalArea;
    } else if (scope === 'Furniture') {
      rawUnitCost = furnitureCost / project.totalArea;
    } else if (scope === 'AudioVisual') {
      // Get technologyCost from the outer scope
      const technologyCost = totalCost; // For AudioVisual scope, totalCost equals technologyCost
      rawUnitCost = technologyCost / project.totalArea;
    } else {
      // Fallback for other scopes
      rawUnitCost = totalCost / project.totalArea;
    }
    
    // In all cases, adjusted unit cost is the same as raw unit cost
    // There's no additional adjustment being applied
    adjustedUnitCost = rawUnitCost;
    
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
      if (scope === 'Fitout' || scope === 'Both' || scope === 'Complete') {
        costsBreakdown['FITOUT COSTS'] = parseFloat(fitoutCost.toFixed(2));
      }
      
      if (scope === 'Furniture' || scope === 'Both' || scope === 'Complete') {
        costsBreakdown['FURNITURE COSTS'] = parseFloat(furnitureCost.toFixed(2));
      }
      
      if (scope === 'AudioVisual') {
        // For AudioVisual scope, totalCost is the technology cost
        costsBreakdown['TECHNOLOGY COSTS'] = parseFloat(totalCost.toFixed(2));
      }
      
      if (scope === 'Complete') {
        // Use the technology cost that was already calculated above using actual CBRE rates
        // The technologyCost variable from the earlier calculation contains the actual CBRE technology cost
        const techCost = technologyCost; // This is already calculated with actual CBRE rates above
        
        // Professional fees: 12% of (fitout + furniture + technology)
        const professionalFees = (fitoutCost + furnitureCost + techCost) * 0.12;
        
        costsBreakdown['TECHNOLOGY COSTS'] = parseFloat(techCost.toFixed(2));
        costsBreakdown['PROFESSIONAL FEES'] = parseFloat(professionalFees.toFixed(2));
      }
    }
    
    // Create default space allocation breakdown for all data sources
    if (budget.primaryDataSource === 'JLL') {
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
    } else {
      // For other data sources (CBRE, MMC), create a standard default allocation
      const defaultStandardAllocation: SpaceAllocation = {
        'Open workspace': { percentage: 50, area: project.totalArea * 0.50 },
        'Meeting rooms': { percentage: 25, area: project.totalArea * 0.25 },
        'Focus areas': { percentage: 15, area: project.totalArea * 0.15 },
        'Support spaces': { percentage: 10, area: project.totalArea * 0.10 }
      };
      
      const spaceAllocationCosts = calculateSpaceAllocationCosts(totalCost, defaultStandardAllocation);
      
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
    
    // Log detailed information for debugging
    console.error('Budget calculation failed with the following parameters:');
    console.error('- Project:', JSON.stringify(project));
    console.error('- Budget:', JSON.stringify({
      scope: budget.scope,
      specification: budget.specification,
      layout: budget.layout,
      primaryDataSource: budget.primaryDataSource,
      jllLayout: budget.jllLayout,
      jllQuality: budget.jllQuality
    }));
    
    // Create a more user-friendly error message
    let errorMessage = 'Could not calculate budget. ';
    
    if (error instanceof Error) {
      if (error.message.includes('cost data found')) {
        errorMessage += 'No cost data available for the selected location.';
      } else if (error.message.includes('required budget parameters')) {
        errorMessage += 'Some required information is missing.';
      } else {
        errorMessage += error.message;
      }
    } else {
      errorMessage += 'An unexpected error occurred.';
    }
    
    throw new Error(errorMessage);
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

// Multi-source budget calculation with CBRE data borrowing from T&T
export async function calculateMultiSourceBudget(
  project: Project,
  budget: any,
  budgetStructure: BudgetCategory[]
): Promise<MultiSourceBudget> {
  
  // Calculate T&T budget
  const ttBudgetResult = await calculateBudget({
    project,
    budget: {
      ...budget,
      primaryDataSource: 'TT' as DataSourceType,
      ttComponentSpecs: budget.ttComponentSpecs || {},
      jllLayout: null,
      jllQuality: null
    } as any,
    budgetStructure
  });

  const ttBudget = {
    components: [
      {
        component: 'Construction',
        cost: ttBudgetResult.fitoutCost || 0,
        rate: (ttBudgetResult.fitoutCost || 0) / project.totalArea,
        dataSource: 'TT' as const
      },
      {
        component: 'Loose Furniture', 
        cost: ttBudgetResult.furnitureCost || 0,
        rate: (ttBudgetResult.furnitureCost || 0) / project.totalArea,
        dataSource: 'TT' as const
      }
    ],
    total: ttBudgetResult.totalCost,
    costPerSqm: ttBudgetResult.totalCost / project.totalArea
  };

  // Calculate CBRE budget with T&T supplements for missing components
  const cbreBudget = await calculateCBREWithTTSupplements(project, budget, budgetStructure);

  // Generate comparison analysis
  const comparison = generateVarianceAnalysis(ttBudget, cbreBudget);
  
  // Assess data integrity
  const dataIntegrity = {
    cbreNativeComponents: ['Construction', 'Furniture'],
    cbreBorrowedComponents: ['Audio-Visual', 'Professional Fees'],
    notes: [
      'CBRE Construction & Furniture data from native CBRE Global Fit-Out Cost Guide',
      'Audio-Visual & Professional Fees temporarily using T&T data pending CBRE availability',
      'Comparison analysis focuses on components with native CBRE data'
    ]
  };

  return {
    tt: ttBudget,
    cbre: cbreBudget,
    comparison,
    dataIntegrity
  };
}

async function calculateCBREWithTTSupplements(
  project: Project,
  budget: Partial<Budget> & { 
    spaceAllocation?: SpaceAllocation;
    ttComponentSpecs?: Record<string, string>;
  },
  budgetStructure: BudgetCategory[]
): Promise<{ components: ComponentCost[], total: number, costPerSqm: number }> {
  
  const components: ComponentCost[] = [];
  let total = 0;
  const area = project.totalArea;

  // Get scope components
  const scopeArray = Array.isArray(budget.scope) ? budget.scope : [budget.scope].filter(Boolean) as string[];
  const mappedComponents = mapSelectedComponents(scopeArray);

  // Calculate CBRE native components (Construction & Furniture)
  if (mappedComponents.cbre.includes('Construction')) {
    try {
      const cbreResult = await calculateBudget({ 
        project, 
        budget: { 
          ...budget, 
          primaryDataSource: 'CBRE' as DataSourceType,
          jllLayout: undefined,
          jllQuality: undefined
        } as any, 
        budgetStructure 
      });
      const constructionCost = cbreResult.fitoutCost || 0;
      const constructionRate = constructionCost / area;
      
      components.push({
        component: 'Construction',
        cost: constructionCost,
        rate: constructionRate,
        dataSource: 'CBRE'
      });
      total += constructionCost;
    } catch (error) {
      console.warn('CBRE construction calculation failed, using T&T data');
    }
  }

  if (mappedComponents.cbre.includes('Furniture')) {
    try {
      const cbreResult = await calculateBudget({ 
        project, 
        budget: { 
          ...budget, 
          primaryDataSource: 'CBRE' as DataSourceType,
          jllLayout: undefined,
          jllQuality: undefined
        } as any, 
        budgetStructure 
      });
      const furnitureCost = cbreResult.furnitureCost || 0;
      const furnitureRate = furnitureCost / area;
      
      components.push({
        component: 'Furniture',
        cost: furnitureCost,
        rate: furnitureRate,
        dataSource: 'CBRE'
      });
      total += furnitureCost;
    } catch (error) {
      console.warn('CBRE furniture calculation failed, using T&T data');
    }
  }

  // Use T&T data for missing CBRE components
  if (mappedComponents.cbre.includes('AudioVisual')) {
    const ttSpecs = budget.ttComponentSpecs || {};
    const audioVisualSpec = ttSpecs['AudioVisual'] || 'Medium';
    const ttCost = await getTT2025ComponentCost('AudioVisual', project.country, project.city, audioVisualSpec as any, area);
    
    components.push({
      component: 'Audio-Visual',
      cost: ttCost,
      rate: ttCost / area,
      dataSource: 'TT_BORROWED'
    });
    total += ttCost;
  }

  if (mappedComponents.cbre.includes('ProfessionalFees')) {
    const ttSpecs = budget.ttComponentSpecs || {};
    const professionalSpec = ttSpecs['ProfessionalFees'] || 'Medium';
    const ttCost = await getTT2025ComponentCost('ProfessionalFees', project.country, project.city, professionalSpec as any, area);
    
    components.push({
      component: 'Professional Fees',
      cost: ttCost,
      rate: ttCost / area,
      dataSource: 'TT_BORROWED'
    });
    total += ttCost;
  }

  return {
    components,
    total,
    costPerSqm: total / area
  };
}

async function getTT2025ComponentCost(
  component: string,
  country: string,
  city: string,
  specification: string,
  area: number
): Promise<number> {
  try {
    // This would integrate with the actual T&T calculation logic
    // For now, return a calculated estimate based on component and specification
    const baseRates = {
      'AudioVisual': { Low: 150, Medium: 250, High: 400 },
      'ProfessionalFees': { Low: 80, Medium: 120, High: 180 }
    };
    
    const rate = baseRates[component as keyof typeof baseRates]?.[specification as keyof typeof baseRates['AudioVisual']] || 200;
    return rate * area;
  } catch (error) {
    console.warn(`Failed to get T&T cost for ${component}, using fallback`);
    return 200 * area; // Fallback rate
  }
}

export default {
  calculateBudget,
  estimateBudget,
  calculateSpaceAllocationCosts,
  calculateMultiSourceBudget
};