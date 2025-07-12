import { db } from './db';
import { users, userProjects, projectShares, auditLogs, type User, type InsertUser, type InsertUserProject, type InsertAuditLog } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { hashPassword } from './auth';

// User management functions
export async function getUserById(id: number): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user;
}

export async function getUserByUsername(username: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.username, username));
  return user;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user;
}

export async function createUser(userData: InsertUser): Promise<User> {
  const [user] = await db
    .insert(users)
    .values(userData)
    .returning();
  return user;
}

export async function updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
  const [user] = await db
    .update(users)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning();
  return user;
}

export async function updateUserPassword(id: number, hashedPassword: string): Promise<void> {
  await db
    .update(users)
    .set({ password: hashedPassword, updatedAt: new Date() })
    .where(eq(users.id, id));
}

export async function deleteUser(id: number): Promise<void> {
  await db.delete(users).where(eq(users.id, id));
}

export async function getAllUsers(): Promise<User[]> {
  return await db.select().from(users);
}

// Project management functions
export async function getUserProjects(userId: number): Promise<any[]> {
  return await db
    .select()
    .from(userProjects)
    .where(eq(userProjects.userId, userId));
}

export async function createUserProject(projectData: InsertUserProject): Promise<any> {
  const [project] = await db
    .insert(userProjects)
    .values(projectData)
    .returning();
  return project;
}

export async function updateUserProject(id: number, updates: Partial<InsertUserProject>): Promise<any> {
  const [project] = await db
    .update(userProjects)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(userProjects.id, id))
    .returning();
  return project;
}

export async function deleteUserProject(id: number): Promise<void> {
  await db.delete(userProjects).where(eq(userProjects.id, id));
}

export async function canUserAccessProject(userId: number, projectId: number): Promise<boolean> {
  // Check if user owns the project
  const [ownedProject] = await db
    .select()
    .from(userProjects)
    .where(and(eq(userProjects.id, projectId), eq(userProjects.userId, userId)));
  
  if (ownedProject) return true;

  // Check if project is shared with user
  const [sharedProject] = await db
    .select()
    .from(projectShares)
    .where(and(eq(projectShares.projectId, projectId), eq(projectShares.sharedWithUserId, userId)));
  
  return !!sharedProject;
}

// Audit logging
export async function logAuditEvent(auditData: InsertAuditLog): Promise<void> {
  await db.insert(auditLogs).values(auditData);
}

// Initialize admin user if not exists
export async function initializeAdminUser(): Promise<void> {
  const adminUser = await getUserByUsername('admin');
  if (!adminUser) {
    const hashedPassword = await hashPassword('admin123');
    await createUser({
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      email: 'okeoluwole@gmail.com',
      passwordResetRequired: false,
    });
    console.log('Admin user created with username: admin, password: admin123');
  }
}

// Initialize test users
export async function initializeTestUsers(): Promise<void> {
  const testUsers = [
    { username: 'testuser1', password: 'password123', email: 'testuser1@example.com' },
    { username: 'testuser2', password: 'password234', email: 'testuser2@example.com' },
    { username: 'testuser3', password: 'password345', email: 'testuser3@example.com' },
    { username: 'testuser4', password: 'password456', email: 'testuser4@example.com' },
    { username: 'testuser5', password: 'password567', email: 'testuser5@example.com' },
  ];

  for (const userData of testUsers) {
    const existingUser = await getUserByUsername(userData.username);
    if (!existingUser) {
      const hashedPassword = await hashPassword(userData.password);
      await createUser({
        username: userData.username,
        password: hashedPassword,
        role: 'staff',
        email: userData.email,
        passwordResetRequired: false,
      });
    }
  }
  console.log('Test users initialized');
}