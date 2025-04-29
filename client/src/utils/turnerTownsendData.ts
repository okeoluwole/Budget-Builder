// Turner & Townsend ICMS 2024 Data Module
import { type Project } from '@shared/schema';

// Define core types
export type TTRegion = 'Africa' | 'Asia' | 'Australia and New Zealand' | 'Europe' | 'Middle East' | 'North America' | 'South America' | 'UK';
export type TTBuildingType = 'high_rise_prestige' | 'medium_a_grade';
export type TTTenderingCondition = 'Cold' | 'Lukewarm' | 'Warm' | 'Hot' | 'Overheating';
export type TTMarketOutlook = 'Cooler' | 'Staying the same' | 'Warmer';

// Define city data structure
export interface TTCityData {
  country: string;
  region: TTRegion;
  tenderingCondition: TTTenderingCondition;
  marketOutlook: TTMarketOutlook;
  inflation: {
    '2023': number;
    '2024': number;
    '2025': number;
  };
  contractorMargin: number;
  preliminaries: number;
  locationIndex: number; // London = 100
  
  // Office building costs
  buildingCosts: {
    [key in TTBuildingType]: {
      costPerSqFt: number;
      costPerSqM: number;
    }
  };
  
  // Labor costs (USD per hour)
  laborCosts: {
    [key: string]: {
      label: string;
      rate: number;
    }
  };
  
  // Material costs with units
  materialCosts: {
    [key: string]: {
      label: string;
      unit: string;
      cost: number;
    }
  };
  
  // Plant costs
  plantCosts: {
    [key: string]: {
      label: string;
      unit: string;
      cost: number;
    }
  };
}

// Define results types
export interface TTCalculationResult {
  success: boolean;
  baseRate: number;
  adjustedRate: number;
  areaInSqm: number;
  areaInSqft: number;
  totalCost: number;
  breakdownCosts: {
    substructure: number;
    superstructure: number;
    internalFinishes: number;
    fittings: number;
    services: number;
    external: number;
    preliminaries: number;
    contractorMargin: number;
    inflationAdjustment: number;
  };
  error?: string;
}

