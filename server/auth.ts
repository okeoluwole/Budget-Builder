import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction } from 'express';

// Password security implementation
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// Password strength validation
export function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain number');
  
  return { valid: errors.length === 0, errors };
}

// Authentication middleware
export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated()) {
    return next();
  }
  return res.status(401).json({ error: 'Authentication required' });
}

// Admin-only route protection
export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.isAuthenticated() && (req.user as any)?.role === 'admin') {
    return next();
  }
  return res.status(403).json({ error: 'Admin access required' });
}

// Project ownership verification
export async function canAccessProject(req: Request, res: Response, next: NextFunction) {
  try {
    const projectId = parseInt(req.params.id);
    const userId = (req.user as any)?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user owns project or has shared access
    // This will be implemented when we have the user service
    next();
  } catch (error) {
    res.status(500).json({ error: 'Failed to verify project access' });
  }
}

// Audit logging helper
export function logAuditEvent(
  userId: number,
  action: string,
  resourceType: string | null,
  resourceId: number | null,
  details: any,
  ipAddress?: string
) {
  // This will be implemented when we have the audit service
  console.log(`AUDIT: User ${userId} performed ${action} on ${resourceType}:${resourceId}`, details);
}