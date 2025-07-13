/**
 * Comprehensive Data Source Leveling System
 * Handles all potential mismatches between CBRE, T&T, and JLL for multi-source comparisons
 */

import { normalizeCountryName, normalizeCityName } from './locationNormalizer';

export interface DataSourceProfile {
  id: string;
  name: string;
  
  // Specification handling
  specifications: {
    levels: string[];
    mapping: { [key: string]: string };
    format: 'simple' | 'compound';
  };
  
  // Layout support
  layouts: {
    supported: boolean;
    types: string[];
    defaultFallback: string;
  };
  
  // Scope/Component structure
  components: {
    names: string[];
    mapping: { [standardName: string]: string };
    calculationMethod: 'rate-based' | 'percentage' | 'hybrid';
  };
  
  // Currency handling
  currency: {
    native: string;
    supportsConversion: boolean;
    displayFormat: string;
  };
  
  // Geographic coverage
  coverage: {
    countries: string[];
    cities: string[];
    regions: string[];
  };
  
  // Data characteristics
  characteristics: {
    hasLayoutVariations: boolean;
    usesAreaMultipliers: boolean;
    supportsProfessionalFees: boolean;
    dataVintage: string;
    updateFrequency: string;
  };
}

// Complete data source profiles
export const DATA_SOURCE_PROFILES: { [key: string]: DataSourceProfile } = {
  'CBRE': {
    id: 'CBRE',
    name: 'CBRE Global Fit-Out Cost Guide',
    specifications: {
      levels: ['Low (Bronze)', 'Medium (Silver)', 'High (Gold)'],
      mapping: { 'Low': 'Low (Bronze)', 'Medium': 'Medium (Silver)', 'High': 'High (Gold)' },
      format: 'compound'
    },
    layouts: {
      supported: true,
      types: ['Activity', 'Team', 'Event'],
      defaultFallback: 'Activity'
    },
    components: {
      names: ['Construction', 'Furniture', 'Technology', 'Professional Fees'],
      mapping: {
        'Construction': 'FITOUT COSTS',
        'Furniture': 'FURNITURE COSTS', 
        'Technology': 'TECHNOLOGY COSTS',
        'Professional Fees': 'PROFESSIONAL FEES'
      },
      calculationMethod: 'rate-based'
    },
    currency: {
      native: 'USD',
      supportsConversion: false,
      displayFormat: 'USD'
    },
    coverage: {
      countries: ['United Kingdom', 'United States', 'Singapore', 'Australia', 'Germany', 'France', 'Japan', 'Canada', 'India', 'China', 'Brazil', 'Mexico', 'South Africa', 'Nigeria', 'UAE'],
      cities: ['London', 'New York', 'Singapore', 'Sydney', 'Munich', 'Paris', 'Tokyo', 'Toronto', 'Mumbai', 'Shanghai'],
      regions: ['EMEA', 'AMERICAS', 'APAC']
    },
    characteristics: {
      hasLayoutVariations: true,
      usesAreaMultipliers: true,
      supportsProfessionalFees: true,
      dataVintage: '2024',
      updateFrequency: 'Annual'
    }
  },
  
  'TT': {
    id: 'TT',
    name: 'Turner & Townsend Global Office Fit-Out Cost Guide',
    specifications: {
      levels: ['Low', 'Medium', 'High'],
      mapping: { 'Low (Bronze)': 'Low', 'Medium (Silver)': 'Medium', 'High (Gold)': 'High' },
      format: 'simple'
    },
    layouts: {
      supported: false,
      types: [],
      defaultFallback: 'Universal'
    },
    components: {
      names: ['Construction', 'Loose Furniture', 'Audio-Visual', 'Professional Fees'],
      mapping: {
        'Construction': 'CONSTRUCTION COSTS',
        'Furniture': 'LOOSE FURNITURE COSTS',
        'Technology': 'AUDIO-VISUAL COSTS',
        'Professional Fees': 'PROFESSIONAL FEES'
      },
      calculationMethod: 'rate-based'
    },
    currency: {
      native: 'USD',
      supportsConversion: false,
      displayFormat: 'USD'
    },
    coverage: {
      countries: ['United Kingdom', 'United States', 'Singapore', 'Australia', 'Germany', 'France', 'Canada'],
      cities: ['London', 'New York', 'Toronto', 'Vancouver', 'Paris', 'Munich', 'Sydney', 'Singapore'],
      regions: ['EMEA', 'AMERICAS', 'APAC']
    },
    characteristics: {
      hasLayoutVariations: false,
      usesAreaMultipliers: true,
      supportsProfessionalFees: true,
      dataVintage: '2025',
      updateFrequency: 'Annual'
    }
  },
  
  'JLL': {
    id: 'JLL',
    name: 'JLL Global Office Fit-Out Guide',
    specifications: {
      levels: ['baseline', 'medium', 'high'],
      mapping: { 'Low (Bronze)': 'baseline', 'Medium (Silver)': 'medium', 'High (Gold)': 'high' },
      format: 'simple'
    },
    layouts: {
      supported: false,
      types: [],
      defaultFallback: 'Standard'
    },
    components: {
      names: ['Builders Works', 'M&E Services', 'Security/IT/AV', 'Project Management'],
      mapping: {
        'Construction': 'Builders Works',
        'Furniture': 'Builders Works',
        'Technology': 'Security/IT/AV',
        'Professional Fees': 'Project Management'
      },
      calculationMethod: 'percentage'
    },
    currency: {
      native: 'USD',
      supportsConversion: true,
      displayFormat: 'Local'
    },
    coverage: {
      countries: ['United Kingdom', 'United States', 'Singapore', 'Australia', 'Hong Kong', 'France', 'Germany', 'Japan', 'Canada', 'India'],
      cities: ['London', 'New York', 'Singapore', 'Sydney', 'Hong Kong', 'Paris', 'Munich', 'Tokyo', 'Toronto', 'Mumbai'],
      regions: ['Global']
    },
    characteristics: {
      hasLayoutVariations: false,
      usesAreaMultipliers: false,
      supportsProfessionalFees: true,
      dataVintage: '2024',
      updateFrequency: 'Quarterly'
    }
  }
};

