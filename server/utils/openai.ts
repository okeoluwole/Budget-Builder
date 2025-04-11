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

    const response = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: allMessages as any,
      temperature: 0.7,
      ...(jsonResponse ? { response_format: { type: "json_object" } } : {}),
    });

    return response.choices[0].message.content || "I don't have a response for that.";
  } catch (error: any) {
    console.error("OpenAI API error:", error);
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
    return `I encountered an error generating a recommendation: ${error.message}. Please try again later.`;
  }
}

export default {
  getChatCompletion,
  analyzeExcelFile,
  analyzePdfDocument,
  generateCostRecommendation,
};