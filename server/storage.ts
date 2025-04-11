import { 
  users, projects, budgets,
  type User, type InsertUser,
  type Project, type InsertProject,
  type Budget, type InsertBudget
} from "@shared/schema";
import { db } from './db';
import { eq } from 'drizzle-orm';

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations
  getAllProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Budget operations
  getAllBudgets(): Promise<Budget[]>;
  getBudget(id: number): Promise<Budget | undefined>;
  getBudgetsByProject(projectId: number): Promise<Budget[]>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudget(id: number, budget: Partial<InsertBudget>): Promise<Budget | undefined>;
  deleteBudget(id: number): Promise<boolean>;
  
  // Chat operations
  createChatSession(session: InsertChatSession): Promise<ChatSession>;
  getChatSession(id: number): Promise<ChatSession | undefined>;
  getAllChatSessions(userId?: number): Promise<ChatSession[]>;
  updateChatSession(id: number, title: string): Promise<ChatSession | undefined>;
  deleteChatSession(id: number): Promise<boolean>;
  
  addChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessagesBySession(sessionId: number): Promise<ChatMessage[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Project operations
  async getAllProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db.select().from(projects).where(eq(projects.id, id));
    return project || undefined;
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const now = new Date();
    const projectData = {
      ...insertProject,
      status: insertProject.status || 'draft',
      reference: insertProject.reference || null,
      startDate: insertProject.startDate || null,
      inflationRate: insertProject.inflationRate || null,
      createdAt: now,
      updatedAt: now
    };
    const [project] = await db
      .insert(projects)
      .values(projectData)
      .returning();
    return project;
  }

  async updateProject(id: number, projectUpdate: Partial<InsertProject>): Promise<Project | undefined> {
    // Get existing project to merge with updates
    const existingProject = await this.getProject(id);
    if (!existingProject) return undefined;
    
    const updateData = {
      ...projectUpdate,
      // Ensure required fields are always present
      status: projectUpdate.status || existingProject.status,
      reference: 'reference' in projectUpdate ? projectUpdate.reference : existingProject.reference,
      startDate: 'startDate' in projectUpdate ? projectUpdate.startDate : existingProject.startDate,
      inflationRate: 'inflationRate' in projectUpdate ? projectUpdate.inflationRate : existingProject.inflationRate,
      updatedAt: new Date()
    };
    
    const [project] = await db
      .update(projects)
      .set(updateData)
      .where(eq(projects.id, id))
      .returning();
    return project || undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    const result = await db
      .delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });
    return result.length > 0;
  }

  // Budget operations
  async getAllBudgets(): Promise<Budget[]> {
    return await db.select().from(budgets);
  }

  async getBudget(id: number): Promise<Budget | undefined> {
    const [budget] = await db.select().from(budgets).where(eq(budgets.id, id));
    return budget || undefined;
  }

  async getBudgetsByProject(projectId: number): Promise<Budget[]> {
    return await db.select().from(budgets).where(eq(budgets.projectId, projectId));
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const now = new Date();
    const budgetData = {
      ...insertBudget,
      status: insertBudget.status || 'draft',
      version: insertBudget.version || 1,
      totalCost: insertBudget.totalCost || null,
      createdAt: now,
      updatedAt: now
    };
    const [budget] = await db
      .insert(budgets)
      .values(budgetData)
      .returning();
    return budget;
  }

  async updateBudget(id: number, budgetUpdate: Partial<InsertBudget>): Promise<Budget | undefined> {
    // Get existing budget to merge with updates
    const existingBudget = await this.getBudget(id);
    if (!existingBudget) return undefined;
    
    const updateData = {
      ...budgetUpdate,
      // Ensure required fields are always present
      status: budgetUpdate.status || existingBudget.status,
      version: budgetUpdate.version || existingBudget.version,
      updatedAt: new Date()
    };
    
    const [budget] = await db
      .update(budgets)
      .set(updateData)
      .where(eq(budgets.id, id))
      .returning();
    return budget || undefined;
  }

  async deleteBudget(id: number): Promise<boolean> {
    const result = await db
      .delete(budgets)
      .where(eq(budgets.id, id))
      .returning({ id: budgets.id });
    return result.length > 0;
  }
  
  // Chat Session operations
  async createChatSession(session: InsertChatSession): Promise<ChatSession> {
    const now = new Date();
    const sessionData = {
      ...session,
      createdAt: now,
      updatedAt: now
    };
    
    const [chatSession] = await db
      .insert(chatSessions)
      .values(sessionData)
      .returning();
    return chatSession;
  }
  
  async getChatSession(id: number): Promise<ChatSession | undefined> {
    const [session] = await db.select().from(chatSessions).where(eq(chatSessions.id, id));
    return session || undefined;
  }
  
  async getAllChatSessions(userId?: number): Promise<ChatSession[]> {
    if (userId) {
      return await db.select()
        .from(chatSessions)
        .where(eq(chatSessions.userId, userId))
        .orderBy(chatSessions.updatedAt);
    }
    return await db.select().from(chatSessions).orderBy(chatSessions.updatedAt);
  }
  
  async updateChatSession(id: number, title: string): Promise<ChatSession | undefined> {
    const [session] = await db
      .update(chatSessions)
      .set({
        title,
        updatedAt: new Date()
      })
      .where(eq(chatSessions.id, id))
      .returning();
    return session || undefined;
  }
  
  async deleteChatSession(id: number): Promise<boolean> {
    // First delete all messages in the session
    await db.delete(chatMessages).where(eq(chatMessages.sessionId, id));
    
    // Then delete the session itself
    const result = await db
      .delete(chatSessions)
      .where(eq(chatSessions.id, id))
      .returning({ id: chatSessions.id });
    return result.length > 0;
  }
  
  // Chat Message operations
  async addChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [chatMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
      
    // Update the session's updatedAt timestamp
    await db
      .update(chatSessions)
      .set({ updatedAt: new Date() })
      .where(eq(chatSessions.id, message.sessionId));
      
    return chatMessage;
  }
  
  async getChatMessagesBySession(sessionId: number): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.timestamp);
  }
}

export const storage = new DatabaseStorage();
