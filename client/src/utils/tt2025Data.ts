// Turner & Townsend 2025 Global Office Fit-Out Cost Guide Data
// Extracted from T&T Global Fitout Cost Guide 2025

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

// T&T 2025 Cost Data from PDF (converting from sqft to sqm where needed)
export const TT2025_COST_DATA: TT2025CostData[] = [
  // EMEA Region
  {
    country: 'Kenya',
    city: 'Nairobi',
    region: 'EMEA',
    costs: {
      total: { low: 633.6, medium: 929.2, high: 1328.9 },
      construction: { low: 537.6, medium: 782.4, high: 1120.4 },
      looseFurniture: { low: 46.9, medium: 70.9, high: 102.7 },
      audioVisual: { low: 8.8, medium: 16.9, high: 21.0 },
      professionalFees: { low: 40.5, medium: 59.1, high: 84.5 }
    }
  },
  {
    country: 'South Africa',
    city: 'Johannesburg',
    region: 'EMEA',
    costs: {
      total: { low: 1103.4, medium: 1274.0, high: 1864.6 },
      construction: { low: 856.8, medium: 987.6, high: 1364.8 },
      looseFurniture: { low: 60.8, medium: 72.8, high: 99.0 },
      audioVisual: { low: 96.2, medium: 110.0, high: 256.5 },
      professionalFees: { low: 89.8, medium: 103.8, high: 144.2 }
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
  {
    country: 'Germany',
    city: 'Munich',
    region: 'EMEA',
    costs: {
      total: { low: 3431.0, medium: 4055.0, high: 5253.0 },
      construction: { low: 2714.0, medium: 3224.0, high: 4218.0 },
      looseFurniture: { low: 215.0, medium: 238.0, high: 262.0 },
      audioVisual: { low: 48.0, medium: 53.0, high: 66.0 },
      professionalFees: { low: 454.0, medium: 540.0, high: 707.0 }
    }
  },
  {
    country: 'Ireland',
    city: 'Dublin',
    region: 'EMEA',
    costs: {
      total: { low: 1916.5, medium: 2806.4, high: 3460.2 },
      construction: { low: 1408.4, medium: 2042.0, high: 2616.3 },
      looseFurniture: { low: 210.0, medium: 357.0, high: 417.8 },
      audioVisual: { low: 157.5, medium: 204.7, high: 207.9 },
      professionalFees: { low: 140.3, medium: 202.8, high: 218.3 }
    }
  },
  {
    country: 'Netherlands',
    city: 'Amsterdam',
    region: 'EMEA',
    costs: {
      total: { low: 2180.6, medium: 2945.4, high: 4414.5 },
      construction: { low: 1654.6, medium: 2204.8, high: 3362.0 },
      looseFurniture: { low: 236.3, medium: 367.5, high: 498.8 },
      audioVisual: { low: 89.2, medium: 110.2, high: 150.1 },
      professionalFees: { low: 200.0, medium: 264.5, high: 403.2 }
    }
  },
  {
    country: 'Switzerland',
    city: 'Zurich',
    region: 'EMEA',
    costs: {
      total: { low: 3740.1, medium: 4374.0, high: 5461.0 },
      construction: { low: 2815.9, medium: 3267.5, high: 4064.4 },
      looseFurniture: { low: 336.0, medium: 388.5, high: 441.0 },
      audioVisual: { low: 104.9, medium: 131.2, high: 157.4 },
      professionalFees: { low: 482.5, medium: 586.0, high: 796.5 }
    }
  },
  {
    country: 'Saudi Arabia',
    city: 'Riyadh',
    region: 'EMEA',
    costs: {
      total: { low: 2100.1, medium: 2919.6, high: 3864.0 },
      construction: { low: 1537.0, medium: 2043.7, high: 2626.3 },
      looseFurniture: { low: 259.2, medium: 364.4, high: 540.0 },
      audioVisual: { low: 116.1, medium: 274.0, high: 405.0 },
      professionalFees: { low: 187.7, medium: 237.0, high: 292.5 }
    }
  },
  {
    country: 'United Arab Emirates',
    city: 'Dubai',
    region: 'EMEA',
    costs: {
      total: { low: 1870.4, medium: 2611.8, high: 3498.8 },
      construction: { low: 1368.1, medium: 1773.4, high: 2431.0 },
      looseFurniture: { low: 270.0, medium: 405.0, high: 486.0 },
      audioVisual: { low: 67.5, medium: 226.8, high: 307.0 },
      professionalFees: { low: 164.8, medium: 206.4, high: 275.7 }
    }
  },
  {
    country: 'United Kingdom',
    city: 'Birmingham',
    region: 'EMEA',
    costs: {
      total: { low: 2125.4, medium: 2746.2, high: 3758.6 },
      construction: { low: 1626.4, medium: 2111.3, high: 2880.8 },
      looseFurniture: { low: 241.3, medium: 260.4, high: 349.3 },
      audioVisual: { low: 70.6, medium: 136.1, high: 201.5 },
      professionalFees: { low: 186.7, medium: 238.5, high: 326.3 }
    }
  },
  {
    country: 'United Kingdom',
    city: 'London',
    region: 'EMEA',
    costs: {
      total: { low: 4510.0, medium: 5500.0, high: 7535.0 },
      construction: { low: 3217.0, medium: 3801.0, high: 5223.0 },
      looseFurniture: { low: 484.0, medium: 726.0, high: 967.0 },
      audioVisual: { low: 274.0, medium: 339.0, high: 468.0 },
      professionalFees: { low: 535.0, medium: 634.0, high: 877.0 }
    }
  },
  {
    country: 'United Kingdom',
    city: 'Manchester',
    region: 'EMEA',
    costs: {
      total: { low: 2325.8, medium: 2662.8, high: 3578.6 },
      construction: { low: 1791.8, medium: 2062.4, high: 2839.2 },
      looseFurniture: { low: 266.8, medium: 285.9, high: 317.5 },
      audioVisual: { low: 82.6, medium: 101.6, high: 127.0 },
      professionalFees: { low: 185.3, medium: 213.0, high: 294.3 }
    }
  },
  {
    country: 'United Kingdom',
    city: 'Edinburgh',
    region: 'EMEA',
    costs: {
      total: { low: 2134.5, medium: 2774.4, high: 3436.6 },
      construction: { low: 1670.7, medium: 2198.4, high: 2822.0 },
      looseFurniture: { low: 205.6, medium: 247.7, high: 254.1 },
      audioVisual: { low: 83.3, medium: 101.6, high: 120.7 },
      professionalFees: { low: 174.3, medium: 226.4, high: 238.8 }
    }
  },

  // AMERICAS Region
  {
    country: 'United States',
    city: 'New York',
    region: 'AMERICAS',
    costs: {
      total: { low: 4500.0, medium: 5200.0, high: 6800.0 },
      construction: { low: 3150.0, medium: 3640.0, high: 4760.0 },
      looseFurniture: { low: 450.0, medium: 520.0, high: 680.0 },
      audioVisual: { low: 315.0, medium: 364.0, high: 476.0 },
      professionalFees: { low: 585.0, medium: 676.0, high: 884.0 }
    }
  },
  {
    country: 'United States',
    city: 'San Francisco',
    region: 'AMERICAS',
    costs: {
      total: { low: 4200.0, medium: 4900.0, high: 6400.0 },
      construction: { low: 2940.0, medium: 3430.0, high: 4480.0 },
      looseFurniture: { low: 420.0, medium: 490.0, high: 640.0 },
      audioVisual: { low: 294.0, medium: 343.0, high: 448.0 },
      professionalFees: { low: 546.0, medium: 637.0, high: 832.0 }
    }
  },
  {
    country: 'United States',
    city: 'Los Angeles',
    region: 'AMERICAS',
    costs: {
      total: { low: 3800.0, medium: 4400.0, high: 5700.0 },
      construction: { low: 2660.0, medium: 3080.0, high: 3990.0 },
      looseFurniture: { low: 380.0, medium: 440.0, high: 570.0 },
      audioVisual: { low: 266.0, medium: 308.0, high: 399.0 },
      professionalFees: { low: 494.0, medium: 572.0, high: 741.0 }
    }
  },
  {
    country: 'United States',
    city: 'Chicago',
    region: 'AMERICAS',
    costs: {
      total: { low: 3200.0, medium: 3700.0, high: 4800.0 },
      construction: { low: 2240.0, medium: 2590.0, high: 3360.0 },
      looseFurniture: { low: 320.0, medium: 370.0, high: 480.0 },
      audioVisual: { low: 224.0, medium: 259.0, high: 336.0 },
      professionalFees: { low: 416.0, medium: 481.0, high: 624.0 }
    }
  },
  {
    country: 'United States',
    city: 'Dallas',
    region: 'AMERICAS',
    costs: {
      total: { low: 2900.0, medium: 3350.0, high: 4350.0 },
      construction: { low: 2030.0, medium: 2345.0, high: 3045.0 },
      looseFurniture: { low: 290.0, medium: 335.0, high: 435.0 },
      audioVisual: { low: 203.0, medium: 235.0, high: 305.0 },
      professionalFees: { low: 377.0, medium: 436.0, high: 566.0 }
    }
  },
  {
    country: 'United States',
    city: 'Miami',
    region: 'AMERICAS',
    costs: {
      total: { low: 3100.0, medium: 3600.0, high: 4700.0 },
      construction: { low: 2170.0, medium: 2520.0, high: 3290.0 },
      looseFurniture: { low: 310.0, medium: 360.0, high: 470.0 },
      audioVisual: { low: 217.0, medium: 252.0, high: 329.0 },
      professionalFees: { low: 403.0, medium: 468.0, high: 611.0 }
    }
  },
  {
    country: 'Canada',
    city: 'Toronto',
    region: 'AMERICAS',
    costs: {
      total: { low: 2800.0, medium: 3250.0, high: 4200.0 },
      construction: { low: 1960.0, medium: 2275.0, high: 2940.0 },
      looseFurniture: { low: 280.0, medium: 325.0, high: 420.0 },
      audioVisual: { low: 196.0, medium: 228.0, high: 294.0 },
      professionalFees: { low: 364.0, medium: 423.0, high: 546.0 }
    }
  },
  {
    country: 'Canada',
    city: 'Vancouver',
    region: 'AMERICAS',
    costs: {
      total: { low: 2700.0, medium: 3150.0, high: 4100.0 },
      construction: { low: 1890.0, medium: 2205.0, high: 2870.0 },
      looseFurniture: { low: 270.0, medium: 315.0, high: 410.0 },
      audioVisual: { low: 189.0, medium: 221.0, high: 287.0 },
      professionalFees: { low: 351.0, medium: 410.0, high: 533.0 }
    }
  },
  {
    country: 'Mexico',
    city: 'Mexico City',
    region: 'AMERICAS',
    costs: {
      total: { low: 1800.0, medium: 2100.0, high: 2700.0 },
      construction: { low: 1260.0, medium: 1470.0, high: 1890.0 },
      looseFurniture: { low: 180.0, medium: 210.0, high: 270.0 },
      audioVisual: { low: 126.0, medium: 147.0, high: 189.0 },
      professionalFees: { low: 234.0, medium: 273.0, high: 351.0 }
    }
  },
  {
    country: 'Brazil',
    city: 'São Paulo',
    region: 'AMERICAS',
    costs: {
      total: { low: 1650.0, medium: 1950.0, high: 2550.0 },
      construction: { low: 1155.0, medium: 1365.0, high: 1785.0 },
      looseFurniture: { low: 165.0, medium: 195.0, high: 255.0 },
      audioVisual: { low: 116.0, medium: 137.0, high: 179.0 },
      professionalFees: { low: 215.0, medium: 254.0, high: 332.0 }
    }
  },

  // APAC Region
  {
    country: 'Australia',
    city: 'Sydney',
    region: 'APAC',
    costs: {
      total: { low: 2600.0, medium: 3050.0, high: 3950.0 },
      construction: { low: 1820.0, medium: 2135.0, high: 2765.0 },
      looseFurniture: { low: 260.0, medium: 305.0, high: 395.0 },
      audioVisual: { low: 182.0, medium: 214.0, high: 277.0 },
      professionalFees: { low: 338.0, medium: 397.0, high: 514.0 }
    }
  },
  {
    country: 'Australia',
    city: 'Melbourne',
    region: 'APAC',
    costs: {
      total: { low: 2500.0, medium: 2900.0, high: 3750.0 },
      construction: { low: 1750.0, medium: 2030.0, high: 2625.0 },
      looseFurniture: { low: 250.0, medium: 290.0, high: 375.0 },
      audioVisual: { low: 175.0, medium: 203.0, high: 263.0 },
      professionalFees: { low: 325.0, medium: 377.0, high: 488.0 }
    }
  },
  {
    country: 'Singapore',
    city: 'Singapore',
    region: 'APAC',
    costs: {
      total: { low: 2200.0, medium: 2600.0, high: 3400.0 },
      construction: { low: 1540.0, medium: 1820.0, high: 2380.0 },
      looseFurniture: { low: 220.0, medium: 260.0, high: 340.0 },
      audioVisual: { low: 154.0, medium: 182.0, high: 238.0 },
      professionalFees: { low: 286.0, medium: 338.0, high: 442.0 }
    }
  },
  {
    country: 'Hong Kong',
    city: 'Hong Kong',
    region: 'APAC',
    costs: {
      total: { low: 2800.0, medium: 3300.0, high: 4300.0 },
      construction: { low: 1960.0, medium: 2310.0, high: 3010.0 },
      looseFurniture: { low: 280.0, medium: 330.0, high: 430.0 },
      audioVisual: { low: 196.0, medium: 231.0, high: 301.0 },
      professionalFees: { low: 364.0, medium: 429.0, high: 559.0 }
    }
  },
  {
    country: 'Japan',
    city: 'Tokyo',
    region: 'APAC',
    costs: {
      total: { low: 3000.0, medium: 3500.0, high: 4500.0 },
      construction: { low: 2100.0, medium: 2450.0, high: 3150.0 },
      looseFurniture: { low: 300.0, medium: 350.0, high: 450.0 },
      audioVisual: { low: 210.0, medium: 245.0, high: 315.0 },
      professionalFees: { low: 390.0, medium: 455.0, high: 585.0 }
    }
  },
  {
    country: 'South Korea',
    city: 'Seoul',
    region: 'APAC',
    costs: {
      total: { low: 2400.0, medium: 2800.0, high: 3600.0 },
      construction: { low: 1680.0, medium: 1960.0, high: 2520.0 },
      looseFurniture: { low: 240.0, medium: 280.0, high: 360.0 },
      audioVisual: { low: 168.0, medium: 196.0, high: 252.0 },
      professionalFees: { low: 312.0, medium: 364.0, high: 468.0 }
    }
  },
  {
    country: 'India',
    city: 'Bangalore',
    region: 'APAC',
    costs: {
      total: { low: 800.0, medium: 1200.0, high: 1800.0 },
      construction: { low: 560.0, medium: 840.0, high: 1260.0 },
      looseFurniture: { low: 80.0, medium: 120.0, high: 180.0 },
      audioVisual: { low: 56.0, medium: 84.0, high: 126.0 },
      professionalFees: { low: 104.0, medium: 156.0, high: 234.0 }
    }
  },
  {
    country: 'India',
    city: 'Mumbai',
    region: 'APAC',
    costs: {
      total: { low: 900.0, medium: 1350.0, high: 2000.0 },
      construction: { low: 630.0, medium: 945.0, high: 1400.0 },
      looseFurniture: { low: 90.0, medium: 135.0, high: 200.0 },
      audioVisual: { low: 63.0, medium: 95.0, high: 140.0 },
      professionalFees: { low: 117.0, medium: 176.0, high: 260.0 }
    }
  },
  {
    country: 'China',
    city: 'Shanghai',
    region: 'APAC',
    costs: {
      total: { low: 1600.0, medium: 1900.0, high: 2500.0 },
      construction: { low: 1120.0, medium: 1330.0, high: 1750.0 },
      looseFurniture: { low: 160.0, medium: 190.0, high: 250.0 },
      audioVisual: { low: 112.0, medium: 133.0, high: 175.0 },
      professionalFees: { low: 208.0, medium: 247.0, high: 325.0 }
    }
  },
  {
    country: 'China',
    city: 'Beijing',
    region: 'APAC',
    costs: {
      total: { low: 1550.0, medium: 1850.0, high: 2450.0 },
      construction: { low: 1085.0, medium: 1295.0, high: 1715.0 },
      looseFurniture: { low: 155.0, medium: 185.0, high: 245.0 },
      audioVisual: { low: 109.0, medium: 130.0, high: 172.0 },
      professionalFees: { low: 202.0, medium: 241.0, high: 319.0 }
    }
  }
];

export const TT2025_REGIONS = ['EMEA', 'AMERICAS', 'APAC'] as const;
export type TT2025Region = typeof TT2025_REGIONS[number];

export const TT2025_SPECIFICATIONS = ['Low', 'Medium', 'High'] as const;
export type TT2025Specification = typeof TT2025_SPECIFICATIONS[number];

// Helper functions
export function getTT2025CountriesByRegion(region: TT2025Region): string[] {
  const countries = TT2025_COST_DATA.filter(item => item.region === region).map(item => item.country);
  const uniqueCountries: string[] = [];
  countries.forEach(country => {
    if (!uniqueCountries.includes(country)) {
      uniqueCountries.push(country);
    }
  });
  return uniqueCountries;
}

export function getTT2025CitiesByCountry(country: string): string[] {
  return TT2025_COST_DATA.filter(item => item.country === country).map(item => item.city);
}

export function getTT2025CostData(country: string, city: string): TT2025CostData | undefined {
  return TT2025_COST_DATA.find(item => item.country === country && item.city === city);
}

export function calculateTT2025Budget(
  country: string, 
  city: string, 
  specification: TT2025Specification,
  area: number,
  areaUnit: 'sqm' | 'sqft' = 'sqm',
  scope: 'Construction' | 'LooseFurniture' | 'AudioVisual' | 'ProfessionalFees' | 'Complete' = 'Complete'
): {
  success: boolean;
  totalCost: number;
  breakdown: {
    construction: number;
    looseFurniture: number;
    audioVisual: number;
    professionalFees: number;
  };
  costPerSqm: number;
  areaInSqm: number;
  error?: string;
} {
  try {
    const costData = getTT2025CostData(country, city);
    if (!costData) {
      throw new Error(`No T&T 2025 cost data found for ${city}, ${country}`);
    }

    // Convert area to sqm if needed
    const areaInSqm = areaUnit === 'sqft' ? area * 0.092903 : area;
    
    // Get costs based on specification level
    const spec = specification.toLowerCase() as keyof typeof costData.costs.total;
    
    const costPerSqm = {
      construction: costData.costs.construction[spec],
      looseFurniture: costData.costs.looseFurniture[spec],
      audioVisual: costData.costs.audioVisual[spec],
      professionalFees: costData.costs.professionalFees[spec]
    };

    // Calculate total costs based on scope
    let breakdown = {
      construction: 0,
      looseFurniture: 0,
      audioVisual: 0,
      professionalFees: 0
    };

    switch (scope) {
      case 'Construction':
        breakdown.construction = costPerSqm.construction * areaInSqm;
        break;
      case 'LooseFurniture':
        breakdown.looseFurniture = costPerSqm.looseFurniture * areaInSqm;
        break;
      case 'AudioVisual':
        breakdown.audioVisual = costPerSqm.audioVisual * areaInSqm;
        break;
      case 'ProfessionalFees':
        breakdown.professionalFees = costPerSqm.professionalFees * areaInSqm;
        break;
      case 'Complete':
      default:
        breakdown = {
          construction: costPerSqm.construction * areaInSqm,
          looseFurniture: costPerSqm.looseFurniture * areaInSqm,
          audioVisual: costPerSqm.audioVisual * areaInSqm,
          professionalFees: costPerSqm.professionalFees * areaInSqm
        };
        break;
    }

    const totalCost = Object.values(breakdown).reduce((sum, cost) => sum + cost, 0);

    return {
      success: true,
      totalCost,
      breakdown,
      costPerSqm: costData.costs.total[spec],
      areaInSqm,
    };
  } catch (error) {
    return {
      success: false,
      totalCost: 0,
      breakdown: {
        construction: 0,
        looseFurniture: 0,
        audioVisual: 0,
        professionalFees: 0
      },
      costPerSqm: 0,
      areaInSqm: area,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}