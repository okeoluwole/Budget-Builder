import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { FitoutCostData, SpecificationData, BudgetCategory, Specification, FurnitureCostData } from "@shared/schema";
import { importFitoutCostsFromExcel } from "./utils/databaseImport";
import { parseExcelFile } from "./utils/excelReader";
import { db } from "./db";
import { 
  fitoutCosts, specifications, layoutTemplates, budgetTemplates, currencyRates, furnitureCosts, technologyCosts
} from "@shared/schema";
import chatRoutes from './routes/chat';
import { importCurrencyRatesFromExcel, getAllCurrencyRates } from './utils/currencyImport';
import * as openaiUtil from './utils/openai';
import { validateDataset, getDatasetValidationWarnings } from './utils/datasetValidator';

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes with /api prefix
  
  // Chat AI routes
  app.use('/api/chat', chatRoutes);
  
  // Direct API handlers for chat functionality for better compatibility
  app.get('/api/chat/sessions', async (req, res) => {
    try {
      const userId = req.query.userId ? Number(req.query.userId) : undefined;
      const sessions = await storage.getAllChatSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error('Error fetching chat sessions:', error);
      res.status(500).json({ message: 'Failed to fetch chat sessions' });
    }
  });
  
  // Create new chat session
  app.post('/api/chat/sessions', async (req, res) => {
    try {
      const { title = 'New Conversation' } = req.body;
      const session = await storage.createChatSession({ title });
      res.status(201).json(session);
    } catch (error) {
      console.error('Error creating chat session:', error);
      res.status(500).json({ message: 'Failed to create chat session' });
    }
  });
  
  // Get messages for a specific session
  app.get('/api/chat/sessions/:id/messages', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const messages = await storage.getChatMessagesBySession(sessionId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching chat messages:', error);
      res.status(500).json({ message: 'Failed to fetch chat messages' });
    }
  });
  
  // Send a message in a session
  app.post('/api/chat/sessions/:id/messages', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const { content, role = 'user' } = req.body;
      
      // Create user message
      const userMessage = await storage.addChatMessage({
        sessionId,
        content,
        role: role as 'user' | 'assistant' | 'system',
      });
      
      // Get message history
      const messageHistory = await storage.getChatMessagesBySession(sessionId);
      
      // Get context for AI response
      const context = {
        projects: await storage.getAllProjects(),
        budgets: await storage.getAllBudgets(),
        fitoutCosts: await db.select().from(fitoutCosts)
      };
      
      // Import the local chat module
      const localChat = await import('./utils/localChat');
      
      // Convert messages to the expected format
      const chatMessages = messageHistory.map(msg => ({
        role: msg.role as "system" | "user" | "assistant",
        content: msg.content
      }));
      
      // Get AI response using local implementation
      const aiResponse = await localChat.getChatCompletion(chatMessages, context);
      
      // Store AI response
      const assistantMessage = await storage.addChatMessage({
        sessionId,
        content: aiResponse,
        role: 'assistant',
      });
      
      // Return both messages
      res.status(201).json({
        userMessage: userMessage,
        assistantMessage: assistantMessage
      });
    } catch (error) {
      console.error('Error sending chat message:', error);
      res.status(500).json({ message: 'Failed to process chat message' });
    }
  });
  
  // Delete a chat session
  app.delete('/api/chat/sessions/:id', async (req, res) => {
    try {
      const sessionId = parseInt(req.params.id);
      const success = await storage.deleteChatSession(sessionId);
      if (!success) {
        return res.status(404).json({ message: 'Chat session not found' });
      }
      res.status(200).json({ message: 'Chat session deleted successfully' });
    } catch (error) {
      console.error('Error deleting chat session:', error);
      res.status(500).json({ message: 'Failed to delete chat session' });
    }
  });
  
  // Projects
  app.get('/api/projects', async (req, res) => {
    try {
      const projects = await storage.getAllProjects();
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch projects' });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const project = await storage.getProject(parseInt(req.params.id));
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch project' });
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const project = await storage.createProject(req.body);
      res.status(201).json(project);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create project' });
    }
  });

  app.put('/api/projects/:id', async (req, res) => {
    try {
      const project = await storage.updateProject(parseInt(req.params.id), req.body);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }
      res.json(project);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update project' });
    }
  });

  // Budgets
  app.get('/api/budgets', async (req, res) => {
    try {
      const budgets = await storage.getAllBudgets();
      res.json(budgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      res.status(500).json({ message: 'Failed to fetch budgets' });
    }
  });

  app.get('/api/projects/:projectId/budgets', async (req, res) => {
    try {
      const budgets = await storage.getBudgetsByProject(parseInt(req.params.projectId));
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch budgets' });
    }
  });

  app.get('/api/budgets/:id', async (req, res) => {
    try {
      const budget = await storage.getBudget(parseInt(req.params.id));
      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      res.json(budget);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch budget' });
    }
  });

  app.post('/api/budgets', async (req, res) => {
    try {
      console.log('Creating budget with data:', JSON.stringify(req.body, null, 2));
      
      // Validate required fields
      if (!req.body.projectId) {
        return res.status(400).json({ message: 'Project ID is required' });
      }
      
      // Ensure ttComponentSpecs is properly formatted as JSON string if it's an object
      if (req.body.ttComponentSpecs && typeof req.body.ttComponentSpecs === 'object') {
        req.body.ttComponentSpecs = JSON.stringify(req.body.ttComponentSpecs);
      }
      
      // Ensure spaceAllocation is properly formatted as JSON string if it's an object
      if (req.body.spaceAllocation && typeof req.body.spaceAllocation === 'object') {
        req.body.spaceAllocation = JSON.stringify(req.body.spaceAllocation);
      }
      
      // Ensure costsBreakdown is properly formatted as JSON string if it's an object
      if (req.body.costsBreakdown && typeof req.body.costsBreakdown === 'object') {
        req.body.costsBreakdown = JSON.stringify(req.body.costsBreakdown);
      }
      
      const budget = await storage.createBudget(req.body);
      console.log('Budget created successfully:', budget.id);
      res.status(201).json(budget);
    } catch (error: any) {
      console.error('Budget creation error:', error);
      res.status(400).json({ 
        message: 'Failed to create budget',
        error: error.message,
        details: error.stack
      });
    }
  });

  app.put('/api/budgets/:id', async (req, res) => {
    try {
      const budget = await storage.updateBudget(parseInt(req.params.id), req.body);
      if (!budget) {
        return res.status(404).json({ message: 'Budget not found' });
      }
      res.json(budget);
    } catch (error) {
      res.status(400).json({ message: 'Failed to update budget' });
    }
  });

  // Fitout cost data from database
  app.get('/api/fitout-costs', async (req, res) => {
    try {
      // Get all fitout cost records from the database
      const records = await db.select().from(fitoutCosts);
      
      if (records.length === 0) {
        return res.status(404).json({ message: 'No fitout cost data found in database' });
      }
      
      // Transform database records to FitoutCostData format
      const data: FitoutCostData[] = records.map(record => ({
        country: record.country,
        city: record.city,
        region: record.region,
        costs: {
          sqm: {
            Activity: {
              Low: parseFloat(record.activityLowSqm || '0'),
              Medium: parseFloat(record.activityMediumSqm || '0'),
              High: parseFloat(record.activityHighSqm || '0')
            },
            Team: {
              Low: parseFloat(record.teamLowSqm || '0'),
              Medium: parseFloat(record.teamMediumSqm || '0'),
              High: parseFloat(record.teamHighSqm || '0')
            },
            Event: {
              Low: parseFloat(record.eventLowSqm || '0'),
              Medium: parseFloat(record.eventMediumSqm || '0'),
              High: parseFloat(record.eventHighSqm || '0')
            }
          },
          sqft: {
            Activity: {
              Low: parseFloat(record.activityLowSqft || '0'),
              Medium: parseFloat(record.activityMediumSqft || '0'),
              High: parseFloat(record.activityHighSqft || '0')
            },
            Team: {
              Low: parseFloat(record.teamLowSqft || '0'),
              Medium: parseFloat(record.teamMediumSqft || '0'),
              High: parseFloat(record.teamHighSqft || '0')
            },
            Event: {
              Low: parseFloat(record.eventLowSqft || '0'),
              Medium: parseFloat(record.eventMediumSqft || '0'),
              High: parseFloat(record.eventHighSqft || '0')
            }
          }
        },
        locationFactors: {
          EMEA: parseFloat(record.locationFactorEMEA || '1.0'),
          AMERICA: parseFloat(record.locationFactorAMERICA || '1.0'),
          APAC: parseFloat(record.locationFactorAPAC || '1.0')
        },
        professionalFees: record.professionalFees?.toString() || '0.15'
      }));
      
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching fitout cost data:', error);
      res.status(500).json({ 
        message: 'Failed to fetch fitout cost data',
        error: error.message
      });
    }
  });
  
  // Furniture cost data from database
  app.get('/api/furniture-costs', async (req, res) => {
    try {
      // Get all furniture cost records from the database
      const records = await db.select().from(furnitureCosts);
      
      if (records.length === 0) {
        return res.status(404).json({ message: 'No furniture cost data found in database' });
      }
      
      // Transform database records to FurnitureCostData format
      const data: FurnitureCostData[] = records.map(record => ({
        country: record.country,
        city: record.city,
        region: record.region,
        costs: {
          sqm: {
            Activity: {
              Low: parseFloat(record.activityLowSqm || '0'),
              Medium: parseFloat(record.activityMediumSqm || '0'),
              High: parseFloat(record.activityHighSqm || '0')
            },
            Team: {
              Low: parseFloat(record.teamLowSqm || '0'),
              Medium: parseFloat(record.teamMediumSqm || '0'),
              High: parseFloat(record.teamHighSqm || '0')
            },
            Event: {
              Low: parseFloat(record.eventLowSqm || '0'),
              Medium: parseFloat(record.eventMediumSqm || '0'),
              High: parseFloat(record.eventHighSqm || '0')
            }
          },
          sqft: {
            Activity: {
              Low: parseFloat(record.activityLowSqft || '0'),
              Medium: parseFloat(record.activityMediumSqft || '0'),
              High: parseFloat(record.activityHighSqft || '0')
            },
            Team: {
              Low: parseFloat(record.teamLowSqft || '0'),
              Medium: parseFloat(record.teamMediumSqft || '0'),
              High: parseFloat(record.teamHighSqft || '0')
            },
            Event: {
              Low: parseFloat(record.eventLowSqft || '0'),
              Medium: parseFloat(record.eventMediumSqft || '0'),
              High: parseFloat(record.eventHighSqft || '0')
            }
          }
        },
        locationFactors: {
          EMEA: parseFloat(record.locationFactorEMEA || '1.0'),
          AMERICA: parseFloat(record.locationFactorAMERICA || '1.0'),
          APAC: parseFloat(record.locationFactorAPAC || '1.0')
        }
      }));
      
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching furniture cost data:', error);
      res.status(500).json({ 
        message: 'Failed to fetch furniture cost data',
        error: error.message
      });
    }
  });

  // Technology cost data from database
  app.get('/api/technology-costs', async (req, res) => {
    try {
      // Get all technology cost records from the database
      const records = await db.select().from(technologyCosts);
      
      if (records.length === 0) {
        return res.status(404).json({ message: 'No technology cost data found in database' });
      }
      
      // Transform database records to TechnologyCostData format
      const data = records.map(record => ({
        country: record.country,
        city: record.city,
        region: record.region,
        costs: {
          sqm: {
            Activity: {
              Low: parseFloat(record.activityLowSqm || '0'),
              Medium: parseFloat(record.activityMediumSqm || '0'),
              High: parseFloat(record.activityHighSqm || '0')
            },
            Team: {
              Low: parseFloat(record.teamLowSqm || '0'),
              Medium: parseFloat(record.teamMediumSqm || '0'),
              High: parseFloat(record.teamHighSqm || '0')
            },
            Event: {
              Low: parseFloat(record.eventLowSqm || '0'),
              Medium: parseFloat(record.eventMediumSqm || '0'),
              High: parseFloat(record.eventHighSqm || '0')
            }
          },
          sqft: {
            Activity: {
              Low: parseFloat(record.activityLowSqft || '0'),
              Medium: parseFloat(record.activityMediumSqft || '0'),
              High: parseFloat(record.activityHighSqft || '0')
            },
            Team: {
              Low: parseFloat(record.teamLowSqft || '0'),
              Medium: parseFloat(record.teamMediumSqft || '0'),
              High: parseFloat(record.teamHighSqft || '0')
            },
            Event: {
              Low: parseFloat(record.eventLowSqft || '0'),
              Medium: parseFloat(record.eventMediumSqft || '0'),
              High: parseFloat(record.eventHighSqft || '0')
            }
          }
        },
        locationFactors: {
          EMEA: parseFloat(record.locationFactorEMEA || '1.0'),
          AMERICA: parseFloat(record.locationFactorAMERICA || '1.0'),
          APAC: parseFloat(record.locationFactorAPAC || '1.0')
        },
        inflationRate: parseFloat(record.inflationRate?.toString() || '1.0')
      }));
      
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching technology cost data:', error);
      res.status(500).json({ 
        message: 'Failed to fetch technology cost data',
        error: error.message
      });
    }
  });

  // Countries and cities from database and T&T 2025 data
  app.get('/api/locations', async (req, res) => {
    try {
      // Get all fitout cost records from the database (CBRE data)
      const records = await db.select().from(fitoutCosts);
      
      // Extract unique countries and their cities from CBRE data
      const locations: { [country: string]: string[] } = {};
      
      records.forEach(item => {
        if (!locations[item.country]) {
          locations[item.country] = [];
        }
        if (!locations[item.country].includes(item.city)) {
          locations[item.country].push(item.city);
        }
      });
      
      // Add T&T 2025 locations (import the data)
      const { TT2025_COST_DATA } = await import('../client/src/utils/tt2025Data');
      
      TT2025_COST_DATA.forEach(item => {
        if (!locations[item.country]) {
          locations[item.country] = [];
        }
        if (!locations[item.country].includes(item.city)) {
          locations[item.country].push(item.city);
        }
      });
      
      // Sort countries and cities alphabetically
      const sortedLocations: { [country: string]: string[] } = {};
      Object.keys(locations).sort().forEach(country => {
        sortedLocations[country] = locations[country].sort();
      });
      
      res.json(sortedLocations);
    } catch (error: any) {
      console.error('Error fetching locations:', error);
      res.status(500).json({ 
        message: 'Failed to fetch locations',
        error: error.message
      });
    }
  });

  // Specifications from database
  app.get('/api/specifications', async (req, res) => {
    try {
      const dataSource = req.query.dataSource as string;
      
      // For T&T data source, return Low/Medium/High specifications
      if (dataSource === 'TT') {
        const ttSpecs: SpecificationData[] = [
          {
            name: 'Low' as any,
            description: 'Standard office fit-out with basic finishes and fixtures',
            walls: 'Painted walls with minimal branding',
            partitions: {
              type: 'Single glazed',
              acousticRating: '38dB Rw',
              costFactor: 1.0
            },
            flooring: 'Standard carpet tiles',
            ceiling: 'Standard suspended ceiling',
            furniture: {
              desks: 'Fixed desks',
              chairs: 'Basic task chairs',
              storage: 'Basic storage solutions'
            },
            technology: {
              av: 'Basic AV with audio conferencing',
              security: 'Standard security features'
            },
            fittings: 'Basic fittings and finishes',
            recommendedFor: 'Standard office spaces with budget constraints'
          },
          {
            name: 'Medium' as any,
            description: 'Enhanced office fit-out with quality finishes and improved functionality',
            walls: 'Feature walls with special finishes',
            partitions: {
              type: 'Double glazed',
              acousticRating: '45dB Rw',
              costFactor: 1.4
            },
            flooring: 'Upgraded options, timber/LVT in specific areas',
            ceiling: 'Feature ceiling elements',
            furniture: {
              desks: 'Mix of static and height-adjustable desks',
              chairs: 'Mid-tier ergonomic chairs',
              storage: 'Enhanced storage solutions'
            },
            technology: {
              av: 'Enhanced AV throughout with video conferencing',
              security: 'Enhanced security features'
            },
            fittings: 'Higher quality fittings and finishes',
            recommendedFor: 'Enhanced office environments requiring more customization'
          },
          {
            name: 'High' as any,
            description: 'Premium office fit-out with high-end finishes and advanced technology',
            walls: 'Feature wall concepts throughout, extensive branding',
            partitions: {
              type: 'Double glazed with high performance',
              acousticRating: '50dB Rw',
              costFactor: 1.8
            },
            flooring: 'High-specification (ceramic, porcelain)',
            ceiling: 'Comprehensive feature ceiling concepts',
            furniture: {
              desks: 'Height-adjustable desks throughout',
              chairs: 'Premium ergonomic chairs',
              storage: 'Premium storage solutions'
            },
            technology: {
              av: 'Premium AV systems with advanced video conferencing',
              security: 'Advanced security systems'
            },
            fittings: 'Premium fittings and finishes throughout',
            recommendedFor: 'High-end office environments with premium requirements'
          }
        ];
        return res.json(ttSpecs);
      }
      
      // Get all specification records from the database for other data sources
      const records = await db.select().from(specifications);
      
      if (records.length === 0) {
        // Fall back to JSON file if no database records
        const dataPath = path.join(process.cwd(), 'data', 'specifications.json');
        if (!fs.existsSync(dataPath)) {
          return res.status(404).json({ message: 'Specifications data not found' });
        }
        
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as SpecificationData[];
        return res.json(data);
      }
      
      // Transform database records to SpecificationData format
      const data: SpecificationData[] = records.map(record => ({
        name: record.name as Specification,
        description: record.description,
        walls: record.walls,
        partitions: {
          type: record.partitionType,
          acousticRating: record.partitionAcousticRating,
          costFactor: parseFloat(record.partitionCostFactor)
        },
        flooring: record.flooring,
        ceiling: record.ceiling,
        furniture: {
          desks: record.furnitureDesks,
          chairs: record.furnitureChairs,
          storage: record.furnitureStorage
        },
        technology: {
          av: record.technologyAV,
          security: record.technologySecurity
        },
        fittings: record.fittings,
        recommendedFor: record.recommendedFor
      }));
      
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching specifications:', error);
      res.status(500).json({ 
        message: 'Failed to fetch specifications',
        error: error.message
      });
    }
  });
  
  // Get layout templates
  app.get('/api/layout-templates', async (req, res) => {
    try {
      const dataSource = req.query.dataSource as string;
      
      // For T&T data source, return T&T-specific layout templates
      if (dataSource === 'TT') {
        const ttLayouts = [
          {
            name: 'Standard Office',
            description: 'Traditional office layout with private offices and open workspace',
            benefits: ['Clear hierarchy', 'Privacy for focused work', 'Meeting spaces'],
            spaceTypes: {
              'Private Offices': { percentage: 40, area: 0 },
              'Open Workspace': { percentage: 35, area: 0 },
              'Meeting Rooms': { percentage: 15, area: 0 },
              'Support Areas': { percentage: 10, area: 0 }
            }
          },
          {
            name: 'Open Plan',
            description: 'Modern open plan office with collaboration zones',
            benefits: ['Maximum collaboration', 'Flexible workspace', 'Cost effective'],
            spaceTypes: {
              'Open Workspace': { percentage: 60, area: 0 },
              'Collaboration Areas': { percentage: 20, area: 0 },
              'Meeting Rooms': { percentage: 15, area: 0 },
              'Support Areas': { percentage: 5, area: 0 }
            }
          },
          {
            name: 'Hybrid Workspace',
            description: 'Flexible hybrid workspace supporting various work styles',
            benefits: ['Activity-based working', 'Flexible arrangements', 'Future-ready'],
            spaceTypes: {
              'Open Workspace': { percentage: 45, area: 0 },
              'Private Focus Areas': { percentage: 20, area: 0 },
              'Collaboration Areas': { percentage: 20, area: 0 },
              'Meeting Rooms': { percentage: 10, area: 0 },
              'Support Areas': { percentage: 5, area: 0 }
            }
          }
        ];
        return res.json(ttLayouts);
      }
      
      // Get all layout template records from the database for other data sources
      const records = await db.select().from(layoutTemplates);
      
      if (records.length === 0) {
        // Fall back to JSON file if no database records
        const dataPath = path.join(process.cwd(), 'data', 'layout_templates.json');
        if (!fs.existsSync(dataPath)) {
          return res.status(404).json({ message: 'Layout templates data not found' });
        }
        
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
        return res.json(data);
      }
      
      // Transform database records to the expected format
      const data = records.map(record => ({
        name: record.name,
        description: record.description,
        benefits: record.benefits ? JSON.parse(record.benefits) : [],
        spaceTypes: record.defaultAllocation
      }));
      
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching layout templates:', error);
      res.status(500).json({ 
        message: 'Failed to fetch layout templates',
        error: error.message
      });
    }
  });

  // Budget template structure from database
  app.get('/api/budget-template', async (req, res) => {
    try {
      // Get budget template from the database
      const records = await db.select().from(budgetTemplates);
      
      if (records.length === 0) {
        // Fall back to JSON file if no database records
        const dataPath = path.join(process.cwd(), 'data', 'budget_template_structure.json');
        if (!fs.existsSync(dataPath)) {
          return res.status(404).json({ message: 'Budget template structure not found' });
        }
        
        const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as BudgetCategory[];
        return res.json(data);
      }
      
      // Use the first template
      const template = records[0];
      const data = template.structure as BudgetCategory[];
      
      res.json(data);
    } catch (error: any) {
      console.error('Error fetching budget template structure:', error);
      res.status(500).json({ 
        message: 'Failed to fetch budget template structure',
        error: error.message
      });
    }
  });

  // Analyze Excel file structure
  app.get('/api/admin/analyze-excel', async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), 'attached_assets', 'CBRE Fit Out Guide Cost Data_Fitout Only.xlsx');
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: 'Excel file not found' });
      }
      
      const excelData = await parseExcelFile(filePath);
      
      res.status(200).json({ 
        message: 'Excel file parsed successfully',
        sheetNames: Object.keys(excelData),
        // For each sheet, include the first row and row count
        sheets: Object.entries(excelData).reduce<Record<string, any>>((acc, [sheetName, data]) => {
          if (Array.isArray(data)) {
            acc[sheetName] = {
              rowCount: data.length,
              firstRow: data.length > 0 ? data[0] : null
            };
          } else {
            acc[sheetName] = { rowCount: 0, firstRow: null };
          }
          return acc;
        }, {})
      });
    } catch (error: any) {
      console.error('Error analyzing Excel file:', error);
      res.status(500).json({ 
        message: 'Failed to analyze Excel file', 
        error: error.message
      });
    }
  });

  // Get all currency rates
  app.get('/api/currency-rates', async (req, res) => {
    try {
      // Import the currency functions
      const { getAllCurrencyRates } = await import('./utils/currencyImport');
      
      // Get all currency rates
      const currencyRates = await getAllCurrencyRates();
      
      if (currencyRates.length === 0) {
        return res.status(404).json({ message: 'No currency rates found in database' });
      }
      
      console.log("Returning currency rates:", currencyRates.length);
      console.log("Sample EUR:", currencyRates.find((rate: any) => rate.currencyCode === 'EUR'));
      console.log("Sample GBP:", currencyRates.find((rate: any) => rate.currencyCode === 'GBP'));
      
      res.json(currencyRates);
    } catch (error: any) {
      console.error('Error fetching currency rates:', error);
      res.status(500).json({ 
        message: 'Failed to fetch currency rates', 
        error: error.message
      });
    }
  });
  
  // Debug currency rates for a specific country
  app.get('/api/currency-rates/:code', async (req, res) => {
    try {
      const { code } = req.params;
      const { getCurrencyExchangeRate } = await import('./utils/currencyImport');
      
      const rate = await getCurrencyExchangeRate(code.toUpperCase());
      
      if (rate === null) {
        return res.status(404).json({ message: `Currency code ${code} not found` });
      }
      
      res.json({ code: code.toUpperCase(), rate });
    } catch (error: any) {
      console.error(`Error fetching currency rate for ${req.params.code}:`, error);
      res.status(500).json({ 
        message: 'Failed to fetch currency rate', 
        error: error.message
      });
    }
  });
  
  // Import technology costs from Excel
  app.post('/api/admin/import-technology-costs', async (req, res) => {
    try {
      // Import the technology import function
      const { importTechnologyCostsFromExcel } = await import('./utils/technologyImport');
      
      // Build file path - use main CBRE file with TECH sheet
      const filePath = path.join(process.cwd(), 'attached_assets', 'CBRE Fit Out Guide Cost Data_29.01.2024 - Rev 3 - RC OO (2).xlsx');
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File not found at ${filePath}`);
        return res.status(404).json({ message: 'Technology costs Excel file not found' });
      }
      
      // Import technology costs from Excel
      await importTechnologyCostsFromExcel(filePath);
      
      // Fetch the imported data from the database
      const techRecords = await db.select().from(technologyCosts);
      
      res.status(200).json({ 
        message: 'Technology costs imported successfully', 
        count: techRecords.length,
        data: techRecords.slice(0, 5) // Only return first 5 records to avoid huge response
      });
    } catch (error: any) {
      console.error('Error importing technology costs:', error);
      res.status(500).json({ 
        message: 'Failed to import technology costs', 
        error: error.message
      });
    }
  });

  // Import currency rates from Excel
  app.post('/api/admin/import-currency-rates', async (req, res) => {
    try {
      // Import the currency import function
      const { importCurrencyRatesFromExcel } = await import('./utils/currencyImport');
      
      // Build file path - use Budget Template 1
      const filePath = path.join(process.cwd(), 'attached_assets', 'Budget Template 1.xlsx');
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File not found at ${filePath}`);
        return res.status(404).json({ message: 'Currency rates Excel file not found' });
      }
      
      // Import currency rates from Excel
      await importCurrencyRatesFromExcel(filePath);
      
      // Fetch the imported data from the database
      const { getAllCurrencyRates } = await import('./utils/currencyImport');
      const currencyRatesData = await getAllCurrencyRates();
      
      res.status(200).json({ 
        message: 'Currency rates imported successfully', 
        count: currencyRatesData.length,
        data: currencyRatesData.slice(0, 10) // Only return first 10 records to avoid huge response
      });
    } catch (error: any) {
      console.error('Error importing currency rates:', error);
      res.status(500).json({ 
        message: 'Failed to import currency rates', 
        error: error.message
      });
    }
  });

  // Initialize database with reference data
  app.post('/api/admin/initialize-database', async (req, res) => {
    try {
      const { importFitoutCosts = false } = req.body;
      
      // Import the initialization function
      const { initializeDatabase } = await import('./utils/databaseImport');
      
      // Initialize the database with reference data
      await initializeDatabase();
      
      // Optionally import fitout costs from Excel if requested
      if (importFitoutCosts) {
        const filePath = path.join(process.cwd(), 'attached_assets', 'CBRE Fit Out Guide Cost Data_Fitout Only.xlsx');
        if (fs.existsSync(filePath)) {
          await importFitoutCostsFromExcel(filePath);
        }
      }
      
      // Return success response with counts from each table
      const fitoutCostsCount = (await db.select().from(fitoutCosts)).length;
      const specificationsCount = (await db.select().from(specifications)).length;
      const layoutTemplatesCount = (await db.select().from(layoutTemplates)).length;
      const budgetTemplatesCount = (await db.select().from(budgetTemplates)).length;
      
      res.status(200).json({
        message: 'Database initialized successfully',
        counts: {
          fitoutCosts: Number(fitoutCostsCount),
          specifications: Number(specificationsCount),
          layoutTemplates: Number(layoutTemplatesCount),
          budgetTemplates: Number(budgetTemplatesCount)
        }
      });
    } catch (error: any) {
      console.error('Error initializing database:', error);
      res.status(500).json({
        message: 'Failed to initialize database',
        error: error.message
      });
    }
  });

  // Import fit-out costs from Excel endpoint
  app.post('/api/admin/import-fitout-costs', async (req, res) => {
    try {
      console.log("Import endpoint called, current directory:", process.cwd());
      
      // List files in attached_assets directory to verify
      const assetsDir = path.join(process.cwd(), 'attached_assets');
      try {
        const files = fs.readdirSync(assetsDir);
        console.log("Files in attached_assets directory:", files);
      } catch (err) {
        console.error("Error reading attached_assets directory:", err);
      }
      
      // Build file path
      const filePath = path.join(process.cwd(), 'attached_assets', 'CBRE Fit Out Guide Cost Data_Fitout Only.xlsx');
      console.log("Full Excel file path:", filePath);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.error(`File not found at ${filePath}`);
        return res.status(404).json({ message: 'Fit-out costs Excel file not found' });
      }
      
      console.log("File exists, attempting to import...");
      
      // Import Excel data to database
      await importFitoutCostsFromExcel(filePath);
      
      // Fetch the imported data from the database
      console.log("Import complete, checking database for imported records...");
      const importedData = await db.select().from(fitoutCosts);
      console.log(`Found ${importedData.length} imported records`);
      
      res.status(200).json({ 
        message: 'Fit-out costs imported successfully', 
        count: importedData.length,
        data: importedData.slice(0, 5) // Only return first 5 records to avoid huge response
      });
    } catch (error: any) {
      console.error('Error importing fit-out costs:', error);
      res.status(500).json({ 
        message: 'Failed to import fit-out costs', 
        error: error.message, 
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      });
    }
  });

  // Dataset validation endpoint
  app.get('/api/validate-dataset', async (req, res) => {
    try {
      const validation = await validateDataset();
      
      res.status(200).json({
        isValid: validation.isValid,
        datasetName: validation.datasetName,
        timestamp: validation.timestamp,
        issues: validation.issues,
        message: validation.isValid 
          ? 'Dataset validation successful' 
          : 'Dataset validation failed - using incorrect dataset'
      });
    } catch (error: any) {
      console.error('Error validating dataset:', error);
      res.status(500).json({ 
        message: 'Failed to validate dataset', 
        error: error.message
      });
    }
  });

  // Get dataset validation warnings (shorter response for UI)
  app.get('/api/dataset-warnings', async (req, res) => {
    try {
      const warnings = await getDatasetValidationWarnings();
      
      res.status(200).json({
        hasWarnings: warnings.length > 0,
        warnings
      });
    } catch (error: any) {
      console.error('Error getting dataset warnings:', error);
      res.status(500).json({ 
        message: 'Failed to get dataset warnings', 
        error: error.message
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
