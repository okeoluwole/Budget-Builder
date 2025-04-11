import fs from 'fs';
import path from 'path';
import { FitoutCostData, SpecificationData, BudgetCategory } from '@shared/schema';

// Create initial data files
export function initializeDataFiles() {
  const dataDir = path.join(process.cwd(), 'data');
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Initialize fitout costs data if not exists
  const fitoutCostsPath = path.join(dataDir, 'fitout_costs.json');
  if (!fs.existsSync(fitoutCostsPath)) {
    createFitoutCostsData(fitoutCostsPath);
  }

  // Initialize specifications data if not exists
  const specificationsPath = path.join(dataDir, 'specifications.json');
  if (!fs.existsSync(specificationsPath)) {
    createSpecificationsData(specificationsPath);
  }

  // Initialize layout templates data if not exists
  const layoutTemplatesPath = path.join(dataDir, 'layout_templates.json');
  if (!fs.existsSync(layoutTemplatesPath)) {
    createLayoutTemplatesData(layoutTemplatesPath);
  }

  // Initialize budget template structure if not exists
  const budgetTemplatePath = path.join(dataDir, 'budget_template_structure.json');
  if (!fs.existsSync(budgetTemplatePath)) {
    createBudgetTemplateStructure(budgetTemplatePath);
  }
}