// Leveling functions
export function levelSpecifications(sourceSpec: string, fromGuide: string, toGuide: string): string {
  const fromProfile = DATA_SOURCE_PROFILES[fromGuide];
  const toProfile = DATA_SOURCE_PROFILES[toGuide];
  
  if (!fromProfile || !toProfile) {
    return sourceSpec;
  }
  
  // Extract base specification level
  let baseSpec = sourceSpec;
  if (sourceSpec.includes('Low') || sourceSpec.includes('Bronze')) {
    baseSpec = 'Low';
  } else if (sourceSpec.includes('High') || sourceSpec.includes('Gold')) {
    baseSpec = 'High';
  } else {
    baseSpec = 'Medium';
  }
  
  // Map to target guide format
  const targetMapping = toProfile.specifications.mapping;
  return targetMapping[sourceSpec] || targetMapping[baseSpec] || baseSpec;
}

export function levelLayouts(sourceLayout: string, fromGuide: string, toGuide: string): string {
  const fromProfile = DATA_SOURCE_PROFILES[fromGuide];
  const toProfile = DATA_SOURCE_PROFILES[toGuide];
  
  if (!toProfile.layouts.supported) {
    console.log(`⚠️ ${toGuide} does not support layout variations - using universal rates`);
    return toProfile.layouts.defaultFallback;
  }
  
  if (!fromProfile.layouts.supported) {
    return toProfile.layouts.defaultFallback;
  }
  
  // If both support layouts, keep the same layout or fallback to default
  if (toProfile.layouts.types.includes(sourceLayout)) {
    return sourceLayout;
  }
  
  return toProfile.layouts.defaultFallback;
}

export function levelComponents(sourceComponents: string[], fromGuide: string, toGuide: string): { [sourceComponent: string]: string } {
  const fromProfile = DATA_SOURCE_PROFILES[fromGuide];
  const toProfile = DATA_SOURCE_PROFILES[toGuide];
  
  const mapping: { [key: string]: string } = {};
  
  sourceComponents.forEach(component => {
    // Find equivalent component in target guide
    let targetComponent = component;
    
    // Use standard component mapping
    switch (component.toLowerCase()) {
      case 'construction':
      case 'fitout':
      case 'builders works':
        targetComponent = toProfile.components.mapping['Construction'] || 'Construction';
        break;
      case 'furniture':
      case 'loose furniture':
        targetComponent = toProfile.components.mapping['Furniture'] || 'Furniture';
        break;
      case 'technology':
      case 'audio-visual':
      case 'security/it/av':
        targetComponent = toProfile.components.mapping['Technology'] || 'Technology';
        break;
      case 'professional fees':
      case 'project management':
        targetComponent = toProfile.components.mapping['Professional Fees'] || 'Professional Fees';
        break;
    }
    
    mapping[component] = targetComponent;
  });
  
  return mapping;
}

