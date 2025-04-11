import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";
import { FitoutCostData, SpecificationData, BudgetCategory } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes with /api prefix
  
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
      const budget = await storage.createBudget(req.body);
      res.status(201).json(budget);
    } catch (error) {
      res.status(400).json({ message: 'Failed to create budget' });
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

  // Fitout cost data
  app.get('/api/fitout-costs', (req, res) => {
    try {
      const dataPath = path.join(process.cwd(), 'data', 'fitout_costs.json');
      if (!fs.existsSync(dataPath)) {
        return res.status(404).json({ message: 'Fitout cost data not found' });
      }
      
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as FitoutCostData[];
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch fitout cost data' });
    }
  });

  // Countries and cities
  app.get('/api/locations', (req, res) => {
    try {
      const dataPath = path.join(process.cwd(), 'data', 'fitout_costs.json');
      if (!fs.existsSync(dataPath)) {
        return res.status(404).json({ message: 'Location data not found' });
      }
      
      const fitoutData = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as FitoutCostData[];
      
      // Extract unique countries and their cities
      const locations: { [country: string]: string[] } = {};
      
      fitoutData.forEach(item => {
        if (!locations[item.country]) {
          locations[item.country] = [];
        }
        if (!locations[item.country].includes(item.city)) {
          locations[item.country].push(item.city);
        }
      });
      
      res.json(locations);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch locations' });
    }
  });

  // Specifications
  app.get('/api/specifications', (req, res) => {
    try {
      const dataPath = path.join(process.cwd(), 'data', 'specifications.json');
      if (!fs.existsSync(dataPath)) {
        return res.status(404).json({ message: 'Specifications data not found' });
      }
      
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as SpecificationData[];
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch specifications' });
    }
  });

  // Budget template structure
  app.get('/api/budget-template', (req, res) => {
    try {
      const dataPath = path.join(process.cwd(), 'data', 'budget_template_structure.json');
      if (!fs.existsSync(dataPath)) {
        return res.status(404).json({ message: 'Budget template structure not found' });
      }
      
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as BudgetCategory[];
      res.json(data);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch budget template structure' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