function createFitoutCostsData(filePath: string) {
  const fitoutData: FitoutCostData[] = [
    {
      country: "United Kingdom",
      city: "London",
      region: "EMEA",
      costs: {
        sqm: {
          Activity: {
            Low: 1200,
            Medium: 1500,
            High: 1800
          },
          Team: {
            Low: 1100,
            Medium: 1400,
            High: 1700
          },
          Event: {
            Low: 1300,
            Medium: 1600,
            High: 1900
          }
        },
        sqft: {
          Activity: {
            Low: 111.5,
            Medium: 139.4,
            High: 167.2
          },
          Team: {
            Low: 102.2,
            Medium: 130.1,
            High: 157.9
          },
          Event: {
            Low: 120.8,
            Medium: 148.6,
            High: 176.5
          }
        }
      },
      locationFactors: {
        EMEA: 1.2,
        AMERICA: 1.0,
        APAC: 0.9
      }
    },
    {
      country: "United Kingdom",
      city: "Manchester",
      region: "EMEA",
      costs: {
        sqm: {
          Activity: {
            Low: 900,
            Medium: 1200,
            High: 1500
          },
          Team: {
            Low: 850,
            Medium: 1150,
            High: 1450
          },
          Event: {
            Low: 950,
            Medium: 1250,
            High: 1550
          }
        },
        sqft: {
          Activity: {
            Low: 83.6,
            Medium: 111.5,
            High: 139.4
          },
          Team: {
            Low: 79.0,
            Medium: 106.8,
            High: 134.7
          },
          Event: {
            Low: 88.3,
            Medium: 116.1,
            High: 144.0
          }
        }
      },
      locationFactors: {
        EMEA: 1.0,
        AMERICA: 0.9,
        APAC: 0.8
      }
    },
    {
      country: "United States",
      city: "New York",
      region: "AMERICA",
      costs: {
        sqm: {
          Activity: {
            Low: 1500,
            Medium: 1800,
            High: 2100
          },
          Team: {
            Low: 1400,
            Medium: 1700,
            High: 2000
          },
          Event: {
            Low: 1600,
            Medium: 1900,
            High: 2200
          }
        },
        sqft: {
          Activity: {
            Low: 139.4,
            Medium: 167.2,
            High: 195.1
          },
          Team: {
            Low: 130.1,
            Medium: 157.9,
            High: 185.8
          },
          Event: {
            Low: 148.6,
            Medium: 176.5,
            High: 204.4
          }
        }
      },
      locationFactors: {
        EMEA: 1.1,
        AMERICA: 1.3,
        APAC: 1.0
      }
    },
    {
      country: "United States",
      city: "Chicago",
      region: "AMERICA",
      costs: {
        sqm: {
          Activity: {
            Low: 1200,
            Medium: 1500,
            High: 1800
          },
          Team: {
            Low: 1100,
            Medium: 1400,
            High: 1700
          },
          Event: {
            Low: 1300,
            Medium: 1600,
            High: 1900
          }
        },
        sqft: {
          Activity: {
            Low: 111.5,
            Medium: 139.4,
            High: 167.2
          },
          Team: {
            Low: 102.2,
            Medium: 130.1,
            High: 157.9
          },
          Event: {
            Low: 120.8,
            Medium: 148.6,
            High: 176.5
          }
        }
      },
      locationFactors: {
        EMEA: 1.0,
        AMERICA: 1.1,
        APAC: 0.9
      }
    },
    {
      country: "Australia",
      city: "Sydney",
      region: "APAC",
      costs: {
        sqm: {
          Activity: {
            Low: 1100,
            Medium: 1400,
            High: 1700
          },
          Team: {
            Low: 1000,
            Medium: 1300,
            High: 1600
          },
          Event: {
            Low: 1200,
            Medium: 1500,
            High: 1800
          }
        },
        sqft: {
          Activity: {
            Low: 102.2,
            Medium: 130.1,
            High: 157.9
          },
          Team: {
            Low: 92.9,
            Medium: 120.8,
            High: 148.6
          },
          Event: {
            Low: 111.5,
            Medium: 139.4,
            High: 167.2
          }
        }
      },
      locationFactors: {
        EMEA: 0.9,
        AMERICA: 0.8,
        APAC: 1.1
      }
    },
    {
      country: "Australia",
      city: "Melbourne",
      region: "APAC",
      costs: {
        sqm: {
          Activity: {
            Low: 1000,
            Medium: 1300,
            High: 1600
          },
          Team: {
            Low: 950,
            Medium: 1250,
            High: 1550
          },
          Event: {
            Low: 1100,
            Medium: 1400,
            High: 1700
          }
        },
        sqft: {
          Activity: {
            Low: 92.9,
            Medium: 120.8,
            High: 148.6
          },
          Team: {
            Low: 88.3,
            Medium: 116.1,
            High: 144.0
          },
          Event: {
            Low: 102.2,
            Medium: 130.1,
            High: 157.9
          }
        }
      },
      locationFactors: {
        EMEA: 0.9,
        AMERICA: 0.8,
        APAC: 1.0
      }
    },
    {
      country: "Germany",
      city: "Berlin",
      region: "EMEA",
      costs: {
        sqm: {
          Activity: {
            Low: 1100,
            Medium: 1400,
            High: 1700
          },
          Team: {
            Low: 1050,
            Medium: 1350,
            High: 1650
          },
          Event: {
            Low: 1150,
            Medium: 1450,
            High: 1750
          }
        },
        sqft: {
          Activity: {
            Low: 102.2,
            Medium: 130.1,
            High: 157.9
          },
          Team: {
            Low: 97.5,
            Medium: 125.4,
            High: 153.3
          },
          Event: {
            Low: 106.8,
            Medium: 134.7,
            High: 162.6
          }
        }
      },
      locationFactors: {
        EMEA: 1.1,
        AMERICA: 0.9,
        APAC: 0.8
      }
    },
    {
      country: "France",
      city: "Paris",
      region: "EMEA",
      costs: {
        sqm: {
          Activity: {
            Low: 1300,
            Medium: 1600,
            High: 1900
          },
          Team: {
            Low: 1250,
            Medium: 1550,
            High: 1850
          },
          Event: {
            Low: 1350,
            Medium: 1650,
            High: 1950
          }
        },
        sqft: {
          Activity: {
            Low: 120.8,
            Medium: 148.6,
            High: 176.5
          },
          Team: {
            Low: 116.1,
            Medium: 144.0,
            High: 171.9
          },
          Event: {
            Low: 125.4,
            Medium: 153.3,
            High: 181.2
          }
        }
      },
      locationFactors: {
        EMEA: 1.2,
        AMERICA: 1.0,
        APAC: 0.9
      }
    }
  ];

  fs.writeFileSync(filePath, JSON.stringify(fitoutData, null, 2));
}

