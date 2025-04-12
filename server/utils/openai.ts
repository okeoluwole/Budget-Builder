import OpenAI from "openai";
import { FitoutCost, Project, Budget, Specification } from "@shared/schema";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const GPT_MODEL = "gpt-4o";

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | Array<{
    type: string;
    text?: string;
    image_url?: { url: string };
  }>;
}

export interface ChatContext {
  projects?: Project[];
  budgets?: Budget[];
  fitoutCosts?: FitoutCost[];
  specifications?: Specification[];
  currentProject?: Project;
  currentBudget?: Budget;
}

/**
 * Generate a system prompt based on the available context
 */
function generateSystemPrompt(context?: ChatContext): string {
  // Base system instruction
  let prompt = `You are an AI assistant for an MMC Fit-out Budget Estimation application. 
You help users understand construction fit-out costs, budgeting, and specifications.

Current Date: ${new Date().toLocaleDateString()}

Your responses should be helpful, concise, and tailored to construction industry professionals.`;

  // Add context about available data if provided
  if (context) {
    prompt += "\n\nYou have access to the following data:";
    
    if (context.projects && context.projects.length > 0) {
      prompt += `\n- ${context.projects.length} projects`;
    }
    
    if (context.budgets && context.budgets.length > 0) {
      prompt += `\n- ${context.budgets.length} budget estimates`;
    }
    
    if (context.fitoutCosts && context.fitoutCosts.length > 0) {
      // Get unique countries without using Set
      const countries: string[] = [];
      context.fitoutCosts.forEach(c => {
        if (!countries.includes(c.country)) {
          countries.push(c.country);
        }
      });
      prompt += `\n- Fit-out cost data for ${countries.length} countries and their major cities`;
    }

    if (context.specifications && context.specifications.length > 0) {
      // Since Specification can be string literals or objects, we'll handle both
      const specNames = context.specifications.map(s => {
        if (typeof s === 'object' && s !== null) {
          // For specification objects from the database
          return (s as any).name || 'Unknown';
        } else {
          // For string literals
          return String(s);
        }
      }).join(", ");
      prompt += `\n- ${context.specifications.length} specification levels (${specNames})`;
    }

    // Add context about current project and budget if available
    if (context.currentProject) {
      prompt += `\n\nCurrent project: ${context.currentProject.name} (${context.currentProject.country}, ${context.currentProject.city})`;
      prompt += `\n- Area: ${context.currentProject.totalArea} ${context.currentProject.areaUnit}`;
      
      // Only add budget if available
      if ('budget' in context.currentProject) {
        const budget = (context.currentProject as any).budget;
        if (budget) {
          prompt += `\n- Budget: ${context.currentProject.currency} ${budget.toLocaleString()}`;
        }
      }
    }

    if (context.currentBudget) {
      prompt += `\n\nCurrent budget estimate:`;
      prompt += `\n- Specification: ${context.currentBudget.specification}`;
      prompt += `\n- Layout: ${context.currentBudget.layout}`;
      if (context.currentBudget.totalCost) {
        prompt += `\n- Total Cost: ${context.currentProject?.currency} ${context.currentBudget.totalCost.toLocaleString()}`;
      }
    }
  }

  // Add capabilities description
  prompt += `\n\nYou can:
1. Answer questions about construction fit-out costs and budgeting
2. Suggest appropriate specification levels based on budget constraints
3. Compare costs across different locations
4. Explain terminology related to fit-out construction
5. Help interpret cost data and make recommendations

Please note that while you have access to general knowledge about construction and fit-out processes, your primary purpose is to help users understand and work with the data in this application.`;

  return prompt;
}

/**
 * Send a chat completion request to OpenAI
 */
