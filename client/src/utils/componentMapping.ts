import { DataSourceType } from '@shared/schema';

export interface ComponentMapping {
  tt: string;
  cbre: string;
  description: string;
  cbreDataAvailable: boolean;
}

export const componentMapping: Record<string, ComponentMapping> = {
  construction: {
    tt: "Construction",
    cbre: "Construction/Fitout", 
    description: "Core building works, partitions, flooring, ceilings",
    cbreDataAvailable: true
  },
  furniture: {
    tt: "Loose Furniture",
    cbre: "Furniture",
    description: "Desks, chairs, storage, meeting room furniture",
    cbreDataAvailable: true
  },
  technology: {
    tt: "Audio-Visual", 
    cbre: "Technology",
    description: "AV systems, displays, conferencing equipment",
    cbreDataAvailable: false // Using T&T data temporarily
  },
  professional: {
    tt: "Professional Fees",
    cbre: "Professional Fees", 
    description: "Design, project management, consulting services",
    cbreDataAvailable: false // Using T&T data temporarily
  }
};

export interface ComponentCost {
  component: string;
  cost: number;
  rate: number;
  dataSource: 'TT' | 'CBRE' | 'TT_BORROWED';
}

export interface MultiSourceBudget {
  tt: {
    components: ComponentCost[];
    total: number;
    costPerSqm: number;
  };
  cbre: {
    components: ComponentCost[];
    total: number;
    costPerSqm: number;
  };
  comparison: {
    totalVariance: number;
    percentageVariance: number;
    componentVariances: Array<{
      component: string;
      variance: number;
      percentageVariance: number;
      reliableComparison: boolean;
    }>;
  };
  dataIntegrity: {
    cbreNativeComponents: string[];
    cbreBorrowedComponents: string[];
    notes: string[];
  };
}

export function getComparableLocations() {
  // This would check which locations are available in both T&T and CBRE datasets
  // For now, return common major cities
  return [
    { city: 'London', country: 'United Kingdom' },
    { city: 'New York', country: 'United States' },
    { city: 'Singapore', country: 'Singapore' },
    { city: 'Sydney', country: 'Australia' },
    { city: 'Hong Kong', country: 'China' }
  ];
}

export function mapSelectedComponents(scope: string[]): { tt: string[], cbre: string[] } {
  const ttComponents: string[] = [];
  const cbreComponents: string[] = [];
  
  scope.forEach(scopeItem => {
    switch (scopeItem) {
      case 'Construction':
        ttComponents.push('Construction');
        cbreComponents.push('Construction');
        break;
      case 'LooseFurniture':
        ttComponents.push('LooseFurniture');
        cbreComponents.push('Furniture');
        break;
      case 'AudioVisual':
        ttComponents.push('AudioVisual');
        cbreComponents.push('AudioVisual'); // Will use T&T data
        break;
      case 'ProfessionalFees':
        ttComponents.push('ProfessionalFees');
        cbreComponents.push('ProfessionalFees'); // Will use T&T data
        break;
      case 'Complete':
        ttComponents.push(...['Construction', 'LooseFurniture', 'AudioVisual', 'ProfessionalFees']);
        cbreComponents.push(...['Construction', 'Furniture', 'AudioVisual', 'ProfessionalFees']);
        break;
    }
  });
  
  return { tt: ttComponents, cbre: cbreComponents };
}

export function generateVarianceAnalysis(ttBudget: any, cbreBudget: any): MultiSourceBudget['comparison'] {
  const totalVariance = Math.abs(ttBudget.total - cbreBudget.total);
  const percentageVariance = (totalVariance / Math.min(ttBudget.total, cbreBudget.total)) * 100;
  
  const componentVariances = ttBudget.components.map((ttComp: any) => {
    const cbreComp = cbreBudget.components.find((c: any) => 
      componentMapping[ttComp.component.toLowerCase()]?.cbre === c.component ||
      ttComp.component === c.component
    );
    
    if (cbreComp) {
      const variance = Math.abs(ttComp.cost - cbreComp.cost);
      const percentageVariance = (variance / Math.min(ttComp.cost, cbreComp.cost)) * 100;
      const reliableComparison = cbreComp.dataSource === 'CBRE'; // Only reliable if using native CBRE data
      
      return {
        component: ttComp.component,
        variance,
        percentageVariance,
        reliableComparison
      };
    }
    
    return {
      component: ttComp.component,
      variance: 0,
      percentageVariance: 0,
      reliableComparison: false
    };
  });
  
  return {
    totalVariance,
    percentageVariance,
    componentVariances
  };
}

export function generateRecommendation(percentageVariance: number): string {
  if (percentageVariance <= 5) {
    return "Excellent alignment between sources - high confidence in estimates";
  } else if (percentageVariance <= 15) {
    return "Both estimates fall within acceptable industry range - consider average for planning";
  } else if (percentageVariance <= 25) {
    return "Moderate variance detected - recommend local market validation";
  } else {
    return "Significant variance requires investigation - consider additional data sources";
  }
}

export function generateInsights(ttBudget: any, cbreBudget: any): {
  summary: string;
  highestVariance: string;
  recommendation: string;
  reliability: string;
} {
  const comparison = generateVarianceAnalysis(ttBudget, cbreBudget);
  const highestVarianceComponent = comparison.componentVariances.reduce((prev, current) => 
    (prev.percentageVariance > current.percentageVariance) ? prev : current
  );
  
  return {
    summary: `${comparison.percentageVariance.toFixed(1)}% variance between sources`,
    highestVariance: `${highestVarianceComponent.component} component (${highestVarianceComponent.percentageVariance.toFixed(1)}% difference)`,
    recommendation: generateRecommendation(comparison.percentageVariance),
    reliability: comparison.componentVariances.filter(c => c.reliableComparison).length === comparison.componentVariances.length 
      ? "Full comparison using native data sources"
      : "Partial comparison - some components use borrowed data"
  };
}