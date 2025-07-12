import { pgTable, text, serial, integer, real, boolean, timestamp, json, numeric, jsonb, varchar, inet, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enterprise user management schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(), // bcrypt hashed
  role: varchar("role", { length: 20 }).notNull().default("staff"), // 'admin' or 'staff'
  email: varchar("email", { length: 100 }).unique(),
  passwordResetRequired: boolean("password_reset_required").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session management for persistent authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User project storage for saved budget estimates
export const userProjects = pgTable("user_projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  projectData: jsonb("project_data").notNull(), // Complete project configuration
  dataSource: varchar("data_source", { length: 50 }).notNull(), // 'CBRE' or 'Turner & Townsend'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Project sharing capabilities between users
export const projectShares = pgTable("project_shares", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => userProjects.id, { onDelete: 'cascade' }).notNull(),
  sharedWithUserId: integer("shared_with_user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  permissionLevel: varchar("permission_level", { length: 20 }).default("view").notNull(), // 'view' or 'edit'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Audit logging for compliance and tracking
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 50 }),
  resourceId: integer("resource_id"),
  details: jsonb("details"),
  ipAddress: inet("ip_address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserProjectSchema = createInsertSchema(userProjects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectShareSchema = createInsertSchema(projectShares).omit({
  id: true,
  createdAt: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type UpsertUser = typeof users.$inferInsert;
export type InsertUserProject = z.infer<typeof insertUserProjectSchema>;
export type UserProject = typeof userProjects.$inferSelect;
export type InsertProjectShare = z.infer<typeof insertProjectShareSchema>;
export type ProjectShare = typeof projectShares.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;

// Project schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
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
  scope: text("scope").default("Fitout").notNull(), // Fitout, Furniture, Both
  specification: text("specification").notNull(), // Bronze, Silver, Gold
  fitoutSpecification: text("fitout_specification"), // For separate fitout specs
  furnitureSpecification: text("furniture_specification"), // For separate furniture specs
  technologySpecification: text("technology_specification"), // For technology specs
  layout: text("layout").notNull(), // Activity, Team, Event
  primaryDataSource: text("primary_data_source").$type<DataSourceType>().default("CBRE").notNull(), // CBRE, JLL, TT
  dataSource: text("data_source"), // For backward compatibility
  jllLayout: text("jll_layout"), // Open & flexible, High spatial variety, Structured
  jllQuality: text("jll_quality"), // Baseline, Medium, High
  ttComponentSpecs: json("tt_component_specs"), // T&T component-specific specifications
  spaceAllocation: json("space_allocation").notNull(),
  totalCost: real("total_cost"),
  fitoutCost: real("fitout_cost"),
  furnitureCost: real("furniture_cost"),
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

// Data Source Types
export type DataSourceType = 'CBRE' | 'JLL' | 'TT';
export type PrimaryDataSourceType = 'CBRE' | 'JLL' | 'TT';
export type JLLLayout = 'Open & flexible' | 'High spatial variety' | 'Structured';
export type JLLQuality = 'Baseline' | 'Medium' | 'High';

// Legacy Types
export type Specification = 'Bronze' | 'Silver' | 'Gold';
export type Layout = 'Activity' | 'Team' | 'Event';
export type BudgetScope = 'Fitout' | 'Furniture' | 'technology' | 'AudioVisual' | 'Complete' | 'Construction' | 'LooseFurniture' | 'ProfessionalFees' | 'Both';

// Budget model to hold selected data source
export const budgetDataSources = pgTable("budget_data_sources", {
  id: serial("id").primaryKey(),
  budgetId: integer("budget_id").notNull().references(() => budgets.id),
  dataSource: text("data_source").notNull(), // CBRE, JLL, TT
  isComparisonEnabled: boolean("is_comparison_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertBudgetDataSourceSchema = createInsertSchema(budgetDataSources).omit({ 
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertBudgetDataSource = z.infer<typeof insertBudgetDataSourceSchema>;
export type BudgetDataSource = typeof budgetDataSources.$inferSelect;

// Data sources table for metadata
export const dataSources = pgTable("data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  displayName: text("display_name").notNull(),
  description: text("description").notNull(),
  version: text("version").notNull(),
  releaseDate: text("release_date").notNull(),
  countries: jsonb("countries").notNull(), // Array of country names
  logoUrl: text("logo_url"),
  isEnabled: boolean("is_enabled").default(true),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertDataSourceSchema = createInsertSchema(dataSources).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertDataSource = z.infer<typeof insertDataSourceSchema>;
export type DataSource = typeof dataSources.$inferSelect;

// JLL cost data
export const jllCosts = pgTable("jll_costs", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  region: text("region").notNull(), // NAM, LATAM, EMEA, APAC
  
  // Open & flexible layout costs
  openFlexBaselineSqm: numeric("open_flex_baseline_sqm"),
  openFlexMediumSqm: numeric("open_flex_medium_sqm"),
  openFlexHighSqm: numeric("open_flex_high_sqm"),
  
  // High spatial variety layout costs
  spatialVarietyBaselineSqm: numeric("spatial_variety_baseline_sqm"),
  spatialVarietyMediumSqm: numeric("spatial_variety_medium_sqm"),
  spatialVarietyHighSqm: numeric("spatial_variety_high_sqm"),
  
  // Structured layout costs
  structuredBaselineSqm: numeric("structured_baseline_sqm"),
  structuredMediumSqm: numeric("structured_medium_sqm"),
  structuredHighSqm: numeric("structured_high_sqm"),
  
  // Cost breakdown percentages
  buildersWorksPercentage: numeric("builders_works_percentage"), // Global average: 37%
  mAndEServicesPercentage: numeric("m_and_e_services_percentage"), // Global average: 29%
  furnitureFixturesEquipmentPercentage: numeric("furniture_fixtures_equipment_percentage"), // Global average: 13%
  securityITAVPercentage: numeric("security_it_av_percentage"), // Global average: 12%
  professionalServicesPercentage: numeric("professional_services_percentage"), // Global average: 8%
  
  // City cost index (London = 1)
  costIndex: numeric("cost_index"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});

export const insertJllCostSchema = createInsertSchema(jllCosts).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export type InsertJllCost = z.infer<typeof insertJllCostSchema>;
export type JllCost = typeof jllCosts.$inferSelect;

// JLL specification mapping table
export const jllSpecifications = pgTable("jll_specifications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Baseline, Medium, High
  description: text("description").notNull(),
  sustainabilityCriteria: text("sustainability_criteria"),
  recommendedFor: text("recommended_for")
});

export const insertJllSpecificationSchema = createInsertSchema(jllSpecifications).omit({
  id: true
});

export type InsertJllSpecification = z.infer<typeof insertJllSpecificationSchema>;
export type JllSpecification = typeof jllSpecifications.$inferSelect;

// JLL layout templates table
export const jllLayoutTemplates = pgTable("jll_layout_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // Open & flexible, High spatial variety, Structured
  description: text("description").notNull(),
  benefits: text("benefits").notNull(), // JSON string with array of benefits
  defaultAllocation: json("default_allocation").notNull() // JSON with default space allocation percentages
});

export const insertJllLayoutTemplateSchema = createInsertSchema(jllLayoutTemplates).omit({
  id: true
});

export type InsertJllLayoutTemplate = z.infer<typeof insertJllLayoutTemplateSchema>;
export type JllLayoutTemplate = typeof jllLayoutTemplates.$inferSelect;

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

// Technology costs database schema
export const technologyCosts = pgTable("technology_costs", {
  id: serial("id").primaryKey(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  region: text("region").notNull(),
  
  // Activity layout technology costs
  activityLowSqm: numeric("activity_low_sqm"),
  activityMediumSqm: numeric("activity_medium_sqm"),
  activityHighSqm: numeric("activity_high_sqm"),
  activityLowSqft: numeric("activity_low_sqft"),
  activityMediumSqft: numeric("activity_medium_sqft"),
  activityHighSqft: numeric("activity_high_sqft"),
  
  // Team layout technology costs
  teamLowSqm: numeric("team_low_sqm"),
  teamMediumSqm: numeric("team_medium_sqm"),
  teamHighSqm: numeric("team_high_sqm"),
  teamLowSqft: numeric("team_low_sqft"),
  teamMediumSqft: numeric("team_medium_sqft"),
  teamHighSqft: numeric("team_high_sqft"),
  
  // Event layout technology costs
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
  
  // Inflation rate
  inflationRate: numeric("inflation_rate")
});

export const insertTechnologyCostSchema = createInsertSchema(technologyCosts).omit({
  id: true
});

export type InsertTechnologyCost = z.infer<typeof insertTechnologyCostSchema>;
export type TechnologyCost = typeof technologyCosts.$inferSelect;

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