export async function getChatCompletion(
  messages: ChatMessage[],
  context?: ChatContext,
  jsonResponse = false
): Promise<string> {
  try {
    const systemPrompt = generateSystemPrompt(context);
    const allMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    // Check for latest message content to provide fallback responses
    const lastUserMessage = messages.findLast((msg) => msg.role === "user");
    const userQuery = typeof lastUserMessage?.content === 'string' 
      ? lastUserMessage.content.toLowerCase() 
      : '';

    // Attempt to use the OpenAI API
    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: allMessages as any,
      temperature: 0.7,
      ...(jsonResponse ? { response_format: { type: "json_object" } } : {}),
    });

    return response.choices[0].message.content || "I don't have a response for that.";
  } catch (error: any) {
    console.error("OpenAI API error:", error);
    
    // Check if it's a rate limit or quota error
    const isQuotaError = error.code === 'insufficient_quota' || 
                         error.code === 'rate_limit_exceeded' ||
                         (error.message && error.message.includes('quota'));
    
    if (isQuotaError) {
      // Get the user's last message to provide a relevant fallback response
      const lastUserMessage = messages.findLast((msg) => msg.role === "user");
      const userQuery = typeof lastUserMessage?.content === 'string' 
        ? lastUserMessage.content.toLowerCase() 
        : '';
      
      // Provide relevant fallback responses for common questions
      if (userQuery.includes('specification') || userQuery.includes('bronze') || 
          userQuery.includes('silver') || userQuery.includes('gold')) {
        return `Specifications in our system are categorized as Bronze, Silver, and Gold. Bronze is our basic tier suitable for functional spaces, Silver provides a balance of quality and cost, while Gold offers premium finishes for executive areas. Each level affects the cost per square meter/foot of your fit-out.`;
      } else if (userQuery.includes('layout') || userQuery.includes('activity') || 
                userQuery.includes('team') || userQuery.includes('event')) {
        return `We offer three layout types: Activity-based (flexible spaces for different tasks), Team-based (dedicated areas for teams), and Event-based (spaces optimized for gatherings and presentations). Each layout type has different cost implications.`;
      } else if (userQuery.includes('cost') || userQuery.includes('price') || 
                userQuery.includes('budget') || userQuery.includes('expensive')) {
        return `Fit-out costs vary significantly based on location, specification level, and layout type. Our data shows that costs range from approximately $1,500 to $3,500 per square meter for most locations, with premium locations like New York or London at the higher end.`;
      } else if (userQuery.includes('location') || userQuery.includes('city') || 
                userQuery.includes('country') || userQuery.includes('region')) {
        return `Our database contains fit-out cost data for multiple locations across the Americas, EMEA, and APAC regions. Each location has specific cost factors based on local market conditions. Major cities like New York, London, and Singapore serve as benchmarks for their respective regions.`;
      } else if (userQuery.includes('help') || userQuery.includes('feature') || 
                userQuery.includes('function') || userQuery.includes('do')) {
        return `I can help you understand fit-out costs, compare different specifications and layouts, answer questions about the budget estimation process, and provide insights on regional cost variations. You can also ask me about specific terms or concepts related to office fit-outs.`;
      }
      
      // Generic fallback response
      return `I apologize, but I'm currently unable to process your request due to API limitations. Our system is designed to help with fit-out budget estimation, providing cost data across different regions, specifications (Bronze, Silver, Gold), and layout types (Activity, Team, Event). Please try again later or contact support if you need immediate assistance.`;
    }
    
    // For other types of errors
    return `I encountered an error: ${error.message}. Please try again later.`;
  }
}

/**
 * Function to analyze an Excel file and extract insights
 */
export async function analyzeExcelFile(
  base64Content: string,
  filename: string
): Promise<string> {
  try {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `I have an Excel file named '${filename}' related to construction fit-out costs. Please analyze it and provide insights about the cost data, structure, and any patterns you observe.`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${base64Content}`,
            },
          },
        ],
      },
    ];

    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: messages as any,
      temperature: 0.5,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "I couldn't analyze the file.";
  } catch (error: any) {
    console.error("OpenAI Excel analysis error:", error);
    
    // Check if it's a rate limit or quota error
    const isQuotaError = error.code === 'insufficient_quota' || 
                       error.code === 'rate_limit_exceeded' ||
                       (error.message && error.message.includes('quota'));
    
    if (isQuotaError) {
      // Provide a fallback analysis based on the filename
      if (filename.toLowerCase().includes('cbre') || filename.toLowerCase().includes('fit out')) {
        return `Based on the filename "${filename}", I can provide some general insights about CBRE fit-out cost data:

1. The CBRE Fit Out Guide typically includes cost data for different regions, with costs varying significantly across locations.

2. The data is usually organized by:
   - Geographic regions (Americas, EMEA, APAC)
   - Cities within each region
   - Specification levels (typically Bronze/Silver/Gold or Low/Medium/High)
   - Layout types (Activity, Team, Event spaces)

3. Costs are typically presented in both square meters and square feet for international comparability.

4. Major financial centers like New York, London, and Singapore often serve as benchmarks for their respective regions.

5. The data helps clients understand how different specification levels and layout choices impact overall fit-out costs.

Please note that this is a general overview as I couldn't analyze the specific file due to API limitations.`;
      } else if (filename.toLowerCase().includes('budget') || filename.toLowerCase().includes('template')) {
        return `Based on the filename "${filename}", I can provide some general insights about budget templates:

1. Budget templates for construction fit-outs typically organize costs into major categories such as:
   - Construction costs (demolition, partitions, finishes)
   - MEP systems (mechanical, electrical, plumbing)
   - Furniture, fixtures, and equipment (FF&E)
   - Technology and audiovisual systems
   - Professional fees and contingencies

2. Templates often include formulas to calculate costs based on:
   - Area (square meters/feet)
   - Unit rates by specification level
   - Regional cost factors
   - Project-specific requirements

3. They may incorporate space allocation percentages for different functions like workstations, meeting rooms, common areas, etc.

4. Templates typically include contingency allowances (often 5-10% of construction cost).

Please note that this is a general overview as I couldn't analyze the specific file due to API limitations.`;
      } else {
        return `I apologize, but I'm currently unable to analyze the file "${filename}" due to API limitations. 

In general, Excel files related to construction fit-out costs typically contain:
- Cost data organized by location, specification level, and space type
- Unit rates for various construction elements
- Formulas for calculating total project costs
- Comparison data across different regions
- Benchmark standards for different quality levels

For specific analysis of your file, please try again later when the API service is available.`;
      }
    }
    
    return `I encountered an error analyzing the file: ${error.message}. Please try again later.`;
  }
}

