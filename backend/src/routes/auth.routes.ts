import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { ENV } from '../config/env.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { ROLE_PERMISSIONS, RoleType } from '../middleware/rbac.js';

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  workspaceName: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

function generateToken(userId: string, email: string) {
  return jwt.sign({ id: userId, email }, ENV.JWT_SECRET, {
    expiresIn: ENV.JWT_EXPIRES_IN as any
  });
}

// -----------------------------------------------------------------------------
// POST /api/auth/register
// -----------------------------------------------------------------------------
router.post('/register', async (req: Request, res: Response) => {
  try {
    const parse = registerSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.format() });
    }

    const { name, email, password, workspaceName } = parse.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Create user as OWNER of their new workspace
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'OWNER'
      }
    });

    const orgSlug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-org-${Date.now().toString(36)}`;
    const wsSlug = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-ws-${Date.now().toString(36)}`;

    const org = await prisma.organization.create({
      data: {
        name: `${name}'s Organization`,
        slug: orgSlug
      }
    });

    const workspace = await prisma.workspace.create({
      data: {
        name: workspaceName || `${name}'s Workspace`,
        slug: wsSlug,
        organizationId: org.id
      }
    });

    await prisma.membership.create({
      data: {
        userId: user.id,
        workspaceId: workspace.id,
        role: 'OWNER'
      }
    });

    const token = generateToken(user.id, user.email);

    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        permissions: ROLE_PERMISSIONS[user.role as RoleType] || []
      }
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during registration' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/auth/login
// -----------------------------------------------------------------------------
router.post('/login', async (req: Request, res: Response) => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, errors: parse.error.format() });
    }

    const { email, password } = parse.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        memberships: {
          include: {
            workspace: true
          },
          take: 1
        }
      }
    });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user.id, user.email);
    const activeMembership = user.memberships[0];

    return res.json({
      success: true,
      message: 'Authentication successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        title: user.title,
        department: user.department,
        workspaceId: activeMembership?.workspaceId,
        workspaceName: activeMembership?.workspace?.name,
        permissions: ROLE_PERMISSIONS[user.role as RoleType] || []
      }
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error during login' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/auth/demo-login (1-Click instant demo login for all 4 roles)
// -----------------------------------------------------------------------------
router.post('/demo-login', async (req: Request, res: Response) => {
  try {
    const { role } = req.body; // 'OWNER' | 'PROJECT_MANAGER' | 'EDITOR' | 'VIEWER'

    const emailMap: Record<string, string> = {
      OWNER: 'admin@nexus.ai',
      PROJECT_MANAGER: 'pm@nexus.ai',
      EDITOR: 'dev@nexus.ai',
      VIEWER: 'viewer@nexus.ai'
    };

    const targetEmail = emailMap[role] || 'admin@nexus.ai';

    let user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: {
        memberships: {
          include: { workspace: true },
          take: 1
        }
      }
    });

    // If user not found, seed might not have run yet, run on-demand or create
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `Demo user ${targetEmail} not found. Please run seed script or database setup.`
      });
    }

    const token = generateToken(user.id, user.email);
    const activeMembership = user.memberships[0];

    return res.json({
      success: true,
      message: `Signed in as Demo Persona (${user.name} - ${user.role})`,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        title: user.title,
        department: user.department,
        workspaceId: activeMembership?.workspaceId,
        workspaceName: activeMembership?.workspace?.name,
        permissions: ROLE_PERMISSIONS[user.role as RoleType] || []
      }
    });
  } catch (error: any) {
    console.error('Demo login error:', error);
    return res.status(500).json({ success: false, message: 'Demo login failed' });
  }
});

// -----------------------------------------------------------------------------
// GET /api/auth/me
// -----------------------------------------------------------------------------
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        memberships: {
          include: {
            workspace: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found' });
    }

    const activeMembership = user.memberships[0];

    return res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        title: user.title,
        department: user.department,
        bio: user.bio,
        workspaceId: activeMembership?.workspaceId,
        workspaceName: activeMembership?.workspace?.name,
        permissions: ROLE_PERMISSIONS[user.role as RoleType] || []
      }
    });
  } catch (error: any) {
    console.error('Auth/me error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch current user' });
  }
});

// -----------------------------------------------------------------------------
// POST /api/auth/logout
// -----------------------------------------------------------------------------
router.post('/logout', (req: Request, res: Response) => {
  return res.json({ success: true, message: 'Logged out successfully' });
});

export default router;
