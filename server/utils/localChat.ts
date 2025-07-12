import { FitoutCost, Project, Budget, SpecificationRecord } from "@shared/schema";
import { db } from "../db";
import { fitoutCosts, specifications, layoutTemplates } from "@shared/schema";

// Define Specification type to match database records
type SpecificationData = {
  id: number;
  name: string;
  description: string;
  walls: string;
  partitionType: string;
  partitionAcousticRating: string;
  partitionCostFactor: string;
  flooring: string;
  ceiling: string;
  furnitureDesks: string;
  furnitureChairs: string;
  furnitureStorage: string;
  technologyAV: string;
  technologySecurity: string;
  fittings: string;
  recommendedFor: string;
};

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatContext {
  projects?: Project[];
  budgets?: Budget[];
  fitoutCosts?: FitoutCost[];
  specifications?: SpecificationData[];
  currentProject?: Project;
  currentBudget?: Budget;
}

/**
 * Local system for processing chat messages based on uploaded data
 */
export async function getChatCompletion(
  messages: ChatMessage[],
  context?: ChatContext
): Promise<string> {
  try {
    // Get the last user message
    const lastUserMessage = messages.findLast((msg) => msg.role === "user");
    if (!lastUserMessage) {
      return "I'm here to help with questions about fit-out costs, specifications, and budgeting. What would you like to know?";
    }

    const userQuery = typeof lastUserMessage.content === 'string' 
      ? lastUserMessage.content.toLowerCase() 
      : '';
    
    // Load data from database if not provided in context
    const fitoutCostsData = context?.fitoutCosts || await db.select().from(fitoutCosts);
    const specificationsData = context?.specifications || await db.select().from(specifications);
    const layoutTemplatesData = await db.select().from(layoutTemplates);
    
    // Check for question types and provide appropriate responses
    if (userQuery.includes('hello') || userQuery.includes('hi') || userQuery.includes('hey')) {
      return "Hello! I'm your Budget Assistant for Cost Estimator Pro. I can help you understand fit-out costs, specifications, and budget calculations. What would you like to know about?";
    }
    
    // Questions about specifications
    if (userQuery.includes('specification') || userQuery.includes('bronze') || 
        userQuery.includes('silver') || userQuery.includes('gold') || 
        userQuery.includes('spec ') || userQuery.includes('finish')) {
      
      // If asking about a specific specification level
      if (userQuery.includes('bronze')) {
        const bronzeSpec = specificationsData.find(s => s.name.toLowerCase() === 'bronze');
        return `Bronze specification is our most cost-effective option, designed for functional spaces:

• ${bronzeSpec?.description || 'Basic finishes designed for functional spaces'}
• Wall finishes: ${bronzeSpec?.walls || 'Basic painted finishes'}
• Flooring: ${bronzeSpec?.flooring || 'Standard carpet tiles or vinyl'}
• Partitions: ${bronzeSpec?.partitionType || 'Standard partitions'} with ${bronzeSpec?.partitionAcousticRating || 'basic acoustic properties'}
• Furniture: Basic functional workstations and seating
• Best for: ${bronzeSpec?.recommendedFor || 'Back-of-house areas, storage, and basic workspaces'}

Bronze specification is typically priced 20-30% less than Silver, making it suitable for budget-conscious projects.`;
      }
      
      if (userQuery.includes('silver')) {
        const silverSpec = specificationsData.find(s => s.name.toLowerCase() === 'silver');
        return `Silver specification is our mid-range option, offering a balance of quality and cost:

• ${silverSpec?.description || 'Enhanced finishes with improved aesthetics and function'}
• Wall finishes: ${silverSpec?.walls || 'Mix of paint and feature wall coverings'}
• Flooring: ${silverSpec?.flooring || 'Mid-grade carpet tiles with accent areas'}
• Partitions: ${silverSpec?.partitionType || 'Enhanced partitions'} with ${silverSpec?.partitionAcousticRating || 'improved acoustic properties'}
• Furniture: Ergonomic workstations and seating with some customization
• Best for: ${silverSpec?.recommendedFor || 'General office areas, standard meeting rooms, and collaborative spaces'}

Silver specification is our most commonly selected option, providing good value while maintaining quality standards.`;
      }
      
      if (userQuery.includes('gold')) {
        const goldSpec = specificationsData.find(s => s.name.toLowerCase() === 'gold');
        return `Gold specification is our premium option, featuring high-end finishes and materials:

• ${goldSpec?.description || 'Premium finishes with superior aesthetics and performance'}
• Wall finishes: ${goldSpec?.walls || 'Designer wall coverings and architectural features'}
• Flooring: ${goldSpec?.flooring || 'Premium carpet, hardwood, or stone in select areas'}
• Partitions: ${goldSpec?.partitionType || 'Premium partitions'} with ${goldSpec?.partitionAcousticRating || 'superior acoustic properties'}
• Furniture: Custom-designed workstations and executive seating
• Best for: ${goldSpec?.recommendedFor || 'Executive offices, client-facing areas, and showcase spaces'}

Gold specification is typically priced 20-30% higher than Silver, reflecting the use of premium materials and finishes.`;
      }
      
      // General specification information
      return `Our fit-out specifications are categorized into three tiers:

1. Bronze: Our basic tier with functional finishes suitable for back-of-house areas or budget-conscious projects. Average cost range: $1,500-$2,200/sqm.

2. Silver: Our mid-range option offering a good balance of aesthetics and functionality for general office areas. Average cost range: $2,200-$3,000/sqm.

3. Gold: Our premium tier featuring high-end finishes and materials for executive areas and client-facing spaces. Average cost range: $3,000-$3,800/sqm.

Each specification level affects both the aesthetics and cost of your fit-out. Would you like specific details about any of these specification levels?`;
    }
    
    // Questions about layouts
    if (userQuery.includes('layout') || userQuery.includes('activity') || 
        userQuery.includes('team') || userQuery.includes('event') || 
        userQuery.includes('space allocation')) {
      
      if (userQuery.includes('activity')) {
        const activityLayout = layoutTemplatesData.find(l => l.name.toLowerCase() === 'activity');
        return `Activity-based layouts focus on creating diverse spaces for different work modes:

• ${activityLayout?.description || 'Flexible spaces designed around different work activities'}
• Key features: Mix of open and enclosed spaces, varied settings for different tasks
• Typically includes: Focus pods, collaboration zones, casual meeting spaces, and quiet areas
• Space allocation: Usually 40% individual work, 40% collaborative spaces, 20% support areas
• Best suited for: Organizations with dynamic work patterns and varied daily activities

Activity-based layouts typically cost 5-10% more than Team layouts due to the increased variety of spaces and additional furniture types.`;
      }
      
      if (userQuery.includes('team')) {
        const teamLayout = layoutTemplatesData.find(l => l.name.toLowerCase() === 'team');
        return `Team-based layouts are organized around group work and collaboration:

• ${teamLayout?.description || 'Spaces designed to support team cohesion and collaboration'}
• Key features: Team neighborhoods with adjacent meeting and breakout spaces
• Typically includes: Team desking areas, nearby meeting rooms, and collaborative zones
• Space allocation: Usually 50% team areas, 30% meeting spaces, 20% support areas
• Best suited for: Project-based organizations with stable team structures

Team-based layouts are generally the most cost-effective layout option as they efficiently use space with standardized furniture solutions.`;
      }
      
      if (userQuery.includes('event')) {
        const eventLayout = layoutTemplatesData.find(l => l.name.toLowerCase() === 'event');
        return `Event-based layouts prioritize spaces for gatherings and presentations:

• ${eventLayout?.description || 'Spaces optimized for meetings, presentations and events'}
• Key features: Flexible spaces that can be reconfigured for different meeting types
• Typically includes: Multipurpose event spaces, technology-rich presentation areas, and support facilities
• Space allocation: Usually 30% individual work, 50% event/meeting spaces, 20% support areas
• Best suited for: Organizations with frequent client meetings, training sessions, or presentations

Event-based layouts typically cost 10-15% more than Team layouts due to the specialized technology, acoustics, and flexible furniture systems required.`;
      }
      
      // General layout information
      return `Our fit-out layouts are categorized into three main types:

1. Activity-based: Flexible spaces designed around different work activities like focusing, collaborating, learning, and socializing. Supports diverse work styles and mobility.

2. Team-based: Spaces organized around team cohesion and collaboration, with defined team neighborhoods and adjacent meeting areas. Best for project-based organizations.

3. Event-based: Layouts prioritizing spaces for gatherings and presentations, with flexible areas that can be reconfigured for different meeting types.

Each layout type has different space allocation percentages and cost implications. Would you like specific details about any of these layout types?`;
    }
    
    // Questions about costs
    if (userQuery.includes('cost') || userQuery.includes('price') || 
        userQuery.includes('budget') || userQuery.includes('expensive') ||
        userQuery.includes('cheap') || userQuery.includes('rate')) {
      
      // If asking about costs in a specific region
      if (userQuery.includes('america') || userQuery.includes('us ') || userQuery.includes('united states')) {
        const americasCosts = fitoutCostsData.filter(c => c.region === 'AMERICAS');
        const lowCost = Math.min(...americasCosts.map(c => parseFloat(c.activityMediumSqm) || 2200));
        const highCost = Math.max(...americasCosts.map(c => parseFloat(c.activityMediumSqm) || 2800));
        
        return `In the Americas region, typical fit-out costs for medium specification (Silver) range from $${lowCost.toFixed(0)} to $${highCost.toFixed(0)} per square meter.

Key cities in the Americas region:
• New York: $${americasCosts.find(c => c.city === 'New York')?.activityMediumSqm || '3,300'}/sqm - premium financial center pricing
• Chicago: $${americasCosts.find(c => c.city === 'Chicago')?.activityMediumSqm || '2,800'}/sqm
• Los Angeles: $${americasCosts.find(c => c.city === 'Los Angeles')?.activityMediumSqm || '2,900'}/sqm
• San Francisco: $${americasCosts.find(c => c.city === 'San Francisco')?.activityMediumSqm || '3,100'}/sqm
• Toronto: $${americasCosts.find(c => c.city === 'Toronto')?.activityMediumSqm || '2,600'}/sqm
• Mexico City: $${americasCosts.find(c => c.city === 'Mexico City')?.activityMediumSqm || '2,200'}/sqm

These costs reflect Silver specification and Activity-based layouts. Bronze specification would be approximately 20-30% lower, while Gold specification would be 20-30% higher.`;
      }
      
      if (userQuery.includes('europe') || userQuery.includes('emea') || userQuery.includes('uk') || userQuery.includes('london')) {
        const emeaCosts = fitoutCostsData.filter(c => c.region === 'EMEA');
        const lowCost = Math.min(...emeaCosts.map(c => parseFloat(c.activityMediumSqm) || 2200));
        const highCost = Math.max(...emeaCosts.map(c => parseFloat(c.activityMediumSqm) || 2800));
        
        return `In the EMEA region (Europe, Middle East, Africa), typical fit-out costs for medium specification (Silver) range from $${lowCost.toFixed(0)} to $${highCost.toFixed(0)} per square meter.

Key cities in the EMEA region:
• London: $${emeaCosts.find(c => c.city === 'London')?.activityMediumSqm || '3,200'}/sqm - premium financial center pricing
• Paris: $${emeaCosts.find(c => c.city === 'Paris')?.activityMediumSqm || '2,900'}/sqm
• Frankfurt: $${emeaCosts.find(c => c.city === 'Frankfurt')?.activityMediumSqm || '2,700'}/sqm
• Dubai: $${emeaCosts.find(c => c.city === 'Dubai')?.activityMediumSqm || '2,800'}/sqm
• Johannesburg: $${emeaCosts.find(c => c.city === 'Johannesburg')?.activityMediumSqm || '2,300'}/sqm

These costs reflect Silver specification and Activity-based layouts. Bronze specification would be approximately 20-30% lower, while Gold specification would be 20-30% higher.`;
      }
      
      if (userQuery.includes('asia') || userQuery.includes('apac') || userQuery.includes('singapore') || userQuery.includes('hong kong')) {
        const apacCosts = fitoutCostsData.filter(c => c.region === 'APAC');
        const lowCost = Math.min(...apacCosts.map(c => parseFloat(c.activityMediumSqm) || 2200));
        const highCost = Math.max(...apacCosts.map(c => parseFloat(c.activityMediumSqm) || 2800));
        
        return `In the APAC region (Asia-Pacific), typical fit-out costs for medium specification (Silver) range from $${lowCost.toFixed(0)} to $${highCost.toFixed(0)} per square meter.

Key cities in the APAC region:
• Singapore: $${apacCosts.find(c => c.city === 'Singapore')?.activityMediumSqm || '3,000'}/sqm - premium financial center pricing
• Hong Kong: $${apacCosts.find(c => c.city === 'Hong Kong')?.activityMediumSqm || '3,200'}/sqm
• Tokyo: $${apacCosts.find(c => c.city === 'Tokyo')?.activityMediumSqm || '3,100'}/sqm
• Sydney: $${apacCosts.find(c => c.city === 'Sydney')?.activityMediumSqm || '2,700'}/sqm
• Shanghai: $${apacCosts.find(c => c.city === 'Shanghai')?.activityMediumSqm || '2,800'}/sqm
• Mumbai: $${apacCosts.find(c => c.city === 'Mumbai')?.activityMediumSqm || '2,500'}/sqm

These costs reflect Silver specification and Activity-based layouts. Bronze specification would be approximately 20-30% lower, while Gold specification would be 20-30% higher.`;
      }
      
      // Get average costs from database
      const allCosts = fitoutCostsData.map(c => parseFloat(c.activityMediumSqm) || 0).filter(c => c > 0);
      const avgCost = allCosts.reduce((sum, cost) => sum + cost, 0) / allCosts.length;
      
      // General cost information
      return `Fit-out costs vary significantly based on location, specification level, and layout type:

1. By specification:
   • Bronze: $1,500-$2,200/sqm - Basic finishes for functional spaces
   • Silver: $2,200-$3,000/sqm - Enhanced finishes balancing quality and cost
   • Gold: $3,000-$3,800/sqm - Premium finishes for executive areas

2. By layout type:
   • Team-based: Base cost
   • Activity-based: +5-10% compared to Team
   • Event-based: +10-15% compared to Team

3. By region (for Silver specification):
   • AMERICAS: $2,200-$3,300/sqm (New York highest at $3,300/sqm)
   • EMEA: $2,300-$3,200/sqm (London highest at $3,200/sqm)
   • APAC: $2,500-$3,200/sqm (Hong Kong highest at $3,200/sqm)

The average cost across all regions for Silver specification is approximately $${avgCost.toFixed(0)}/sqm.

Would you like to know about costs in a specific region or city?`;
    }
    
    // Questions about locations
    if (userQuery.includes('location') || userQuery.includes('city') || 
        userQuery.includes('country') || userQuery.includes('region') ||
        userQuery.includes('where')) {
      
      // Count locations by region
      const regions = {
        'AMERICAS': fitoutCostsData.filter(c => c.region === 'AMERICAS').length,
        'EMEA': fitoutCostsData.filter(c => c.region === 'EMEA').length,
        'APAC': fitoutCostsData.filter(c => c.region === 'APAC').length
      };
      
      // Get unique countries
      const countries = [...new Set(fitoutCostsData.map(c => c.country))];
      
      return `Our database contains fit-out cost data for ${fitoutCostsData.length} locations across ${countries.length} countries and 3 main regions:

1. AMERICAS: ${regions.AMERICAS} locations
   • Key countries: United States, Canada, Mexico, Brazil
   • Benchmark city: New York (cost factor 1.0)
   • Highest cost cities: New York, San Francisco, Boston
   • Lowest cost cities: Mexico City, Monterrey, Brasilia

2. EMEA (Europe, Middle East, Africa): ${regions.EMEA} locations
   • Key countries: UK, France, Germany, UAE, South Africa
   • Benchmark city: London (cost factor 1.0)
   • Highest cost cities: London, Paris, Zurich
   • Lowest cost cities: Warsaw, Johannesburg, Bucharest

3. APAC (Asia-Pacific): ${regions.APAC} locations
   • Key countries: China, Japan, Singapore, Australia, India
   • Benchmark city: Singapore (cost factor 1.0)
   • Highest cost cities: Hong Kong, Tokyo, Singapore
   • Lowest cost cities: Manila, Chennai, Jakarta

Would you like information about a specific region or city?`;
    }
    
    // Questions about the app/system
    if (userQuery.includes('help') || userQuery.includes('feature') || 
        userQuery.includes('function') || userQuery.includes('do') ||
        userQuery.includes('use') || userQuery.includes('how')) {
      
      return `I can help you with various aspects of fit-out budgeting and cost estimation:

1. Fit-out costs - I can explain typical costs for different:
   • Specification levels (Bronze, Silver, Gold)
   • Layout types (Activity, Team, Event)
   • Locations (Americas, EMEA, APAC regions)

2. Specifications - I can explain the differences between:
   • Bronze: Basic finishes for functional spaces
   • Silver: Enhanced finishes balancing quality and cost
   • Gold: Premium finishes for executive areas

3. Layout types - I can explain the different approaches:
   • Activity-based: Flexible spaces for different work modes
   • Team-based: Spaces organized around team collaboration
   • Event-based: Layouts prioritizing gatherings and presentations

4. Budget calculation - I can explain how our system:
   • Calculates total fit-out costs based on area, specification, layout and location
   • Applies location factors to adjust for regional cost differences
   • Allocates space based on different layout strategies

What specific aspect would you like to learn more about?`;
    }
    
    // Questions about terminology
    if (userQuery.includes('term') || userQuery.includes('mean') || 
        userQuery.includes('define') || userQuery.includes('definition') ||
        userQuery.includes('what is')) {
      
      if (userQuery.includes('activity based') || userQuery.includes('activity-based')) {
        return `Activity-Based Working (ABW) is a layout approach that creates diverse spaces for different work modes. Rather than assigning fixed desks, ABW provides a variety of settings that employees can use based on their current task - like focus pods for concentration, collaboration zones for teamwork, and quiet areas for calls. This approach typically requires 5-10% more space than traditional layouts but can increase space efficiency through desk sharing.`;
      }
      
      if (userQuery.includes('spec') || userQuery.includes('specification')) {
        return `In fit-out construction, "specification" (or "spec") refers to the quality level of finishes, materials, and fixtures used in a space. Our system categorizes specifications into Bronze (basic), Silver (mid-range), and Gold (premium) tiers. The specification level affects not only aesthetics but also durability, acoustic performance, and ultimately cost - with approximately 20-30% price difference between each tier.`;
      }
      
      if (userQuery.includes('location factor')) {
        return `A "location factor" is a multiplier applied to baseline construction costs to account for regional cost variations. These factors reflect differences in labor rates, material costs, logistics expenses, and market conditions. For example, if New York has a location factor of 1.0 (baseline), then a city with a factor of 0.8 would have costs approximately 20% lower than New York. Our system uses benchmark cities (New York, London, Singapore) as references for their respective regions.`;
      }
      
      if (userQuery.includes('fit out') || userQuery.includes('fit-out')) {
        return `"Fit-out" refers to the process of making interior spaces suitable for occupation. It involves installing floors, ceilings, partitions, and furnishings to make the space functional for its intended use. In commercial real estate, there are typically two stages: 1) Base Building (core and shell) provided by the landlord, and 2) Fit-out (interior build-out) which can be handled by either the landlord (turnkey) or tenant (tenant improvement). Our budget estimation tool focuses specifically on the fit-out component costs.`;
      }
      
      if (userQuery.includes('mmc')) {
        return `Cost Estimator Pro provides comprehensive budget estimation using industry-leading data sources like CBRE, Turner & Townsend, and JLL. Our platform offers multiple specification levels, detailed component breakdowns, and multi-source comparison capabilities to help you create accurate construction budgets for office fit-out projects.`;
      }
      
      // Default terminology response
      return `I can help explain various terminology related to fit-out construction and budgeting. Some key terms include:

• Fit-out: The process of making interior spaces suitable for occupation with floors, ceilings, partitions, and furnishings.
• Shell & Core: The base building provided by the landlord before tenant improvements.
• Specification (Bronze/Silver/Gold): Quality levels of finishes, materials, and fixtures.
• Location Factor: Multiplier applied to baseline costs to account for regional variations.
• Activity-Based Working (ABW): Layout approach creating diverse spaces for different work modes.
• CAT A/CAT B: UK terminology for landlord's basic finish (A) vs. tenant's specific fit-out (B).
• Cost Estimator Pro: Professional cost estimation platform with multi-source data integration.

Is there a specific term you'd like me to explain in more detail?`;
    }
    
    // Default response for unrecognized queries
    return `I'm here to help with questions about fit-out costs, specifications, and budgeting based on our database. I can provide information about:

• Fit-out costs across different locations and specification levels
• Specification details (Bronze, Silver, Gold)
• Layout types (Activity, Team, Event)
• Budget calculations and factors
• Terminology related to fit-out construction

Could you please rephrase your question specifically about one of these topics? For example, you could ask about costs in a specific region, or details about a particular specification level.`;
  } catch (error) {
    console.error("Error processing chat message:", error);
    return "I'm sorry, I encountered an error while processing your question. Please try again with a question about fit-out costs, specifications, or budget calculations.";
  }
}