export function levelCurrency(sourceCurrency: string, fromGuide: string, toGuide: string): string {
  const toProfile = DATA_SOURCE_PROFILES[toGuide];
  
  // Most guides use USD as native currency
  if (toProfile.currency.native === 'USD') {
    return 'USD';
  }
  
  return toProfile.currency.supportsConversion ? sourceCurrency : toProfile.currency.native;
}

export function validateDataSourceCompatibility(fromGuide: string, toGuide: string, location: { country: string, city: string }): {
  compatible: boolean;
  issues: string[];
  adjustments: string[];
} {
  const fromProfile = DATA_SOURCE_PROFILES[fromGuide];
  const toProfile = DATA_SOURCE_PROFILES[toGuide];
  
  const issues: string[] = [];
  const adjustments: string[] = [];
  
  // Check geographic coverage
  const normalizedCountry = normalizeCountryName(location.country);
  const normalizedCity = normalizeCityName(location.city, location.country);
  
  const fromHasCountry = fromProfile.coverage.countries.some(c => 
    normalizeCountryName(c) === normalizedCountry
  );
  const toHasCountry = toProfile.coverage.countries.some(c => 
    normalizeCountryName(c) === normalizedCountry
  );
  
  if (!fromHasCountry) {
    issues.push(`${fromGuide} does not have data for ${location.country}`);
  }
  
  if (!toHasCountry) {
    issues.push(`${toGuide} does not have data for ${location.country}`);
  }
  
  // Check layout compatibility
  if (fromProfile.layouts.supported && !toProfile.layouts.supported) {
    adjustments.push(`${toGuide} uses universal rates - layout variations will be ignored`);
  }
  
  // Check specification compatibility
  if (fromProfile.specifications.format !== toProfile.specifications.format) {
    adjustments.push(`Specification format mapping: ${fromProfile.specifications.format} → ${toProfile.specifications.format}`);
  }
  
  // Check component compatibility
  const componentOverlap = fromProfile.components.names.filter(comp => 
    toProfile.components.names.some(target => 
      comp.toLowerCase().includes(target.toLowerCase()) || 
      target.toLowerCase().includes(comp.toLowerCase())
    )
  );
  
  if (componentOverlap.length < Math.min(fromProfile.components.names.length, toProfile.components.names.length)) {
    adjustments.push(`Component mapping required between different naming conventions`);
  }
  
  // Check data vintage compatibility
  if (fromProfile.characteristics.dataVintage !== toProfile.characteristics.dataVintage) {
    adjustments.push(`Data vintage difference: ${fromProfile.characteristics.dataVintage} vs ${toProfile.characteristics.dataVintage}`);
  }
  
  return {
    compatible: issues.length === 0,
    issues,
    adjustments
  };
}

export function generateLevelingReport(fromGuide: string, toGuide: string, originalBudget: any): {
  leveledBudget: any;
  transformations: string[];
  warnings: string[];
} {
  const transformations: string[] = [];
  const warnings: string[] = [];
  
  const leveledBudget = { ...originalBudget };
  
  // Level specifications
  const leveledSpec = levelSpecifications(originalBudget.specification, fromGuide, toGuide);
  if (leveledSpec !== originalBudget.specification) {
    transformations.push(`Specification: ${originalBudget.specification} → ${leveledSpec}`);
    leveledBudget.specification = leveledSpec;
  }
  
  // Level layouts
  const leveledLayout = levelLayouts(originalBudget.layout || 'Activity', fromGuide, toGuide);
  if (leveledLayout !== (originalBudget.layout || 'Activity')) {
    transformations.push(`Layout: ${originalBudget.layout || 'Activity'} → ${leveledLayout}`);
    leveledBudget.layout = leveledLayout;
    
    if (leveledLayout === 'Universal' || leveledLayout === 'Standard') {
      warnings.push(`${toGuide} uses universal rates - layout-specific pricing not available`);
    }
  }
  
  // Level currency
  const leveledCurrency = levelCurrency(originalBudget.currency || 'USD', fromGuide, toGuide);
  if (leveledCurrency !== (originalBudget.currency || 'USD')) {
    transformations.push(`Currency: ${originalBudget.currency || 'USD'} → ${leveledCurrency}`);
    leveledBudget.currency = leveledCurrency;
  }
  
  return {
    leveledBudget,
    transformations,
    warnings
  };
}