import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { 
  insertChatSessionSchema, 
  insertChatMessageSchema, 
  FitoutCost, 
  SpecificationRecord,
  fitoutCosts,
  furnitureCosts,
  specifications 
} from '@shared/schema';
import { z } from 'zod';
import { db } from '../db';
import { eq, and } from 'drizzle-orm';
import * as localChat from '../utils/localChat';
import { TT2025_COST_DATA, getTT2025DataByLocation, getAllTT2025Cities } from '../data/tt2025Data';

const router = Router();

// Get all chat sessions
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = req.query.userId ? Number(req.query.userId) : undefined;
    const sessions = await storage.getAllChatSessions(userId);
    res.json(sessions);
  } catch (error: any) {
    console.error('Error getting chat sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get a specific chat session with its messages
router.get('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const session = await storage.getChatSession(id);
    
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    const messages = await storage.getChatMessagesBySession(id);
    res.json({ session, messages });
  } catch (error: any) {
    console.error('Error getting chat session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new chat session
router.post('/sessions', async (req: Request, res: Response) => {
  try {
    const sessionData = insertChatSessionSchema.parse(req.body);
    const session = await storage.createChatSession(sessionData);
    
    // Add initial system message
    const systemMessage = {
      sessionId: session.id,
      role: 'system' as 'system',
      content: 'I am an AI assistant for Cost Estimator Pro. How can I help you today?'
    };
    
    await storage.addChatMessage(systemMessage);
    res.status(201).json(session);
  } catch (error: any) {
    console.error('Error creating chat session:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    
    res.status(500).json({ error: error.message });
  }
});

// Update a chat session (rename)
router.patch('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { title } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const session = await storage.updateChatSession(id, title);
    
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    res.json(session);
  } catch (error: any) {
    console.error('Error updating chat session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete a chat session
router.delete('/sessions/:id', async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const success = await storage.deleteChatSession(id);
    
    if (!success) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    res.status(204).end();
  } catch (error: any) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all messages for a chat session
router.get('/sessions/:id/messages', async (req: Request, res: Response) => {
  try {
    const sessionId = Number(req.params.id);
    const messages = await storage.getChatMessagesBySession(sessionId);
    res.json(messages);
  } catch (error: any) {
    console.error('Error getting chat messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send a message and get AI response
router.post('/sessions/:id/messages', async (req: Request, res: Response) => {
  try {
    const sessionId = Number(req.params.id);
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }
    
    // Get the session
    const session = await storage.getChatSession(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    // Add user message to the database
    const userMessage = {
      sessionId,
      role: 'user' as 'user',
      content
    };
    
    const savedUserMessage = await storage.addChatMessage(userMessage);
    
    // Get message history
    const messageHistory = await storage.getChatMessagesBySession(sessionId);
    
    // Get context for the AI
    const context: localChat.ChatContext = {
      projects: await storage.getAllProjects(),
      budgets: await storage.getAllBudgets(),
      fitoutCosts: await db.select().from(fitoutCosts),
      specifications: await db.select().from(specifications)
    };
    
    // Convert messages to the format expected by local implementation
    const chatMessages = messageHistory.map(msg => ({
      role: msg.role as "system" | "user" | "assistant",
      content: msg.content
    }));
    
    // Get response using local implementation
    const aiResponse = await localChat.getChatCompletion(chatMessages, context);
    
    // Save AI response to database
    const assistantMessage = {
      sessionId,
      role: 'assistant' as 'assistant',
      content: aiResponse
    };
    
    const savedAssistantMessage = await storage.addChatMessage(assistantMessage);
    
    res.json({
      userMessage: savedUserMessage,
      assistantMessage: savedAssistantMessage
    });
  } catch (error: any) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze Excel file
router.post('/analyze/excel', async (req: Request, res: Response) => {
  try {
    const { base64Content, filename } = req.body;
    
    if (!base64Content || !filename) {
      return res.status(400).json({ error: 'File content and filename are required' });
    }
    
    const analysis = await localChat.analyzeExcelFile(base64Content, filename);
    res.json({ analysis });
  } catch (error: any) {
    console.error('Error analyzing Excel file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Analyze PDF document
router.post('/analyze/pdf', async (req: Request, res: Response) => {
  try {
    const { base64Content, filename } = req.body;
    
    if (!base64Content || !filename) {
      return res.status(400).json({ error: 'File content and filename are required' });
    }
    
    const summary = await localChat.analyzePdfDocument(base64Content, filename);
    res.json({ summary });
  } catch (error: any) {
    console.error('Error analyzing PDF document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Generate cost recommendation
router.post('/recommendation', async (req: Request, res: Response) => {
  try {
    const { projectId } = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }
    
    const project = await storage.getProject(Number(projectId));
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get actual data from database
    const fitoutCostsData = await db.select().from(fitoutCosts);
    const specificationsData = await db.select().from(specifications);
    
    const recommendation = await localChat.generateCostRecommendation(
      project,
      fitoutCostsData,
      specificationsData
    );
    
    res.json({ recommendation });
  } catch (error: any) {
    console.error('Error generating recommendation:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cost Guide Query endpoint for AI assistant
router.post('/query', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const response = await processCostGuideQuery(message, conversationHistory || []);
    res.json({ response });
  } catch (error: any) {
    console.error('Cost guide query error:', error);
    res.status(500).json({ error: 'Unable to process your question. Please try asking about specific locations like London, New York, or Singapore.' });
  }
});

// Process cost guide queries with intelligent data analysis
async function processCostGuideQuery(message: string, history: any[]): Promise<string> {
  try {
    const lowerMessage = message.toLowerCase();
    
    // Location-based queries
    if (lowerMessage.includes('london') || lowerMessage.includes('uk') || lowerMessage.includes('united kingdom')) {
      return await handleLocationQuery('London', 'United Kingdom', lowerMessage);
    }
    
    if (lowerMessage.includes('new york') || lowerMessage.includes('nyc')) {
      return await handleLocationQuery('New York', 'United States', lowerMessage);
    }
    
    if (lowerMessage.includes('singapore')) {
      return await handleLocationQuery('Singapore', 'Singapore', lowerMessage);
    }
    
    // Comparison queries
    if (lowerMessage.includes('compare') || lowerMessage.includes('vs') || lowerMessage.includes('versus') || lowerMessage.includes('difference')) {
      return await handleComparisonQuery(lowerMessage);
    }
    
    // Rate queries
    if (lowerMessage.includes('rate') || lowerMessage.includes('cost') || lowerMessage.includes('price')) {
      return await handleRateQuery(lowerMessage);
    }
    
    // Guide information queries
    if ((lowerMessage.includes('turner') && lowerMessage.includes('townsend')) || lowerMessage.includes('t&t')) {
      return await handleGuideInfoQuery('TT', lowerMessage);
    }
    
    if (lowerMessage.includes('cbre')) {
      return await handleGuideInfoQuery('CBRE', lowerMessage);
    }
    
    // General help
    if (lowerMessage.includes('help') || lowerMessage.includes('what can') || lowerMessage.includes('how')) {
      return getHelpResponse();
    }
    
    // Default intelligent response
    return await handleGeneralQuery(message);
    
  } catch (error) {
    console.error('Error processing cost guide query:', error);
    return "I'm having trouble accessing the cost data right now. Please try asking about specific locations like London, New York, or Singapore, or try comparing rates between different guides.";
  }
}

async function handleLocationQuery(city: string, country: string, query: string): Promise<string> {
  try {
    let response = `**Cost data for ${city}, ${country}:**\n\n`;
    let hasData = false;

    // Check Turner & Townsend 2025 data first
    const ttData = getTT2025DataByLocation(city, country);
    if (ttData) {
      hasData = true;
      response += `**Turner & Townsend 2025 Global Fit-Out Costs:**\n`;
      response += `• Low specification: $${ttData.costs.total.low.toFixed(2)}/sqm\n`;
      response += `• Medium specification: $${ttData.costs.total.medium.toFixed(2)}/sqm\n`;
      response += `• High specification: $${ttData.costs.total.high.toFixed(2)}/sqm\n\n`;
      
      response += `**Component Breakdown (Medium spec):**\n`;
      response += `• Construction: $${ttData.costs.construction.medium.toFixed(2)}/sqm\n`;
      response += `• Loose Furniture: $${ttData.costs.looseFurniture.medium.toFixed(2)}/sqm\n`;
      response += `• Audio Visual: $${ttData.costs.audioVisual.medium.toFixed(2)}/sqm\n`;
      response += `• Professional Fees: $${ttData.costs.professionalFees.medium.toFixed(2)}/sqm\n\n`;
    }

    // Query CBRE fitout costs
    const fitoutResults = await db.select()
      .from(fitoutCosts)
      .where(and(
        eq(fitoutCosts.city, city),
        eq(fitoutCosts.country, country)
      ));
    
    // Query CBRE furniture costs
    const furnitureResults = await db.select()
      .from(furnitureCosts)
      .where(and(
        eq(furnitureCosts.city, city),
        eq(furnitureCosts.country, country)
      ));
    
    if (fitoutResults.length > 0) {
      hasData = true;
      const fitout = fitoutResults[0];
      const lowRate = parseFloat(fitout.activityLowSqm || '0');
      const mediumRate = parseFloat(fitout.activityMediumSqm || '0');
      const highRate = parseFloat(fitout.activityHighSqm || '0');
      
      response += `**CBRE Fit-out Costs:**\n`;
      response += `• Low specification: $${lowRate.toFixed(2)}/sqm\n`;
      response += `• Medium specification: $${mediumRate.toFixed(2)}/sqm\n`;
      response += `• High specification: $${highRate.toFixed(2)}/sqm\n\n`;
    }
    
    if (furnitureResults.length > 0) {
      hasData = true;
      const furniture = furnitureResults[0];
      const lowRate = parseFloat(furniture.activityLowSqm || '0');
      const mediumRate = parseFloat(furniture.activityMediumSqm || '0');
      const highRate = parseFloat(furniture.activityHighSqm || '0');
      
      response += `**CBRE Furniture Costs:**\n`;
      response += `• Low specification: $${lowRate.toFixed(2)}/sqm\n`;
      response += `• Medium specification: $${mediumRate.toFixed(2)}/sqm\n`;
      response += `• High specification: $${highRate.toFixed(2)}/sqm\n\n`;
    }
    
    if (!hasData) {
      const availableCities = getAllTT2025Cities().slice(0, 5).join(', ');
      return `I couldn't find cost data for ${city}, ${country}. Available locations include ${availableCities}, and many others. Would you like me to list all available locations?`;
    }
    
    if (query.includes('furniture')) {
      response += `These costs include furniture and fit-out components. `;
    } else if (query.includes('fitout') || query.includes('fit-out')) {
      response += `These are comprehensive fit-out costs including construction and furniture. `;
    }
    
    response += `Would you like to compare with other locations or see more detailed breakdowns?`;
    
    return response;
  } catch (error) {
    console.error('Location query error:', error);
    return `Error retrieving data for ${city}, ${country}. Please try again.`;
  }
}

async function handleComparisonQuery(query: string): Promise<string> {
  try {
    // Extract locations or guides from query
    if (query.includes('turner') && query.includes('cbre')) {
      return `**Turner & Townsend vs CBRE Comparison:**\n\n` +
             `**Turner & Townsend 2025:**\n` +
             `• Covers global office fit-out costs\n` +
             `• Includes construction, furniture, AV, and professional fees\n` +
             `• Quality levels: Low, Medium, High\n` +
             `• Component-specific specifications\n\n` +
             `**CBRE:**\n` +
             `• Separate fit-out and furniture datasets\n` +
             `• Quality levels: Low, Medium, High\n` +
             `• Regional coverage with location factors\n` +
             `• Activity, Team, and Event space categories\n\n` +
             `For specific location comparisons, ask: "Compare London rates between Turner & Townsend and CBRE"`;
    }
    
    // Location comparison
    if (query.includes('london') && query.includes('new york')) {
      return await compareLocationRates('London', 'United Kingdom', 'New York', 'United States');
    }
    
    return `I can help you compare:\n• Turner & Townsend vs CBRE methodologies\n• Different locations (London vs New York)\n• Specification levels within a location\n\nWhat would you like to compare specifically?`;
  } catch (error) {
    return `Error processing comparison. Please try asking: "Compare Turner & Townsend vs CBRE" or "Compare London vs New York rates"`;
  }
}

async function compareLocationRates(city1: string, country1: string, city2: string, country2: string): Promise<string> {
  try {
    const location1Data = await db.select()
      .from(fitoutCosts)
      .where(and(
        eq(fitoutCosts.city, city1),
        eq(fitoutCosts.country, country1)
      ));
    
    const location2Data = await db.select()
      .from(fitoutCosts)  
      .where(and(
        eq(fitoutCosts.city, city2),
        eq(fitoutCosts.country, country2)
      ));
    
    if (location1Data.length === 0 || location2Data.length === 0) {
      return `I couldn't find complete data for both locations. Available locations include major cities covered in the CBRE datasets.`;
    }
    
    const loc1 = location1Data[0];
    const loc2 = location2Data[0];
    
    const loc1Medium = parseFloat(loc1.activityMediumSqm || '0');
    const loc2Medium = parseFloat(loc2.activityMediumSqm || '0');
    const mediumDiff = ((loc1Medium - loc2Medium) / loc2Medium) * 100;
    
    let response = `**${city1} vs ${city2} - Fit-out Costs Comparison:**\n\n`;
    response += `**${city1}, ${country1}:**\n`;
    response += `• Medium spec: $${loc1Medium.toFixed(2)}/sqm\n\n`;
    response += `**${city2}, ${country2}:**\n`;
    response += `• Medium spec: $${loc2Medium.toFixed(2)}/sqm\n\n`;
    response += `**Difference:** ${city1} is ${Math.abs(mediumDiff).toFixed(1)}% ${mediumDiff > 0 ? 'higher' : 'lower'} than ${city2}\n\n`;
    response += `This comparison uses CBRE fit-out data. Would you like to see furniture costs or Turner & Townsend data?`;
    
    return response;
  } catch (error) {
    return `Error comparing locations. Please try again with specific city names.`;
  }
}

async function handleRateQuery(query: string): Promise<string> {
  try {
    // If no specific location mentioned, provide general guidance
    if (!query.includes('london') && !query.includes('new york') && !query.includes('singapore')) {
      return `I can provide cost rates for specific locations. Try asking:\n\n` +
             `• "What's the fit-out rate in London?"\n` +
             `• "Singapore furniture costs"\n` +
             `• "New York medium specification rates"\n\n` +
             `Available locations include major cities from CBRE and Turner & Townsend datasets.`;
    }
    
    // Handle specific location rate queries through location handler
    if (query.includes('london')) return await handleLocationQuery('London', 'United Kingdom', query);
    if (query.includes('new york')) return await handleLocationQuery('New York', 'United States', query);
    if (query.includes('singapore')) return await handleLocationQuery('Singapore', 'Singapore', query);
    
    return `Please specify a location for rate information. I have data for London, New York, Singapore, and many other cities.`;
  } catch (error) {
    return `Error retrieving rate information. Please try asking about specific locations.`;
  }
}

async function handleGuideInfoQuery(guide: string, query: string): Promise<string> {
  if (guide === 'TT') {
    const ttCities = getAllTT2025Cities();
    return `**Turner & Townsend Global Office Fit-Out Cost Guide 2025:**\n\n` +
           `Turner & Townsend provides comprehensive global fit-out cost data across ${ttCities.length} major markets worldwide.\n\n` +
           `**Key Features:**\n` +
           `• Global coverage across EMEA, Americas, and APAC regions\n` +
           `• Four main components: Construction, Loose Furniture, Audio-Visual, Professional Fees\n` +
           `• Quality specifications: Low, Medium, High\n` +
           `• Component-specific cost breakdowns\n` +
           `• All costs in USD per square meter\n` +
           `• Updated for 2025 market conditions\n\n` +
           `**Available Cities:** ${ttCities.slice(0, 8).join(', ')}${ttCities.length > 8 ? ', and more...' : ''}\n\n` +
           `Ask me: "What's the Turner & Townsend rate for London?" or "Compare T&T construction vs furniture costs"`;
  } else {
    return `**CBRE Global Fit-Out Cost Guide:**\n\n` +
           `CBRE provides detailed fit-out and furniture cost data for office spaces across global markets.\n\n` +
           `**Key Features:**\n` +
           `• Separate fit-out and furniture datasets\n` +
           `• Three space types: Activity, Team, Event\n` +
           `• Quality levels: Low, Medium, High\n` +
           `• Regional location factors\n` +
           `• Square meter and square foot data\n` +
           `• Covers 134 cities for fit-out and 135 cities for furniture\n\n` +
           `Ask me: "What's the CBRE rate for Singapore?" or "Compare CBRE fit-out vs furniture"`;
  }
}

async function handleGeneralQuery(message: string): Promise<string> {
  return `I can help you with cost guide information! Try asking:\n\n` +
         `**Location queries:**\n` +
         `• "What's the fit-out rate in London?"\n` +
         `• "Singapore furniture costs"\n\n` +
         `**Comparisons:**\n` +
         `• "Compare Turner & Townsend vs CBRE"\n` +
         `• "London vs New York rates"\n\n` +
         `**Guide information:**\n` +
         `• "Tell me about Turner & Townsend"\n` +
         `• "CBRE methodology"\n\n` +
         `What specific cost information are you looking for?`;
}

function getHelpResponse(): string {
  return `**I can help you with:**\n\n` +
         `🏢 **Location-specific rates**\n` +
         `"What's the fit-out rate in London?"\n\n` +
         `📊 **Compare data sources**\n` +
         `"Compare Turner & Townsend vs CBRE"\n\n` +
         `🌍 **Compare locations**\n` +
         `"London vs Singapore costs"\n\n` +
         `📋 **Guide information**\n` +
         `"Tell me about CBRE methodology"\n\n` +
         `💰 **Specific cost types**\n` +
         `"Furniture costs in New York"\n\n` +
         `Just ask in plain English about any cost data you need!`;
}

export default router;