import { pgTable, text, serial, integer, real, boolean, timestamp, json, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Project schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  reference: text("reference"),
  country: text("country").notNull(),
  city: text("city").notNull(),
  totalArea: real("total_area").notNull(),
  areaUnit: text("area_unit").notNull(),
  startDate: text("start_date"),
  currency: text("currency").notNull(),
  inflationRate: real("inflation_rate"),
  status: text("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertProjectSchema = createInsertSchema(projects).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

// Budget schema
export const budgets = pgTable("budgets", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  version: integer("version").notNull().default(1),
  name: text("name").notNull(),
  specification: text("specification").notNull(), // Bronze, Silver, Gold
  layout: text("layout").notNull(), // Activity, Team, Event
  spaceAllocation: json("space_allocation").notNull(),
  totalCost: real("total_cost"),
  localCurrencyCode: text("local_currency_code").default("USD"),
  localCurrencyRate: real("local_currency_rate"),
  localCurrencyTotalCost: real("local_currency_total_cost"),
  costsBreakdown: json("costs_breakdown"),
  status: text("status").default("draft").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertBudgetSchema = createInsertSchema(budgets).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

// Types
export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type Budget = typeof budgets.$inferSelect;

export type Specification = 'Bronze' | 'Silver' | 'Gold';
export type Layout = 'Activity' | 'Team' | 'Event';
export type BudgetScope = 'Fitout' | 'Furniture' | 'Both';

// Fit-out cost data
export type FitoutCostData = {
  country: string;
  city: string;
  region: string;
  costs: {
    sqm: {
      Activity: {
        Low: number;
        Medium: number;
        High: number;
      };
      Team: {
        Low: number;
        Medium: number;
        High: number;
      };
      Event: {
        Low: number;
        Medium: number;
        High: number;
      };
    };
    sqft: {
      Activity: {
        Low: number;
        Medium: number;
        High: number;
      };
      Team: {
        Low: number;
        Medium: number;
        High: number;
      };
      Event: {
        Low: number;
        Medium: number;
        High: number;
      };
    };
  };
  locationFactors: {
    EMEA: number;
    AMERICA: number;
    APAC: number;
  };
  professionalFees: string; // Decimal percentage as a string, e.g., "0.15" for 15%
};

export type SpecificationData = {
  name: Specification;
  description: string;
  walls: string;
  partitions: {
    type: string;
    acousticRating: string;
    costFactor: number;
  };
  flooring: string;
  ceiling: string;
  furniture: {
    desks: string;
    chairs: string;
    storage: string;
  };
  technology: {
    av: string;
    security: string;
  };
  fittings: string;
  recommendedFor: string;
};

export type BudgetCategory = {
  name: string;
  subcategories: BudgetSubcategory[];
};

export type BudgetSubcategory = {
  name: string;
  lineItems: BudgetLineItem[];
};

export type BudgetLineItem = {
  name: string;
  defaultFactor: number | null;
};

export type SpaceAllocation = {
  [type: string]: {
    percentage: number;
    area: number;
  };
};

// Fit-out costs database schema
export const fitoutCosts = pgTable("fitout_costs", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  region: text("region").notNull(),
  
  // Activity layout costs
  activityLowSqm: numeric("activity_low_sqm"),
  activityMediumSqm: numeric("activity_medium_sqm"),
  activityHighSqm: numeric("activity_high_sqm"),
  activityLowSqft: numeric("activity_low_sqft"),
  activityMediumSqft: numeric("activity_medium_sqft"),
  activityHighSqft: numeric("activity_high_sqft"),
  
  // Team layout costs
  teamLowSqm: numeric("team_low_sqm"),
  teamMediumSqm: numeric("team_medium_sqm"),
  teamHighSqm: numeric("team_high_sqm"),
  teamLowSqft: numeric("team_low_sqft"),
  teamMediumSqft: numeric("team_medium_sqft"),
  teamHighSqft: numeric("team_high_sqft"),
  
  // Event layout costs
  eventLowSqm: numeric("event_low_sqm"),
  eventMediumSqm: numeric("event_medium_sqm"),
  eventHighSqm: numeric("event_high_sqm"),
  eventLowSqft: numeric("event_low_sqft"),
  eventMediumSqft: numeric("event_medium_sqft"),
  eventHighSqft: numeric("event_high_sqft"),
  
  // Location factors
  locationFactorEMEA: numeric("location_factor_emea"),
  locationFactorAMERICA: numeric("location_factor_america"),
  locationFactorAPAC: numeric("location_factor_apac"),
  
  // Professional fees percentage (expressed as decimal, e.g., 0.15 for 15%)
  professionalFees: numeric("professional_fees")
});

export const insertFitoutCostSchema = createInsertSchema(fitoutCosts).omit({
  id: true
});

export type InsertFitoutCost = z.infer<typeof insertFitoutCostSchema>;
export type FitoutCost = typeof fitoutCosts.$inferSelect;

// Specification details table
export const specifications = pgTable("specifications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Bronze, Silver, Gold
  description: text("description").notNull(),
  walls: text("walls").notNull(),
  partitionType: text("partition_type").notNull(),
  partitionAcousticRating: text("partition_acoustic_rating").notNull(),
  partitionCostFactor: numeric("partition_cost_factor").notNull(),
  flooring: text("flooring").notNull(),
  ceiling: text("ceiling").notNull(),
  furnitureDesks: text("furniture_desks").notNull(),
  furnitureChairs: text("furniture_chairs").notNull(),
  furnitureStorage: text("furniture_storage").notNull(),
  technologyAV: text("technology_av").notNull(),
  technologySecurity: text("technology_security").notNull(),
  fittings: text("fittings").notNull(),
  recommendedFor: text("recommended_for").notNull()
});

export const insertSpecificationSchema = createInsertSchema(specifications).omit({
  id: true
});

export type InsertSpecification = z.infer<typeof insertSpecificationSchema>;
export type SpecificationRecord = typeof specifications.$inferSelect;

// Layout templates table
export const layoutTemplates = pgTable("layout_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Activity, Team, Event
  description: text("description").notNull(),
  benefits: text("benefits").notNull(), // JSON string with array of benefits
  defaultAllocation: json("default_allocation").notNull() // JSON with default space allocation percentages
});