/**
 * Function to analyze a PDF document and generate a summary
 */
export async function analyzePdfDocument(
  base64Content: string,
  filename: string
): Promise<string> {
  try {
    const messages: ChatMessage[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `I have a PDF document named '${filename}' related to construction fit-out processes or costs. Please analyze it and provide a concise summary of the key points, focusing on cost data and specifications if present.`,
          },
          {
            type: "image_url",
            image_url: {
              url: `data:application/pdf;base64,${base64Content}`,
            },
          },
        ],
      },
    ];

    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: messages as any,
      temperature: 0.5,
      max_tokens: 1000,
    });

    return response.choices[0].message.content || "I couldn't analyze the PDF document.";
  } catch (error: any) {
    console.error("OpenAI PDF analysis error:", error);
    
    // Check if it's a rate limit or quota error
    const isQuotaError = error.code === 'insufficient_quota' || 
                       error.code === 'rate_limit_exceeded' ||
                       (error.message && error.message.includes('quota'));
    
    if (isQuotaError) {
      // Provide a fallback response based on the filename
      if (filename.toLowerCase().includes('fit') && filename.toLowerCase().includes('out')) {
        return `I'm unable to analyze the specific content of "${filename}" due to API limitations, but I can provide general insights about fit-out documentation:

1. Fit-out guides typically cover:
   - Cost benchmarks across different regions and cities
   - Specification standards (often categorized as Bronze, Silver, Gold)
   - Design considerations for different workspace types
   - Construction timelines and phasing recommendations
   - Sustainability considerations and certifications

2. Documents often include visual references such as:
   - Layout diagrams showing different space allocations
   - Specification comparison tables
   - Cost breakdown charts
   - Sample material palettes for different specification levels

For specific analysis of your document, please try again later when the API service is available.`;
      } else if (filename.toLowerCase().includes('budget') || filename.toLowerCase().includes('cost')) {
        return `I'm unable to analyze the specific content of "${filename}" due to API limitations, but I can provide general insights about construction budget documentation:

1. Budget documents typically include:
   - Cost breakdowns by trade or category
   - Unit rate assumptions
   - Regional cost adjustment factors
   - Contingency recommendations
   - Benchmark comparisons to similar projects

2. Key cost factors that are typically addressed:
   - Base building condition considerations
   - Specification level impacts on costs
   - Timeline implications on budget
   - Market conditions and inflation factors
   - Procurement strategy recommendations

For specific analysis of your document, please try again later when the API service is available.`;
      } else {
        return `I apologize, but I'm currently unable to analyze the document "${filename}" due to API limitations.

For construction fit-out documentation, key elements typically include:
- Cost data across different regions and specification levels
- Design standards and recommendations
- Technical specifications for various building elements
- Project planning timelines and considerations
- Sustainability and compliance information

For specific analysis of your document, please try again later when the API service is available.`;
      }
    }
    
    return `I encountered an error analyzing the PDF: ${error.message}. Please try again later.`;
  }
}

/**
 * Generate a cost recommendation based on project parameters
 */
