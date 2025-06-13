// Standalone JLL Calculator Module
// This is a completely self-contained calculator for JLL data that doesn't depend
// on any external structures or assumptions

import { Project } from '@shared/schema';

export interface JLLOptions {
  layoutType?: 'open_flexible' | 'high_spatial' | 'structured';
  qualityLevel?: 'baseline' | 'medium' | 'high';
  scope?: 'Fitout' | 'Furniture' | 'Both';
}

export interface JLLCalculationResult {
  success: boolean;
  totalBudget: number;
  fitoutCost: number;
  furnitureCost: number;
  baseCost: number;
  adjustedRate: number;
  areaInSqm: number;
  breakdown: {
    buildersWorks: number;
    meServices: number;
    furniture: number;
    technology: number;
    professionalServices: number;
  };
  // For UI display
  defaultAllocation: {
    [spaceType: string]: {
      percentage: number;
      area: number;
    };
  };
  // For compatibility with existing codebase
  rawUnitCost: number;
  adjustedUnitCost: number;
  costsBreakdown: {
    [key: string]: number;
  };
  error?: string;
}

// JLL Calculator with hardcoded data
const JLLCalculator = {
  // JLL cost data from the 2025 guide
  costData: {
    global: {
      open_flexible: {
        baseline: 1700,
        medium: 1830,
        high: 2090
      },
      high_spatial: {
        baseline: 1830,
        medium: 1970,
        high: 2250
      },
      structured: {
        baseline: 1900,
        medium: 2050,
        high: 2360
      }
    },
    // Regional data
    apac: {
      open_flexible: { baseline: 1350, medium: 1460, high: 1670 },
      high_spatial: { baseline: 1460, medium: 1570, high: 1800 },
      structured: { baseline: 1590, medium: 1710, high: 1960 }
    },
    emea: {
      open_flexible: { baseline: 1840, medium: 1970, high: 2260 },
      high_spatial: { baseline: 1970, medium: 2120, high: 2430 },
      structured: { baseline: 2070, medium: 2230, high: 2550 }
    },
    latam: {
      open_flexible: { baseline: 1680, medium: 1790, high: 2050 },
      high_spatial: { baseline: 1790, medium: 1920, high: 2200 },
      structured: { baseline: 1860, medium: 2000, high: 2290 }
    },
    nam: {
      open_flexible: { baseline: 2840, medium: 3070, high: 3510 },
      high_spatial: { baseline: 3070, medium: 3300, high: 3780 },
      structured: { baseline: 3190, medium: 3430, high: 3930 }
    }
  },
  
  // Region mapping from country to JLL region
  determineRegion: function(country: string): string {
    if (!country) return 'global';
    
    const namCountries = ['United States', 'Canada'];
    const latamCountries = ['Mexico', 'Brazil', 'Argentina', 'Colombia', 'Chile', 'Peru'];
    const emeaCountries = [
      'United Kingdom', 'France', 'Germany', 'Italy', 'Spain', 'Ireland',
      'Netherlands', 'Belgium', 'Switzerland', 'Sweden', 'Denmark', 'Norway',
      'Finland', 'Poland', 'Austria', 'Portugal', 'Greece', 'Czech Republic',
      'Turkey', 'Saudi Arabia', 'United Arab Emirates', 'South Africa'
    ];
    const apacCountries = [
      'China', 'Japan', 'India', 'Australia', 'Singapore', 'South Korea',
      'Hong Kong', 'Malaysia', 'Thailand', 'Taiwan', 'Vietnam', 'Indonesia',
      'Philippines', 'New Zealand'
    ];
    
    if (namCountries.includes(country)) return 'nam';
    if (latamCountries.includes(country)) return 'latam';
    if (emeaCountries.includes(country)) return 'emea';
    if (apacCountries.includes(country)) return 'apac';
    
    return 'global';
  },
  
  // Normalize JLL options from UI format to internal format
  normalizeOptions: function(layoutString?: string, qualityString?: string, scopeString?: string): JLLOptions {
    // Default values
    const options: JLLOptions = {
      layoutType: 'high_spatial',
      qualityLevel: 'medium',
      scope: 'Fitout'
    };
    
    // Layout mapping
    if (layoutString) {
      const layoutMap: {[key: string]: string} = {
        'Open & flexible': 'open_flexible',
        'High spatial variety': 'high_spatial',
        'Structured': 'structured'
      };
      
      options.layoutType = (layoutMap[layoutString] || layoutString.toLowerCase().replace(/\s+|&/g, '_')) as any;
    }
    
    // Quality mapping
    if (qualityString) {
      const qualityMap: {[key: string]: string} = {
        'Baseline': 'baseline',
        'Medium': 'medium',
        'High': 'high'
      };
      
      options.qualityLevel = (qualityMap[qualityString] || qualityString.toLowerCase()) as any;
    }
    
    // Scope mapping
    if (scopeString) {
      options.scope = scopeString as any;
    }
    
    return options;
  },
  
  // Main calculation function with enhanced error handling
  calculate: function(project: Project, layoutString?: string, qualityString?: string, scopeString: string = 'Fitout'): JLLCalculationResult {
    console.log("=== JLL CALCULATION START ===");
    console.log("Project data:", JSON.stringify(project, null, 2));
    console.log("Raw options:", { layoutString, qualityString, scopeString });
    
    // Validate essential project data
    if (!project) {
      throw new Error("Project data is required for JLL calculation");
    }
    
    if (!project.totalArea || project.totalArea <= 0) {
      throw new Error("Valid total area is required for JLL calculation");
    }
    
    if (!project.country) {
      console.warn("No country specified, using global rates");
    }
    
    try {
      // Normalize inputs with enhanced validation
      const options = this.normalizeOptions(layoutString, qualityString, scopeString);
      console.log("Normalized options:", options);
      
      // Validate normalized options
      if (!options.layoutType || !options.qualityLevel) {
        console.error("Failed to normalize layout or quality options");
        throw new Error("Invalid layout or quality options provided");
      }
      
      // Determine region
      const region = this.determineRegion(project.country);
      console.log("Using JLL region:", region);
      
      // Get appropriate cost data with validation
      const regionData = this.costData[region as keyof typeof this.costData];
      if (!regionData) {
        console.warn(`No region data found for ${region}, falling back to global`);
      }
      
      const effectiveRegionData = regionData || this.costData.global;
      const layoutData = effectiveRegionData[options.layoutType as keyof typeof effectiveRegionData];
      if (!layoutData) {
        console.warn(`No layout data found for ${options.layoutType}, falling back to high_spatial`);
      }
      
      const effectiveLayoutData = layoutData || effectiveRegionData.high_spatial;
      const baseCost = effectiveLayoutData[options.qualityLevel as keyof typeof effectiveLayoutData];
      if (!baseCost) {
        console.warn(`No quality data found for ${options.qualityLevel}, falling back to medium`);
      }
      
      const effectiveBaseCost = baseCost || effectiveLayoutData.medium || 1970;
      
      console.log(`Base cost per sqm: ${region}/${options.layoutType}/${options.qualityLevel} = $${effectiveBaseCost}`);
      
      // Validate and convert area
      let areaInSqm = project.totalArea;
      if (project.areaUnit === 'sqft') {
        areaInSqm = project.totalArea * 0.092903;
        console.log(`Converting ${project.totalArea} sqft to ${areaInSqm.toFixed(2)} sqm`);
      }
      
      if (areaInSqm <= 0) {
        throw new Error("Calculated area must be positive");
      }
      
      // Calculate raw cost
      const rawCost = effectiveBaseCost * areaInSqm;
      console.log(`Raw cost calculation: ${effectiveBaseCost} × ${areaInSqm.toFixed(2)} = $${rawCost.toFixed(2)}`);
      
      // Apply inflation if specified
      const inflationMultiplier = project.inflationRate ? (1 + project.inflationRate / 100) : 1;
      const inflatedCost = rawCost * inflationMultiplier;
      
      console.log(`Cost after inflation (${project.inflationRate || 0}%): $${inflatedCost.toFixed(2)}`);
      
      // Standard JLL breakdown percentages
      const breakdownPcts = {
        buildersWorks: 0.37,          // 37% Construction/builder's works
        meServices: 0.29,             // 29% M&E services
        furniture: 0.13,              // 13% Furniture & Equipment
        technology: 0.12,             // 12% Security/IT/AV
        professionalServices: 0.08    // 8% Professional services
      };
      
      // Initialize costs
      let fitoutCost = 0;
      let furnitureCost = 0;
      
      // Calculate costs based on scope with validation
      console.log(`Calculating costs for scope: ${options.scope}`);
      
      if (options.scope === 'Fitout') {
        fitoutCost = inflatedCost;
        furnitureCost = 0;
      } else if (options.scope === 'Furniture') {
        fitoutCost = 0;
        furnitureCost = inflatedCost;
      } else if (options.scope === 'Both') {
        // Both - use the standard breakdown
        fitoutCost = inflatedCost * (1 - breakdownPcts.furniture);
        furnitureCost = inflatedCost * breakdownPcts.furniture;
      } else {
        console.warn(`Unknown scope '${options.scope}', defaulting to Fitout`);
        fitoutCost = inflatedCost;
        furnitureCost = 0;
      }
      
      // Total cost is the sum
      const totalBudget = fitoutCost + furnitureCost;
      console.log(`Cost breakdown: Fitout=$${fitoutCost.toFixed(2)}, Furniture=$${furnitureCost.toFixed(2)}, Total=$${totalBudget.toFixed(2)}`);
      
      // Validate final calculations
      if (totalBudget <= 0 || !isFinite(totalBudget)) {
        throw new Error("Invalid total budget calculated");
      }
      
      // Prepare space allocation template based on layout type
      let defaultAllocation: any = {};
      const effectiveLayout = layoutString || 'High spatial variety';
      
      if (effectiveLayout === 'Open & flexible') {
        defaultAllocation = {
          'Open workspace': { percentage: 65, area: project.totalArea * 0.65 },
          'Meeting areas': { percentage: 20, area: project.totalArea * 0.20 },
          'Support spaces': { percentage: 15, area: project.totalArea * 0.15 }
        };
      } else if (effectiveLayout === 'High spatial variety') {
        defaultAllocation = {
          'Open workspace': { percentage: 45, area: project.totalArea * 0.45 },
          'Focus rooms': { percentage: 15, area: project.totalArea * 0.15 },
          'Meeting areas': { percentage: 25, area: project.totalArea * 0.25 },
          'Support spaces': { percentage: 15, area: project.totalArea * 0.15 }
        };
      } else if (effectiveLayout === 'Structured') {
        defaultAllocation = {
          'Open workspace': { percentage: 40, area: project.totalArea * 0.40 },
          'Private offices': { percentage: 25, area: project.totalArea * 0.25 },
          'Meeting areas': { percentage: 20, area: project.totalArea * 0.20 },
          'Support spaces': { percentage: 15, area: project.totalArea * 0.15 }
        };
      }
      
      // Prepare cost breakdown in format expected by UI
      const costsBreakdown: {[key: string]: number} = {
        'JLL DATA SOURCE': 1,
        'TOTAL COST': Math.round(totalBudget),
        'FITOUT BASE COSTS': Math.round(fitoutCost),
        'FURNITURE BASE COSTS': Math.round(furnitureCost),
        'BUILDERS WORKS': Math.round(inflatedCost * breakdownPcts.buildersWorks),
        'M&E SERVICES': Math.round(inflatedCost * breakdownPcts.meServices),
        'SECURITY, IT & AV': Math.round(inflatedCost * breakdownPcts.technology),
        'PROJECT MANAGEMENT': Math.round(inflatedCost * breakdownPcts.professionalServices)
      };
      
      // Calculate rate per unit for display
      const adjustedRate = project.areaUnit === 'sqft' 
        ? baseCost / 10.764  // Convert sqm rate to sqft rate
        : baseCost;
        
      console.log(`Calculation complete - total budget: $${totalBudget.toFixed(2)}`);
      
      // Return result in format expected by the application
      return {
        success: true,
        totalBudget,
        fitoutCost,
        furnitureCost,
        baseCost,
        adjustedRate,
        areaInSqm,
        breakdown: {
          buildersWorks: Math.round(inflatedCost * breakdownPcts.buildersWorks),
          meServices: Math.round(inflatedCost * breakdownPcts.meServices),
          furniture: Math.round(inflatedCost * breakdownPcts.furniture),
          technology: Math.round(inflatedCost * breakdownPcts.technology),
          professionalServices: Math.round(inflatedCost * breakdownPcts.professionalServices)
        },
        defaultAllocation,
        rawUnitCost: baseCost,
        adjustedUnitCost: adjustedRate,
        costsBreakdown
      };
    } catch (error) {
      console.error("JLL standalone calculation error:", error);
      
      // Return error result
      return {
        success: false,
        totalBudget: 0,
        fitoutCost: 0,
        furnitureCost: 0,
        baseCost: 0,
        adjustedRate: 0,
        areaInSqm: project.totalArea,
        breakdown: {
          buildersWorks: 0,
          meServices: 0,
          furniture: 0,
          technology: 0,
          professionalServices: 0
        },
        defaultAllocation: {},
        rawUnitCost: 0,
        adjustedUnitCost: 0,
        costsBreakdown: { 'JLL DATA SOURCE': 1 },
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
};

export default JLLCalculator;