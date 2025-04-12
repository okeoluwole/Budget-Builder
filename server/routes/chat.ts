import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { 
  insertChatSessionSchema, 
  insertChatMessageSchema, 
  FitoutCost, 
  SpecificationRecord 
} from '@shared/schema';
import { z } from 'zod';
import { db } from '../db';
import { fitoutCosts, specifications } from '@shared/schema';
import * as localChat from '../utils/localChat';

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
      content: 'I am an AI assistant for the MMC Fit-out Budget Estimation application. How can I help you today?'
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

export default router;