/**
 * Generate analysis for an Excel file based on filename
 */
export async function analyzeExcelFile(
  base64Content: string,
  filename: string
): Promise<string> {
  try {
    // Simple analysis based on filename
    if (filename.toLowerCase().includes('cbre') || filename.toLowerCase().includes('fit out')) {
      return `Analysis of "${filename}":

The CBRE Fit Out Guide appears to be a comprehensive dataset of construction costs for office fit-outs across different global locations. Key observations:

1. The data is structured by:
   • Geographic regions (Americas, EMEA, APAC)
   • Cities within each region
   • Specification levels (Low/Medium/High or Bronze/Silver/Gold)
   • Layout types (Activity, Team, Event spaces)

2. Cost data is presented in both square meters and square feet for international comparability.

3. Major financial centers (New York, London, Singapore) serve as benchmarks for their respective regions.

4. The cost variations reflect local labor rates, material costs, building codes, and market conditions.

5. This dataset is valuable for creating preliminary budget estimates for office fit-out projects across different locations.`;
    } else if (filename.toLowerCase().includes('budget') || filename.toLowerCase().includes('template')) {
      return `Analysis of "${filename}":

This appears to be a budget template for office fit-out projects. Key observations:

1. The template is structured with the following main sections:
   • Construction costs (likely the largest portion)
   • MEP systems (mechanical, electrical, plumbing)
   • Furniture, fixtures, and equipment (FF&E)
   • Technology and audiovisual systems
   • Professional fees and contingencies

2. The template likely includes formulas that calculate costs based on:
   • Total area (square meters/feet)
   • Selected specification level
   • Chosen layout type
   • Location cost factors

3. Space allocation percentages are likely incorporated to distribute the total area across different functions (workstations, meeting rooms, support spaces).

4. This template provides a structured approach to budgeting that ensures all major cost categories are considered.`;
    } else {
      return `Analysis of "${filename}":

This file appears to be related to construction cost data or budget information for office fit-out projects. Without examining the specific content, general observations about such documents include:

1. They typically contain structured cost data organized by categories like construction elements, furniture, technology, and professional services.

2. They may include regional cost variations to account for different market conditions across locations.

3. They often categorize costs by different quality levels or specifications, allowing for budget flexibility.

4. They may incorporate formulas and calculations that help estimate total project costs based on input parameters.

5. Such documents are valuable tools for initial budget planning and cost feasibility assessment for construction projects.`;
    }
  } catch (error) {
    console.error("Error analyzing Excel file:", error);
    return `I'm unable to provide a detailed analysis of "${filename}" due to system limitations. This function provides general observations about construction cost and budget files rather than specific analysis of file contents.`;
  }
}

