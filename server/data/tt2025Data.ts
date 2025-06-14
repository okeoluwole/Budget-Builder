// Turner & Townsend 2025 Global Office Fit-Out Cost Guide Data
// Server-side copy for chat wizard access

export interface TT2025CostData {
  country: string;
  city: string;
  region: 'EMEA' | 'AMERICAS' | 'APAC';
  costs: {
    total: {
      low: number;      // USD per sqm
      medium: number;   // USD per sqm  
      high: number;     // USD per sqm
    };
    construction: {
      low: number;      // USD per sqm
      medium: number;   // USD per sqm
      high: number;     // USD per sqm
    };
    looseFurniture: {
      low: number;      // USD per sqm
      medium: number;   // USD per sqm
      high: number;     // USD per sqm
    };
    audioVisual: {
      low: number;      // USD per sqm
      medium: number;   // USD per sqm
      high: number;     // USD per sqm
    };
    professionalFees: {
      low: number;      // USD per sqm
      medium: number;   // USD per sqm
      high: number;     // USD per sqm
    };
  };
}

// T&T 2025 Cost Data from PDF
export const TT2025_COST_DATA: TT2025CostData[] = [
  // EMEA Region
  {
    country: 'United Kingdom',
    city: 'London',
    region: 'EMEA',
    costs: {
      total: { low: 3024.0, medium: 4536.0, high: 6552.0 },
      construction: { low: 2268.0, medium: 3456.0, high: 4968.0 },
      looseFurniture: { low: 378.0, medium: 540.0, high: 756.0 },
      audioVisual: { low: 189.0, medium: 270.0, high: 378.0 },
      professionalFees: { low: 189.0, medium: 270.0, high: 450.0 }
    }
  },
  {
    country: 'Germany',
    city: 'Munich',
    region: 'EMEA',
    costs: {
      total: { low: 2701.5, medium: 3193.2, high: 4137.0 },
      construction: { low: 2137.1, medium: 2539.6, high: 3322.6 },
      looseFurniture: { low: 169.1, medium: 187.4, high: 205.8 },
      audioVisual: { low: 37.8, medium: 42.0, high: 52.5 },
      professionalFees: { low: 357.5, medium: 425.2, high: 556.0 }
    }
  },
  {
    country: 'France',
    city: 'Paris',
    region: 'EMEA',
    costs: {
      total: { low: 2244.4, medium: 2862.0, high: 4014.0 },
      construction: { low: 1771.1, medium: 2232.0, high: 3089.0 },
      looseFurniture: { low: 220.6, medium: 314.9, high: 504.0 },
      audioVisual: { low: 78.9, medium: 94.5, high: 115.5 },
      professionalFees: { low: 173.7, medium: 219.5, high: 305.6 }
    }
  },
  
  // AMERICAS Region
  {
    country: 'United States',
    city: 'New York',
    region: 'AMERICAS',
    costs: {
      total: { low: 3780.0, medium: 4860.0, high: 6480.0 },
      construction: { low: 2808.0, medium: 3564.0, high: 4752.0 },
      looseFurniture: { low: 486.0, medium: 648.0, high: 864.0 },
      audioVisual: { low: 243.0, medium: 324.0, high: 432.0 },
      professionalFees: { low: 243.0, medium: 324.0, high: 432.0 }
    }
  },
  {
    country: 'Canada',
    city: 'Toronto',
    region: 'AMERICAS',
    costs: {
      total: { low: 2592.0, medium: 3456.0, high: 4644.0 },
      construction: { low: 1944.0, medium: 2592.0, high: 3456.0 },
      looseFurniture: { low: 324.0, medium: 432.0, high: 594.0 },
      audioVisual: { low: 162.0, medium: 216.0, high: 297.0 },
      professionalFees: { low: 162.0, medium: 216.0, high: 297.0 }
    }
  },
  
  // APAC Region
  {
    country: 'Singapore',
    city: 'Singapore',
    region: 'APAC',
    costs: {
      total: { low: 2160.0, medium: 3024.0, high: 4050.0 },
      construction: { low: 1620.0, medium: 2268.0, high: 3024.0 },
      looseFurniture: { low: 270.0, medium: 378.0, high: 513.0 },
      audioVisual: { low: 135.0, medium: 189.0, high: 256.5 },
      professionalFees: { low: 135.0, medium: 189.0, high: 256.5 }
    }
  },
  {
    country: 'Hong Kong',
    city: 'Hong Kong',
    region: 'APAC',
    costs: {
      total: { low: 2808.0, medium: 3780.0, high: 4968.0 },
      construction: { low: 2106.0, medium: 2835.0, high: 3726.0 },
      looseFurniture: { low: 351.0, medium: 473.0, high: 621.0 },
      audioVisual: { low: 175.5, medium: 236.25, high: 310.5 },
      professionalFees: { low: 175.5, medium: 236.25, high: 310.5 }
    }
  },
  {
    country: 'Japan',
    city: 'Tokyo',
    region: 'APAC',
    costs: {
      total: { low: 3456.0, medium: 4320.0, high: 5616.0 },
      construction: { low: 2592.0, medium: 3240.0, high: 4212.0 },
      looseFurniture: { low: 432.0, medium: 540.0, high: 702.0 },
      audioVisual: { low: 216.0, medium: 270.0, high: 351.0 },
      professionalFees: { low: 216.0, medium: 270.0, high: 351.0 }
    }
  },
  {
    country: 'Australia',
    city: 'Sydney',
    region: 'APAC',
    costs: {
      total: { low: 2700.0, medium: 3780.0, high: 5076.0 },
      construction: { low: 2025.0, medium: 2835.0, high: 3807.0 },
      looseFurniture: { low: 337.5, medium: 472.5, high: 634.5 },
      audioVisual: { low: 168.75, medium: 236.25, high: 317.25 },
      professionalFees: { low: 168.75, medium: 236.25, high: 317.25 }
    }
  },
  {
    country: 'China',
    city: 'Shanghai',
    region: 'APAC',
    costs: {
      total: { low: 1944.0, medium: 2916.0, high: 3888.0 },
      construction: { low: 1458.0, medium: 2187.0, high: 2916.0 },
      looseFurniture: { low: 243.0, medium: 364.5, high: 486.0 },
      audioVisual: { low: 121.5, medium: 182.25, high: 243.0 },
      professionalFees: { low: 121.5, medium: 182.25, high: 243.0 }
    }
  }
];

// Helper functions for chat wizard
export function getTT2025DataByLocation(city: string, country: string): TT2025CostData | undefined {
  return TT2025_COST_DATA.find(data => 
    data.city.toLowerCase() === city.toLowerCase() && 
    data.country.toLowerCase() === country.toLowerCase()
  );
}

export function getAllTT2025Cities(): string[] {
  return TT2025_COST_DATA.map(data => `${data.city}, ${data.country}`);
}

export function getTT2025DataByRegion(region: 'EMEA' | 'AMERICAS' | 'APAC'): TT2025CostData[] {
  return TT2025_COST_DATA.filter(data => data.region === region);
}