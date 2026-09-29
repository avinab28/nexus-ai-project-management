import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { ENV } from './config/env.js';
import { connectDB, prisma } from './config/db.js';
import authRoutes from './routes/auth.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import timeRoutes from './routes/time.routes.js';
import calendarRoutes from './routes/calendar.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import aiRoutes from './routes/ai.routes.js';
import workspaceRoutes from './routes/workspace.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import activityRoutes from './routes/activity.routes.js';
import permissionRoutes from './routes/permission.routes.js';
import { authenticate, AuthRequest } from './middleware/auth.js';

const app = express();

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false
}));

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    platform: 'NEXUS — AI Project Management & Workflow Control Platform',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Global Search (CTRL+K Command Palette Backend)
app.get('/api/search', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q || q.trim().length === 0) {
      return res.json({ success: true, results: { projects: [], tasks: [], users: [], comments: [] } });
    }

    const query = q.trim();

    const [projects, tasks, users, comments] = await Promise.all([
      prisma.project.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { description: { contains: query } }
          ]
        },
        select: { id: true, name: true, color: true, status: true, priority: true },
        take: 5
      }),
      prisma.task.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { description: { contains: query } }
          ]
        },
        select: { id: true, title: true, status: true, priority: true, projectId: true },
        take: 8
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { email: { contains: query } },
            { title: { contains: query } }
          ]
        },
        select: { id: true, name: true, email: true, avatarUrl: true, role: true },
        take: 5
      }),
      prisma.comment.findMany({
        where: {
          content: { contains: query }
        },
        select: { id: true, content: true, taskId: true, user: { select: { name: true } } },
        take: 5
      })
    ]);

    return res.json({
      success: true,
      results: {
        projects,
        tasks,
        users,
        comments
      }
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return res.status(500).json({ success: false, message: 'Search execution failed' });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/time', timeRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/permissions', permissionRoutes);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Endpoint ${req.method} ${req.url} does not exist.`
  });
});

// Centralized Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error occurred',
    ...(ENV.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
});

// Initialize DB and Start Server
async function startServer() {
  await connectDB();
  app.listen(ENV.PORT, () => {
    console.log(`🚀 NEXUS API Server is running on http://localhost:${ENV.PORT}`);
    console.log(`📡 Environment: ${ENV.NODE_ENV}`);
  });
}

startServer();

export default app;