// Turner & Townsend Data Module
const TurnerTownsendDataModule = {
  // Metadata about the data source
  metadata: {
    source: "Turner & Townsend International Construction Market Survey 2024",
    regions: [
      'Africa', 
      'Asia', 
      'Australia and New Zealand', 
      'Europe', 
      'Middle East', 
      'North America', 
      'South America', 
      'UK'
    ] as TTRegion[],
    buildingTypes: [
      {id: 'high_rise_prestige', label: 'CBD Offices - high-rise prestige', description: 'Premium high-rise office buildings in central business districts'},
      {id: 'medium_a_grade', label: 'CBD Offices - up to 20 floors medium (A-Grade)', description: 'Medium-quality office buildings up to 20 floors in central business districts'}
    ],
    tenderingConditions: ['Cold', 'Lukewarm', 'Warm', 'Hot', 'Overheating'] as TTTenderingCondition[],
    marketOutlooks: ['Cooler', 'Staying the same', 'Warmer'] as TTMarketOutlook[],
    baseDateForPricing: "April 2024"
  },
  
  // Region-to-countries mapping for hierarchical selection
  regionCountryMapping: {
    'Africa': ['South Africa', 'Nigeria', 'Kenya', 'Rwanda', 'Botswana', 'Zimbabwe', 'Uganda'],
    'Asia': ['China', 'Hong Kong', 'India', 'Japan', 'Singapore', 'South Korea', 'Vietnam', 'Malaysia', 'Indonesia', 'Philippines'],
    'Australia and New Zealand': ['Australia', 'New Zealand'],
    'Europe': ['France', 'Germany', 'Italy', 'Spain', 'Netherlands', 'Belgium', 'Sweden', 'Switzerland', 'Ireland', 'Poland', 'Denmark', 'Norway', 'Finland', 'Czech Republic', 'Austria', 'Portugal', 'Greece'],
    'Middle East': ['Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Bahrain', 'Kuwait', 'Oman'],
    'North America': ['United States', 'Canada', 'Mexico'],
    'South America': ['Brazil', 'Argentina', 'Chile', 'Colombia', 'Peru'],
    'UK': ['United Kingdom']
  },
  
  // Country-to-cities mapping for city selection
  countryToCities: {
    'United States': ['New York City', 'Boston', 'Chicago', 'Los Angeles', 'San Francisco', 'Seattle', 'Washington DC', 'Denver', 'Phoenix', 'Atlanta', 'Miami', 'Dallas'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Leeds', 'Bristol', 'Newcastle', 'Belfast'],
    'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide'],
    'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
    'Germany': ['Berlin', 'Munich', 'Frankfurt', 'Hamburg', 'Cologne'],
    'China': ['Beijing', 'Shanghai', 'Hong Kong', 'Shenzhen', 'Guangzhou'],
    'Japan': ['Tokyo', 'Osaka', 'Yokohama', 'Nagoya', 'Fukuoka'],
    'Singapore': ['Singapore'],
    'France': ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'],
    'South Africa': ['Johannesburg', 'Cape Town', 'Durban', 'Pretoria']
    // Add remaining country cities as needed
  },
  
  // Complete market data organized by city
  marketData: {
    'New York City': {
      country: 'United States',
      region: 'North America',
      tenderingCondition: 'Hot',
      marketOutlook: 'Staying the same',
      inflation: {
        '2023': 0.06, // 6.0%
        '2024': 0.035, // 3.5%
        '2025': 0.035 // 3.5%
      },
      contractorMargin: 0.05, // 5.0%
      preliminaries: 0.10, // 10.0%
      locationIndex: 127.9, // London = 100
      
      // Office building costs in both measurement units
      buildingCosts: {
        'high_rise_prestige': {
          costPerSqFt: 991,
          costPerSqM: 10660
        },
        'medium_a_grade': {
          costPerSqFt: 758,
          costPerSqM: 8152
        }
      },
      
      // Labor costs (USD per hour)
      laborCosts: {
        'plumber_electrician': { label: 'Group 1 Tradesman (e.g. plumber/electrician)', rate: 178 },
        'carpenter_bricklayer': { label: 'Group 2 Tradesman (e.g. carpenter/bricklayer)', rate: 150 },
        'tiler_plasterer': { label: 'Group 3 Tradesman (e.g. carpet layer, tiler, plasterer)', rate: 150 },
        'green_collar': { label: 'Group 4 Green collar installation operative', rate: 175 },
        'general_laborer': { label: 'General laborer', rate: 105 },
        'site_foreman': { label: 'Site foreman', rate: 175 }
      },
      
      // Key material costs with units
      materialCosts: {
        'plasterboard': { label: '13 mm plasterboard', unit: 'm²', cost: 6 },
        'concrete': { label: 'Concrete 30 MPa', unit: 'm³ (1500m³ job)', cost: 211 },
        'concrete_block': { label: 'Concrete block (400x200)', unit: 'per 1000 (>10,000 block job)', cost: 2400 },
        'copper_cable': { label: 'Copper cable (3C + E, 2.5mm PVC)', unit: 'metre (100,000m+ job)', cost: 8 },
        'reinforcement_bar': { label: 'Reinforcement bar 16mm', unit: 'tonne (120 tonne job)', cost: 2300 }
      },
      
      // Plant costs
      plantCosts: {
        'mobile_crane': { label: 'Hire 50t mobile crane + operator', unit: 'day', cost: 5245 }
      }
    },
    'London': {
      country: 'United Kingdom',
      region: 'UK',
      tenderingCondition: 'Warm',
      marketOutlook: 'Staying the same',
      inflation: {
        '2023': 0.045, // 4.5%
        '2024': 0.030, // 3.0%
        '2025': 0.025 // 2.5%
      },
      contractorMargin: 0.05, // 5.0%
      preliminaries: 0.12, // 12.0%
      locationIndex: 100, // London = 100
      
      buildingCosts: {
        'high_rise_prestige': {
          costPerSqFt: 840,
          costPerSqM: 9038
        },
        'medium_a_grade': {
          costPerSqFt: 621,
          costPerSqM: 6684
        }
      },
      
      laborCosts: {
        'plumber_electrician': { label: 'Group 1 Tradesman (e.g. plumber/electrician)', rate: 80 },
        'carpenter_bricklayer': { label: 'Group 2 Tradesman (e.g. carpenter/bricklayer)', rate: 70 },
        'tiler_plasterer': { label: 'Group 3 Tradesman (e.g. carpet layer, tiler, plasterer)', rate: 60 },
        'green_collar': { label: 'Group 4 Green collar installation operative', rate: 75 },
        'general_laborer': { label: 'General laborer', rate: 50 },
        'site_foreman': { label: 'Site foreman', rate: 90 }
      },
      
      materialCosts: {
        'plasterboard': { label: '13 mm plasterboard', unit: 'm²', cost: 5 },
        'concrete': { label: 'Concrete 30 MPa', unit: 'm³ (1500m³ job)', cost: 180 },
        'concrete_block': { label: 'Concrete block (400x200)', unit: 'per 1000 (>10,000 block job)', cost: 2100 },
        'copper_cable': { label: 'Copper cable (3C + E, 2.5mm PVC)', unit: 'metre (100,000m+ job)', cost: 7 },
        'reinforcement_bar': { label: 'Reinforcement bar 16mm', unit: 'tonne (120 tonne job)', cost: 2000 }
      },
      
      plantCosts: {
        'mobile_crane': { label: 'Hire 50t mobile crane + operator', unit: 'day', cost: 4200 }
      }
    },
    'Singapore': {
      country: 'Singapore',
      region: 'Asia',
      tenderingCondition: 'Warm',
      marketOutlook: 'Warmer',
      inflation: {
        '2023': 0.050, // 5.0%
        '2024': 0.040, // 4.0%
        '2025': 0.035 // 3.5%
      },
      contractorMargin: 0.08, // 8.0%
      preliminaries: 0.11, // 11.0%
      locationIndex: 85.5, // London = 100
      
      buildingCosts: {
        'high_rise_prestige': {
          costPerSqFt: 712,
          costPerSqM: 7663
        },
        'medium_a_grade': {
          costPerSqFt: 535,
          costPerSqM: 5756
        }
      },
      
      laborCosts: {
        'plumber_electrician': { label: 'Group 1 Tradesman (e.g. plumber/electrician)', rate: 70 },
        'carpenter_bricklayer': { label: 'Group 2 Tradesman (e.g. carpenter/bricklayer)', rate: 60 },
        'tiler_plasterer': { label: 'Group 3 Tradesman (e.g. carpet layer, tiler, plasterer)', rate: 55 },
        'green_collar': { label: 'Group 4 Green collar installation operative', rate: 65 },
        'general_laborer': { label: 'General laborer', rate: 40 },
        'site_foreman': { label: 'Site foreman', rate: 80 }
      },
      
      materialCosts: {
        'plasterboard': { label: '13 mm plasterboard', unit: 'm²', cost: 4 },
        'concrete': { label: 'Concrete 30 MPa', unit: 'm³ (1500m³ job)', cost: 170 },
        'concrete_block': { label: 'Concrete block (400x200)', unit: 'per 1000 (>10,000 block job)', cost: 1900 },
        'copper_cable': { label: 'Copper cable (3C + E, 2.5mm PVC)', unit: 'metre (100,000m+ job)', cost: 6 },
        'reinforcement_bar': { label: 'Reinforcement bar 16mm', unit: 'tonne (120 tonne job)', cost: 1800 }
      },
      
      plantCosts: {
        'mobile_crane': { label: 'Hire 50t mobile crane + operator', unit: 'day', cost: 3800 }
      }
    }
  },
  
  // Utility functions for data access and manipulation
  getRegions() {
    return this.metadata.regions;
  },
  
  getCountriesInRegion(region: TTRegion) {
    return this.regionCountryMapping[region] || [];
  },
  
  getCitiesInCountry(country: string) {
    return this.countryToCities[country] || [];
  },
  
  getCityData(city: string): TTCityData | undefined {
    return this.marketData[city as keyof typeof this.marketData];
  },
  
  getBuildingTypes() {
    return this.metadata.buildingTypes;
  },
  
  getBuildingCost(city: string, buildingType: TTBuildingType, areaUnit = 'sqm') {
    const cityData = this.getCityData(city);
    if (!cityData) return null;
    
    const costs = cityData.buildingCosts[buildingType];
    if (!costs) return null;
    
    return areaUnit.toLowerCase() === 'sqm' ? costs.costPerSqM : costs.costPerSqFt;
  },
  
  // Budget calculation function
  calculateBudget(
    project: Project, 
    buildingType: TTBuildingType,
    applyInflation = true
  ): TTCalculationResult {
    try {
      console.log("T&T Budget Calculation: Starting calculation...");
      
      // Ensure we have valid data for the selected city
      const cityData = this.getCityData(project.city);
      if (!cityData) {
        console.error(`No data found for city: ${project.city}`);
        return {
          success: false,
          baseRate: 0,
          adjustedRate: 0,
          areaInSqm: 0,
          areaInSqft: 0,
          totalCost: 0,
          breakdownCosts: {
            substructure: 0,
            superstructure: 0,
            internalFinishes: 0,
            fittings: 0,
            services: 0,
            external: 0,
            preliminaries: 0,
            contractorMargin: 0,
            inflationAdjustment: 0
          },
          error: `No data found for city: ${project.city}`
        };
      }
      
      // Get the appropriate base rate based on building type and area unit
      const buildingCostData = cityData.buildingCosts[buildingType];
      if (!buildingCostData) {
        console.error(`No cost data found for building type: ${buildingType}`);
        return {
          success: false,
          baseRate: 0,
          adjustedRate: 0,
          areaInSqm: 0,
          areaInSqft: 0,
          totalCost: 0,
          breakdownCosts: {
            substructure: 0,
            superstructure: 0,
            internalFinishes: 0,
            fittings: 0,
            services: 0,
            external: 0,
            preliminaries: 0,
            contractorMargin: 0,
            inflationAdjustment: 0
          },
          error: `No cost data found for building type: ${buildingType}`
        };
      }
      
      // Determine the base rate based on the project's area unit
      const baseRate = project.areaUnit === 'sqm' 
        ? buildingCostData.costPerSqM 
        : buildingCostData.costPerSqFt;
        
      console.log(`Base rate: ${baseRate} USD per ${project.areaUnit}`);
      
      // Convert area to both units for reporting
      let areaInSqm = project.totalArea;
      let areaInSqft = project.totalArea;
      
      if (project.areaUnit === 'sqm') {
        areaInSqft = areaInSqm * 10.764; // Convert sqm to sqft
      } else {
        areaInSqm = areaInSqft / 10.764; // Convert sqft to sqm
      }
      
      // Calculate base cost
      const baseCost = baseRate * project.totalArea;
      console.log(`Base cost: ${baseCost} USD`);
      
      // Apply preliminaries
      const withPreliminaries = baseCost * (1 + cityData.preliminaries);
      console.log(`After preliminaries (${cityData.preliminaries * 100}%): ${withPreliminaries} USD`);
      
      // Apply contractor margin
      const withMargin = withPreliminaries * (1 + cityData.contractorMargin);
      console.log(`After contractor margin (${cityData.contractorMargin * 100}%): ${withMargin} USD`);
      
      // Apply inflation if requested
      let totalCost = withMargin;
      let inflationAdjustment = 0;
      
      if (applyInflation) {
        // Use project inflation if specified, otherwise use city data
        const inflationRate = project.inflationRate !== undefined && project.inflationRate > 0
          ? project.inflationRate / 100
          : cityData.inflation['2024'];
          
        inflationAdjustment = totalCost * inflationRate;
        totalCost += inflationAdjustment;
        console.log(`After inflation (${inflationRate * 100}%): ${totalCost} USD`);
      }
      
      // Calculate breakdown values based on typical percentages for office buildings
      // These percentages are approximations based on the ICMS structure
      const breakdownCosts = {
        substructure: totalCost * 0.08, // 8% for substructure
        superstructure: totalCost * 0.30, // 30% for superstructure
        internalFinishes: totalCost * 0.15, // 15% for internal finishes
        fittings: totalCost * 0.05, // 5% for fittings
        services: totalCost * 0.25, // 25% for services (MEP)
        external: totalCost * 0.05, // 5% for external works
        preliminaries: baseCost * cityData.preliminaries, // Preliminaries
        contractorMargin: withPreliminaries * cityData.contractorMargin, // Contractor's margin
        inflationAdjustment: inflationAdjustment // Inflation adjustment
      };
      
      // Calculate adjusted rate (per unit area)
      const adjustedRate = totalCost / project.totalArea;
      
      return {
        success: true,
        baseRate,
        adjustedRate,
        areaInSqm,
        areaInSqft,
        totalCost,
        breakdownCosts
      };
    } catch (error) {
      console.error("T&T Budget Calculation Error:", error);
      return {
        success: false,
        baseRate: 0,
        adjustedRate: 0,
        areaInSqm: 0,
        areaInSqft: 0,
        totalCost: 0,
        breakdownCosts: {
          substructure: 0,
          superstructure: 0,
          internalFinishes: 0,
          fittings: 0,
          services: 0,
          external: 0,
          preliminaries: 0,
          contractorMargin: 0,
          inflationAdjustment: 0
        },
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
};

export default TurnerTownsendDataModule;