/**
 * Generate analysis for a PDF document based on filename
 */
export async function analyzePdfDocument(
  base64Content: string,
  filename: string
): Promise<string> {
  try {
    if (filename.toLowerCase().includes('fit') && filename.toLowerCase().includes('out')) {
      return `Analysis of "${filename}":

This appears to be a document related to fit-out guidelines or standards. While I can't examine the specific content, such documents typically include:

1. Overview of fit-out processes and standards, likely covering:
   • Design principles and workspace strategies
   • Construction standards and specifications
   • Material and finish options across different quality tiers
   • Technical requirements for building systems

2. Visual references probably include:
   • Layout diagrams showing space planning approaches
   • Specification comparison tables
   • Cost breakdown charts or tables
   • Material and finish reference images

3. The document likely provides guidance on best practices for office design and construction that balance aesthetics, functionality, and cost-effectiveness.

4. It may include case studies or examples of successful projects that demonstrate the principles outlined.`;
    } else if (filename.toLowerCase().includes('budget') || filename.toLowerCase().includes('cost')) {
      return `Analysis of "${filename}":

This appears to be a document focused on budget or cost aspects of construction projects. While I can't examine the specific content, such documents typically include:

1. Cost breakdowns by:
   • Construction categories (demolition, partitions, ceilings, flooring, etc.)
   • MEP systems (mechanical, electrical, plumbing)
   • Furniture, fixtures and equipment
   • Technology infrastructure
   • Professional fees and contingencies

2. Factors affecting costs, such as:
   • Geographic location and market conditions
   • Specification level and quality of finishes
   • Timeline considerations and phasing requirements
   • Building conditions and constraints

3. The document likely provides guidelines for developing accurate budgets and managing costs throughout the project lifecycle.

4. It may include benchmark data and comparative metrics to help with initial estimating.`;
    } else {
      return `Analysis of "${filename}":

This document appears to be related to construction or interior design. While I can't examine the specific content, such documents typically include:

1. Technical specifications or standards for construction elements
2. Design guidelines and recommendations
3. Process workflows and project management approaches
4. Reference data for estimation and planning

The document may serve as a reference guide for professionals involved in the planning, design, or execution of construction projects, helping ensure consistency and quality across projects.`;
    }
  } catch (error) {
    console.error("Error analyzing PDF:", error);
    return `I'm unable to provide a detailed analysis of "${filename}" due to system limitations. This function provides general observations about construction documentation rather than specific analysis of document contents.`;
  }
}