function createSpecificationsData(filePath: string) {
  const specifications: SpecificationData[] = [
    {
      name: 'Bronze',
      description: "Standard specification with potential for future customization",
      walls: "Painted walls with minimal branding",
      partitions: {
        type: "Single glazed",
        acousticRating: "38dB Rw",
        costFactor: 1.0
      },
      flooring: "Standard carpet tiles",
      ceiling: "Same as rest of office, minimal modifications",
      furniture: {
        desks: "Fixed desks",
        chairs: "Steelcase Series 1 or equivalent",
        storage: "Basic storage solutions"
      },
      technology: {
        av: "Basic AV with audio conferencing",
        security: "Standard security features"
      },
      fittings: "Basic fittings and finishes",
      recommendedFor: "Standard office spaces with budget constraints"
    },
    {
      name: 'Silver',
      description: "Budget-conscious upgrade with more features and higher-grade materials",
      walls: "Feature walls with special finishes",
      partitions: {
        type: "Double glazed",
        acousticRating: "45dB Rw",
        costFactor: 1.4
      },
      flooring: "Upgraded options, timber/LVT in specific areas",
      ceiling: "Feature ceiling elements",
      furniture: {
        desks: "Mix of static and height-adjustable desks",
        chairs: "Mid-tier with better fabrics",
        storage: "Enhanced storage solutions"
      },
      technology: {
        av: "Enhanced AV throughout with video conferencing",
        security: "Enhanced security features"
      },
      fittings: "Higher quality fittings and finishes",
      recommendedFor: "Enhanced office environments requiring more customization"
    },
    {
      name: 'Gold',
      description: "Agile, personalized, high-tech with premium finishes",
      walls: "Feature wall concepts throughout, extensive branding",
      partitions: {
        type: "Double glazed with high performance",
        acousticRating: "50dB Rw",
        costFactor: 1.8
      },
      flooring: "High-specification (ceramic, porcelain)",
      ceiling: "Comprehensive feature ceiling concepts",
      furniture: {
        desks: "Full sit-stand provision",
        chairs: "Premium ergonomic options",
        storage: "Premium storage solutions"
      },
      technology: {
        av: "Premium AV throughout with integrated systems",
        security: "Advanced security features"
      },
      fittings: "Premium fittings and finishes",
      recommendedFor: "Premium office environments requiring extensive customization"
    }
  ];

  fs.writeFileSync(filePath, JSON.stringify(specifications, null, 2));
}

function createLayoutTemplatesData(filePath: string) {
  const layoutTemplates = [
    {
      name: 'Activity',
      description: 'Spaces designed around activities',
      benefits: [
        'Varied work settings for different tasks',
        'Focus areas, collaboration zones',
        'Supports dynamic work patterns'
      ],
      spaceTypes: [
        {
          name: 'Focus Area',
          description: 'Quiet spaces for concentrated work',
          minPercentage: 20,
          maxPercentage: 40,
          defaultPercentage: 30
        },
        {
          name: 'Collaboration Area',
          description: 'Open spaces for team collaboration',
          minPercentage: 20,
          maxPercentage: 40,
          defaultPercentage: 30
        },
        {
          name: 'Meeting Rooms',
          description: 'Enclosed spaces for meetings',
          minPercentage: 15,
          maxPercentage: 30,
          defaultPercentage: 20
        },
        {
          name: 'Social Area',
          description: 'Spaces for social interaction',
          minPercentage: 10,
          maxPercentage: 20,
          defaultPercentage: 15
        },
        {
          name: 'Support/Ancillary',
          description: 'Storage, print areas, etc.',
          minPercentage: 5,
          maxPercentage: 10,
          defaultPercentage: 5
        }
      ]
    },
    {
      name: 'Team',
      description: 'Spaces organized by teams',
      benefits: [
        'Dedicated team neighborhoods',
        'Team meeting areas and project spaces',
        'Supports team identity and cohesion'
      ],
      spaceTypes: [
        {
          name: 'Team Workspace',
          description: 'Dedicated spaces for teams',
          minPercentage: 40,
          maxPercentage: 60,
          defaultPercentage: 50
        },
        {
          name: 'Team Meeting Area',
          description: 'Meeting spaces within team neighborhoods',
          minPercentage: 15,
          maxPercentage: 25,
          defaultPercentage: 20
        },
        {
          name: 'Shared Meeting Rooms',
          description: 'Meeting rooms shared by multiple teams',
          minPercentage: 10,
          maxPercentage: 20,
          defaultPercentage: 15
        },
        {
          name: 'Social Area',
          description: 'Spaces for social interaction',
          minPercentage: 5,
          maxPercentage: 15,
          defaultPercentage: 10
        },
        {
          name: 'Support/Ancillary',
          description: 'Storage, print areas, etc.',
          minPercentage: 5,
          maxPercentage: 10,
          defaultPercentage: 5
        }
      ]
    },
    {
      name: 'Event',
      description: 'Flexible, reconfigurable spaces',
      benefits: [
        'Highly adaptable spaces',
        'Supports events, workshops, training',
        'Movable furniture and partitions'
      ],
      spaceTypes: [
        {
          name: 'Flexible Event Space',
          description: 'Reconfigurable spaces for events',
          minPercentage: 30,
          maxPercentage: 50,
          defaultPercentage: 40
        },
        {
          name: 'Presentation Area',
          description: 'Spaces for presentations and workshops',
          minPercentage: 15,
          maxPercentage: 30,
          defaultPercentage: 20
        },
        {
          name: 'Breakout Areas',
          description: 'Informal spaces for small group discussions',
          minPercentage: 15,
          maxPercentage: 25,
          defaultPercentage: 20
        },
        {
          name: 'Support Space',
          description: 'AV equipment, storage, etc.',
          minPercentage: 10,
          maxPercentage: 20,
          defaultPercentage: 15
        },
        {
          name: 'Ancillary Space',
          description: 'Restrooms, circulation, etc.',
          minPercentage: 5,
          maxPercentage: 10,
          defaultPercentage: 5
        }
      ]
    }
  ];

  fs.writeFileSync(filePath, JSON.stringify(layoutTemplates, null, 2));
}

