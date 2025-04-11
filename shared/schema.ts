import { pgTable, text, serial, integer, real, boolean, timestamp, json } from "drizzle-orm/pg-core";
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