export const insertLayoutTemplateSchema = createInsertSchema(layoutTemplates).omit({
  id: true
});

export type InsertLayoutTemplate = z.infer<typeof insertLayoutTemplateSchema>;
export type LayoutTemplate = typeof layoutTemplates.$inferSelect;

// Budget template structure
export const budgetTemplates = pgTable("budget_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  structure: json("structure").notNull() // JSON with budget categories, subcategories, and line items
});

export const insertBudgetTemplateSchema = createInsertSchema(budgetTemplates).omit({
  id: true
});

export type InsertBudgetTemplate = z.infer<typeof insertBudgetTemplateSchema>;
export type BudgetTemplate = typeof budgetTemplates.$inferSelect;

// Chat-related schema
export const chatSessions = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").references(() => chatSessions.id).notNull(),
  role: text("role", { enum: ["user", "assistant", "system"] }).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: json("metadata"),
});

export const insertChatSessionSchema = createInsertSchema(chatSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertChatMessageSchema = createInsertSchema(chatMessages);

export type InsertChatSession = z.infer<typeof insertChatSessionSchema>;
export type ChatSession = typeof chatSessions.$inferSelect;

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

// Currency exchange rates
export const currencyRates = pgTable("currency_rates", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  currencyName: text("currency_name").notNull(),
  currencyCode: text("currency_code").notNull().unique(),
  exchangeRate: numeric("exchange_rate", { precision: 18, scale: 8 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCurrencyRateSchema = createInsertSchema(currencyRates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertCurrencyRate = z.infer<typeof insertCurrencyRateSchema>;
export type CurrencyRate = typeof currencyRates.$inferSelect;

// Furniture costs database schema
export const furnitureCosts = pgTable("furniture_costs", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  region: text("region").notNull(),
  
  // Activity layout costs
  activityLowSqm: numeric("activity_low_sqm"),
  activityMediumSqm: numeric("activity_medium_sqm"),
  activityHighSqm: numeric("activity_high_sqm"),
  activityLowSqft: numeric("activity_low_sqft"),
  activityMediumSqft: numeric("activity_medium_sqft"),
  activityHighSqft: numeric("activity_high_sqft"),
  
  // Team layout costs
  teamLowSqm: numeric("team_low_sqm"),
  teamMediumSqm: numeric("team_medium_sqm"),
  teamHighSqm: numeric("team_high_sqm"),
  teamLowSqft: numeric("team_low_sqft"),
  teamMediumSqft: numeric("team_medium_sqft"),
  teamHighSqft: numeric("team_high_sqft"),
  
  // Event layout costs
  eventLowSqm: numeric("event_low_sqm"),
  eventMediumSqm: numeric("event_medium_sqm"),
  eventHighSqm: numeric("event_high_sqm"),
  eventLowSqft: numeric("event_low_sqft"),
  eventMediumSqft: numeric("event_medium_sqft"),
  eventHighSqft: numeric("event_high_sqft"),
  
  // Location factors
  locationFactorEMEA: numeric("location_factor_emea"),
  locationFactorAMERICA: numeric("location_factor_america"),
  locationFactorAPAC: numeric("location_factor_apac")
});

export const insertFurnitureCostSchema = createInsertSchema(furnitureCosts).omit({
  id: true
});

export type InsertFurnitureCost = z.infer<typeof insertFurnitureCostSchema>;
export type FurnitureCost = typeof furnitureCosts.$inferSelect;

// Furniture cost data type
export type FurnitureCostData = {
  country: string;
  city: string;
  region: string;
  costs: {
    sqm: {
      Activity: {
        Low: number;
        Medium: number;
        High: number;
      };
      Team: {
        Low: number;
        Medium: number;
        High: number;
      };
      Event: {
        Low: number;
        Medium: number;
        High: number;
      };
    };
    sqft: {
      Activity: {
        Low: number;
        Medium: number;
        High: number;
      };
      Team: {
        Low: number;
        Medium: number;
        High: number;
      };
      Event: {
        Low: number;
        Medium: number;
        High: number;
      };
    };
  };
  locationFactors: {
    EMEA: number;
    AMERICA: number;
    APAC: number;
  };
};