export async function generateCostRecommendation(
  project: Project,
  fitoutCosts: FitoutCost[],
  specifications: Specification[]
): Promise<string> {
  try {
    // Prepare the context data in a structured format for the AI
    const projectData = JSON.stringify(project, null, 2);
    const relevantCosts = fitoutCosts.filter(
      cost => cost.country === project.country && 
             (cost.city === project.city || cost.city === "Average")
    );
    const costsData = JSON.stringify(relevantCosts, null, 2);
    const specsData = JSON.stringify(specifications, null, 2);
    
    const userMessage = `Based on the following project data, fit-out costs, and specification options, provide a cost recommendation. 
Suggest the most appropriate specification level (Bronze, Silver, or Gold) given the project's budget constraints and location.
Include a brief explanation of your recommendation.

Project Data:
${projectData}

Available Fit-out Costs for this location:
${costsData}

Specification Options:
${specsData}

Please present your recommendation in a structured format with:
1. Recommended specification level
2. Estimated cost range
3. Rationale for recommendation
4. Any additional considerations`;

    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: "system",
          content: "You are a construction cost expert specializing in office fit-out projects. Provide detailed, actionable recommendations based on the data provided."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      temperature: 0.5,
    });

    return response.choices[0].message.content || "I couldn't generate a recommendation.";
  } catch (error: any) {
    console.error("OpenAI recommendation error:", error);
    
    // Check if it's a rate limit or quota error
    const isQuotaError = error.code === 'insufficient_quota' || 
                     error.code === 'rate_limit_exceeded' ||
                     (error.message && error.message.includes('quota'));
    
    if (isQuotaError) {
      // Provide a fallback recommendation based on the project data
      try {
        // Generate a simple recommendation based on project details
        const { area, currency, projectType } = project;
        const region = project.region || 'AMERICAS';
        
        // Use fixed values for recommendation since we don't have the API
        let recommendedSpec = 'Silver';
        let costRangeMin = 0;
        let costRangeMax = 0;
        let rationale = '';
        
        // Default cost ranges by region (USD per sqm)
        const costRanges = {
          'AMERICAS': { 'Bronze': [1500, 2200], 'Silver': [2200, 3000], 'Gold': [3000, 3800] },
          'EMEA': { 'Bronze': [1700, 2500], 'Silver': [2500, 3300], 'Gold': [3300, 4200] },
          'APAC': { 'Bronze': [1600, 2400], 'Silver': [2400, 3200], 'Gold': [3200, 4000] }
        };
        
        // Adjust specification based on project type
        if (projectType && projectType.toLowerCase().includes('executive')) {
          recommendedSpec = 'Gold';
          rationale = 'Executive spaces typically require higher-end finishes and technology integration.';
        } else if (projectType && projectType.toLowerCase().includes('standard')) {
          recommendedSpec = 'Silver';
          rationale = 'Standard office spaces benefit from a balanced approach to quality and cost.';
        } else if (projectType && (projectType.toLowerCase().includes('budget') || projectType.toLowerCase().includes('basic'))) {
          recommendedSpec = 'Bronze';
          rationale = 'Budget-conscious projects can achieve functional spaces with cost-effective solutions.';
        } else {
          // Default rationale
          rationale = 'Silver specification provides a good balance of quality and cost efficiency for most projects.';
        }
        
        // Get cost range for the recommended spec and region
        const regionCosts = costRanges[region] || costRanges['AMERICAS'];
        const [min, max] = regionCosts[recommendedSpec] || [2200, 3000];
        
        // Format cost range
        costRangeMin = min * area;
        costRangeMax = max * area;
        
        return `# Cost Recommendation

Due to API limitations, I'm providing a general recommendation based on the project information:

## 1. Recommended Specification Level
**${recommendedSpec}**

## 2. Estimated Cost Range
**${currency} ${costRangeMin.toLocaleString()} - ${currency} ${costRangeMax.toLocaleString()}** (based on ${area} sqm at ${currency} ${min}-${max}/sqm)

## 3. Rationale
${rationale}

## 4. Additional Considerations
- Actual costs may vary significantly based on specific local conditions
- Consider validating with local contractors for more accurate estimates
- This recommendation is based on general industry patterns and may not reflect current market conditions
- A detailed budget should be developed with input from local specialists

*Note: This is a simplified recommendation due to API limitations. For a more accurate assessment, please try again later when the API service is available.*`;
      } catch (innerError) {
        // If we can't even generate a basic recommendation, fall back to a generic message
        return `I apologize, but I'm currently unable to generate a detailed cost recommendation due to API limitations.

General considerations for office fit-out projects:
- Bronze specification typically ranges from $1,500-$2,200/sqm for standard spaces
- Silver specification typically ranges from $2,200-$3,000/sqm for standard spaces
- Gold specification typically ranges from $3,000-$3,800/sqm for standard spaces

Actual costs vary significantly by region, with adjustments of ±20-30% depending on location.

For a specific recommendation based on your project details, please try again later when the API service is available.`;
      }
    }
    
    return `I encountered an error generating a recommendation: ${error.message}. Please try again later.`;
  }
}

export default {
  getChatCompletion,
  analyzeExcelFile,
  analyzePdfDocument,
  generateCostRecommendation,
};