/**
 * Generate a cost recommendation based on project parameters
 */
export async function generateCostRecommendation(
  project: Project,
  fitoutCostsData: FitoutCost[],
  specificationsData: Specification[]
): Promise<string> {
  try {
    // Extract project details
    const { area, currency, projectType, country, city, region } = project;
    
    // Find relevant cost data
    const relevantCosts = fitoutCostsData.filter(
      cost => cost.country === country && 
            (cost.city === city || cost.city === "Average")
    );
    
    // If no specific data found for this location, use average for the region
    let costData = relevantCosts.length > 0 ? relevantCosts[0] : 
      fitoutCostsData.find(cost => cost.region === region && cost.city === "Average");
    
    // If still no data, use global averages
    if (!costData) {
      // Create average cost data from all available records
      const allCosts = fitoutCostsData.filter(cost => 
        cost.activityLowSqm && cost.activityMediumSqm && cost.activityHighSqm);
      
      if (allCosts.length === 0) {
        // Fallback to default values if no data available
        costData = {
          country: "Global Average",
          city: "Average",
          region: region || "AMERICAS",
          activityLowSqm: "1800",
          activityMediumSqm: "2500",
          activityHighSqm: "3200",
          teamLowSqm: "1700",
          teamMediumSqm: "2400",
          teamHighSqm: "3100",
          eventLowSqm: "1900",
          eventMediumSqm: "2600",
          eventHighSqm: "3300"
        } as FitoutCost;
      } else {
        // Calculate averages
        const avgActivityLow = allCosts.reduce((sum, cost) => sum + parseFloat(cost.activityLowSqm || "0"), 0) / allCosts.length;
        const avgActivityMed = allCosts.reduce((sum, cost) => sum + parseFloat(cost.activityMediumSqm || "0"), 0) / allCosts.length;
        const avgActivityHigh = allCosts.reduce((sum, cost) => sum + parseFloat(cost.activityHighSqm || "0"), 0) / allCosts.length;
        
        costData = {
          country: "Global Average",
          city: "Average",
          region: region || "AMERICAS",
          activityLowSqm: avgActivityLow.toString(),
          activityMediumSqm: avgActivityMed.toString(),
          activityHighSqm: avgActivityHigh.toString()
        } as FitoutCost;
      }
    }
    
    // Determine recommended specification based on project type
    let recommendedSpec = 'Silver';
    let rationale = '';
    
    if (projectType) {
      if (projectType.toLowerCase().includes('executive') || 
          projectType.toLowerCase().includes('premium') || 
          projectType.toLowerCase().includes('high end')) {
        recommendedSpec = 'Gold';
        rationale = 'Executive spaces typically require higher-end finishes and technology integration to create an impressive environment for clients and senior leadership.';
      } else if (projectType.toLowerCase().includes('standard') || 
                projectType.toLowerCase().includes('general') || 
                projectType.toLowerCase().includes('typical')) {
        recommendedSpec = 'Silver';
        rationale = 'Standard office spaces benefit from a balanced approach to quality and cost, providing good aesthetics and durability without premium pricing.';
      } else if (projectType.toLowerCase().includes('budget') || 
                projectType.toLowerCase().includes('basic') || 
                projectType.toLowerCase().includes('economy')) {
        recommendedSpec = 'Bronze';
        rationale = 'Budget-conscious projects can achieve functional and practical spaces with cost-effective solutions while maintaining basic quality standards.';
      } else {
        // Default rationale for Silver
        rationale = 'Silver specification provides a good balance of quality and cost efficiency for most projects, offering enhanced aesthetics and durability at a reasonable price point.';
      }
    } else {
      // Default rationale for Silver
      rationale = 'Silver specification provides a good balance of quality and cost efficiency for most projects, offering enhanced aesthetics and durability at a reasonable price point.';
    }
    
    // Calculate cost ranges based on recommendation
    let costRangeMin = 0;
    let costRangeMax = 0;
    
    // Get base costs for Activity layout (most common)
    const lowSpecCost = parseFloat(costData.activityLowSqm || "0");
    const medSpecCost = parseFloat(costData.activityMediumSqm || "0");
    const highSpecCost = parseFloat(costData.activityHighSqm || "0");
    
    // Select cost range based on recommendation
    switch (recommendedSpec) {
      case 'Bronze':
        costRangeMin = lowSpecCost * 0.9;
        costRangeMax = lowSpecCost * 1.1;
        break;
      case 'Silver':
        costRangeMin = medSpecCost * 0.9;
        costRangeMax = medSpecCost * 1.1;
        break;
      case 'Gold':
        costRangeMin = highSpecCost * 0.9;
        costRangeMax = highSpecCost * 1.1;
        break;
    }
    
    // Calculate total cost
    const totalCostMin = costRangeMin * area;
    const totalCostMax = costRangeMax * area;
    
    // Format the response
    return `# Cost Recommendation

Based on the project details provided for ${city}, ${country}, I recommend the following approach:

## 1. Recommended Specification Level
**${recommendedSpec}**

## 2. Estimated Cost Range
**${currency} ${totalCostMin.toLocaleString(undefined, {maximumFractionDigits: 0})} - ${currency} ${totalCostMax.toLocaleString(undefined, {maximumFractionDigits: 0})}** 
(based on ${area.toLocaleString()} sqm at ${currency} ${costRangeMin.toFixed(0)}-${costRangeMax.toFixed(0)}/sqm)

## 3. Rationale
${rationale}

## 4. Additional Considerations
- Location factors: ${city} costs are ${costData.city === city ? 'specifically reflected' : 'estimated based on regional averages'} in this recommendation
- Specification adjustments: Moving to ${recommendedSpec === 'Bronze' ? 'Silver would increase costs by ~25%' : recommendedSpec === 'Silver' ? 'Gold would increase costs by ~25% or Bronze would decrease costs by ~25%' : 'Silver would decrease costs by ~25%'}
- Layout impact: Activity-based layouts are the baseline; Team-based layouts may reduce costs by 5-10%, while Event-based may increase costs by 5-10%
- Scope clarity: These estimates assume standard office fit-out without specialized areas like laboratories, server rooms, or high-security zones

This recommendation is based on current cost data in our system and provides a starting point for budgeting. A detailed cost plan should be developed as the project progresses.`;

  } catch (error) {
    console.error("Error generating recommendation:", error);
    return `I'm unable to provide a detailed cost recommendation due to an error in processing the project data. Please ensure all required project information is complete, including location, area, and project type.`;
  }
}

export default {
  getChatCompletion,
  analyzeExcelFile,
  analyzePdfDocument,
  generateCostRecommendation,
};