function createBudgetTemplateStructure(filePath: string) {
  const budgetTemplateStructure: BudgetCategory[] = [
    {
      name: "CONSTRUCTION COSTS",
      subcategories: [
        {
          name: "Demolition & Strip Out",
          lineItems: [
            { name: "Demolition of existing partitions", defaultFactor: 1.0 },
            { name: "Strip out of existing flooring", defaultFactor: 1.0 },
            { name: "Strip out of existing ceilings", defaultFactor: 1.0 },
            { name: "Removal of existing services", defaultFactor: 1.0 }
          ]
        },
        {
          name: "Partitioning & Glazing",
          lineItems: [
            { name: "Solid partitions", defaultFactor: 1.0 },
            { name: "Single glazed partitions", defaultFactor: 1.0 },
            { name: "Double glazed partitions", defaultFactor: 1.4 },
            { name: "Doors", defaultFactor: 1.0 }
          ]
        },
        {
          name: "Ceilings & Bulkheads",
          lineItems: [
            { name: "Standard ceiling grid", defaultFactor: 1.0 },
            { name: "Feature ceilings", defaultFactor: 1.5 },
            { name: "Bulkheads", defaultFactor: 1.2 }
          ]
        },
        {
          name: "Flooring",
          lineItems: [
            { name: "Carpet tiles", defaultFactor: 1.0 },
            { name: "Timber/LVT flooring", defaultFactor: 1.4 },
            { name: "Ceramic/porcelain tiles", defaultFactor: 1.8 },
            { name: "Raised access flooring", defaultFactor: 1.5 }
          ]
        },
        {
          name: "Wall Finishes",
          lineItems: [
            { name: "Standard paint", defaultFactor: 1.0 },
            { name: "Feature paint", defaultFactor: 1.2 },
            { name: "Wallcoverings", defaultFactor: 1.5 },
            { name: "Branding elements", defaultFactor: 1.4 }
          ]
        }
      ]
    },
    {
      name: "MECHANICAL & ELECTRICAL",
      subcategories: [
        {
          name: "Electrical Services",
          lineItems: [
            { name: "General power", defaultFactor: 1.0 },
            { name: "Lighting", defaultFactor: 1.0 },
            { name: "Emergency lighting", defaultFactor: 1.0 },
            { name: "Feature lighting", defaultFactor: 1.5 }
          ]
        },
        {
          name: "HVAC",
          lineItems: [
            { name: "Modifications to existing", defaultFactor: 1.0 },
            { name: "New system installation", defaultFactor: 1.8 },
            { name: "Zoning controls", defaultFactor: 1.3 }
          ]
        },
        {
          name: "Plumbing",
          lineItems: [
            { name: "Pantry/kitchen facilities", defaultFactor: 1.4 },
            { name: "Toilet facilities", defaultFactor: 1.5 },
            { name: "Water points", defaultFactor: 1.0 }
          ]
        },
        {
          name: "Fire Protection",
          lineItems: [
            { name: "Modifications to sprinklers", defaultFactor: 1.0 },
            { name: "Fire alarm", defaultFactor: 1.0 },
            { name: "Fire signage", defaultFactor: 1.0 }
          ]
        }
      ]
    },
    {
      name: "FURNITURE & EQUIPMENT",
      subcategories: [
        {
          name: "Workstations",
          lineItems: [
            { name: "Fixed height desks", defaultFactor: 1.0 },
            { name: "Height adjustable desks", defaultFactor: 1.5 },
            { name: "Bench desking", defaultFactor: 1.2 }
          ]
        },
        {
          name: "Seating",
          lineItems: [
            { name: "Task chairs", defaultFactor: 1.0 },
            { name: "Meeting chairs", defaultFactor: 1.0 },
            { name: "Soft seating", defaultFactor: 1.4 }
          ]
        },
        {
          name: "Storage",
          lineItems: [
            { name: "Pedestals", defaultFactor: 1.0 },
            { name: "Tall storage", defaultFactor: 1.2 },
            { name: "Lockers", defaultFactor: 1.3 }
          ]
        },
        {
          name: "Meeting Room Furniture",
          lineItems: [
            { name: "Meeting tables", defaultFactor: 1.0 },
            { name: "Collaboration furniture", defaultFactor: 1.4 },
            { name: "Training room furniture", defaultFactor: 1.2 }
          ]
        }
      ]
    },
    {
      name: "TECHNOLOGY",
      subcategories: [
        {
          name: "AV Equipment",
          lineItems: [
            { name: "Screens/displays", defaultFactor: 1.0 },
            { name: "Video conferencing", defaultFactor: 1.5 },
            { name: "Sound systems", defaultFactor: 1.4 },
            { name: "Digital signage", defaultFactor: 1.3 }
          ]
        },
        {
          name: "IT Infrastructure",
          lineItems: [
            { name: "Data cabling", defaultFactor: 1.0 },
            { name: "Wireless access points", defaultFactor: 1.0 },
            { name: "Network equipment", defaultFactor: 1.2 }
          ]
        },
        {
          name: "Security Systems",
          lineItems: [
            { name: "Access control", defaultFactor: 1.0 },
            { name: "CCTV", defaultFactor: 1.3 },
            { name: "Alarm systems", defaultFactor: 1.0 }
          ]
        }
      ]
    },
    {
      name: "PROFESSIONAL FEES",
      subcategories: [
        {
          name: "Design Fees",
          lineItems: [
            { name: "Architectural design", defaultFactor: 1.0 },
            { name: "Interior design", defaultFactor: 1.0 },
            { name: "MEP design", defaultFactor: 1.0 }
          ]
        },
        {
          name: "Project Management",
          lineItems: [
            { name: "PM fees", defaultFactor: 1.0 },
            { name: "Cost consultancy", defaultFactor: 1.0 }
          ]
        },
        {
          name: "Other Consultants",
          lineItems: [
            { name: "Structural engineer", defaultFactor: 1.0 },
            { name: "Acoustic consultant", defaultFactor: 1.0 },
            { name: "IT/AV consultant", defaultFactor: 1.0 }
          ]
        }
      ]
    },
    {
      name: "CONTINGENCY & INFLATION",
      subcategories: [
        {
          name: "Contingency",
          lineItems: [
            { name: "Design contingency", defaultFactor: 1.0 },
            { name: "Construction contingency", defaultFactor: 1.0 }
          ]
        },
        {
          name: "Inflation",
          lineItems: [
            { name: "Inflation adjustment", defaultFactor: 1.0 }
          ]
        }
      ]
    }
  ];

  fs.writeFileSync(filePath, JSON.stringify(budgetTemplateStructure, null, 2));
}
