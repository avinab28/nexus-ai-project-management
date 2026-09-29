import { Router, Response } from 'express';
import { prisma } from '../config/db.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { 
  ROLE_PERMISSIONS, 
  DYNAMIC_ROLE_REGISTRY, 
  registerCustomRole, 
  removeCustomRole, 
  PermissionName,
  requirePermission 
} from '../middleware/rbac.js';
import { logActivity } from '../services/activity.service.js';

const router = Router();

// Helper to ensure DB custom roles are loaded into the in-memory RBAC registry
let isInitialized = false;
async function syncCustomRolesFromDb() {
  if (isInitialized) return;
  try {
    const customRoles = await prisma.customRole.findMany();
    for (const r of customRoles) {
      let perms: PermissionName[] = [];
      try {
        perms = JSON.parse(r.permissions);
      } catch {
        perms = [];
      }
      registerCustomRole(r.key, r.name, r.description || '', r.color, perms);
    }
    isInitialized = true;
  } catch (err) {
    console.error('Failed to sync custom roles from DB:', err);
  }
}

// -----------------------------------------------------------------------------
// GET /api/permissions/matrix - Get granular permission matrix (system + custom)
// -----------------------------------------------------------------------------
router.get('/matrix', authenticate, async (req: AuthRequest, res: Response) => {
  await syncCustomRolesFromDb();

  const roles = Object.entries(DYNAMIC_ROLE_REGISTRY).map(([key, val]) => ({
    role: key,
    name: val.name,
    description: val.description,
    color: val.color,
    isSystem: val.isSystem,
    permissions: val.permissions
  }));

  const userRole = (req.user?.role || 'VIEWER').toUpperCase();
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];

  return res.json({
    success: true,
    roles,
    userRole,
    userPermissions
  });
});

// -----------------------------------------------------------------------------
// GET /api/permissions/roles - Get list of all available roles
// -----------------------------------------------------------------------------
router.get('/roles', authenticate, async (req: AuthRequest, res: Response) => {
  await syncCustomRolesFromDb();

  const roles = Object.entries(DYNAMIC_ROLE_REGISTRY).map(([key, val]) => ({
    key,
    name: val.name,
    description: val.description,
    color: val.color,
    isSystem: val.isSystem,
    permissions: val.permissions
  }));

  return res.json({ success: true, roles });
});

// -----------------------------------------------------------------------------
// POST /api/permissions/roles - Create a new custom role with custom permissions
// -----------------------------------------------------------------------------
router.post('/roles', authenticate, requirePermission('settings.manage'), async (req: AuthRequest, res: Response) => {
  try {
    await syncCustomRolesFromDb();

    const { name, key, description, color, permissions } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Role name is required' });
    }

    const generatedKey = (key || name).toUpperCase().replace(/[^A-Z0-9_]/g, '_').trim();

    if (DYNAMIC_ROLE_REGISTRY[generatedKey]) {
      return res.status(400).json({
        success: false,
        message: `Role key '${generatedKey}' already exists. Please choose a distinct name or key.`
      });
    }

    const validatedPermissions: PermissionName[] = Array.isArray(permissions) ? permissions : [];
    const roleColor = color || '#06b6d4';
    const roleDesc = description || `Custom role with ${validatedPermissions.length} granted capability scopes.`;

    // Persist to database
    const savedRole = await prisma.customRole.create({
      data: {
        workspaceId: req.user?.workspaceId || null,
        name: name.trim(),
        key: generatedKey,
        description: roleDesc,
        color: roleColor,
        permissions: JSON.stringify(validatedPermissions),
        isSystem: false
      }
    });

    // Register into active RBAC middleware
    registerCustomRole(generatedKey, name.trim(), roleDesc, roleColor, validatedPermissions);

    // Audit log
    await logActivity({
      workspaceId: req.user?.workspaceId || '',
      userId: req.user!.id,
      action: 'ROLE_CREATED',
      entityType: 'ROLE',
      entityId: savedRole.id,
      details: { roleKey: generatedKey, roleName: name, permissionsCount: validatedPermissions.length }
    });

    return res.status(201).json({
      success: true,
      message: `Role '${name}' (${generatedKey}) created successfully!`,
      role: {
        id: savedRole.id,
        key: generatedKey,
        name: savedRole.name,
        description: savedRole.description,
        color: savedRole.color,
        permissions: validatedPermissions,
        isSystem: false
      }
    });
  } catch (error: any) {
    console.error('Create custom role error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create custom role' });
  }
});

// -----------------------------------------------------------------------------
// PUT /api/permissions/roles/:key - Update an existing custom role
// -----------------------------------------------------------------------------
router.put('/roles/:key', authenticate, requirePermission('settings.manage'), async (req: AuthRequest, res: Response) => {
  try {
    await syncCustomRolesFromDb();

    const roleKey = (req.params.key as string).toUpperCase();
    const existing = DYNAMIC_ROLE_REGISTRY[roleKey];

    if (!existing) {
      return res.status(404).json({ success: false, message: `Role '${roleKey}' not found` });
    }

    if (existing.isSystem) {
      return res.status(403).json({ success: false, message: 'Core system roles cannot be modified' });
    }

    const { name, description, color, permissions } = req.body;
    const validatedPermissions: PermissionName[] = Array.isArray(permissions) ? permissions : existing.permissions;
    const updatedName = name ? name.trim() : existing.name;
    const updatedDesc = description !== undefined ? description : existing.description;
    const updatedColor = color || existing.color;

    // Update in database
    await prisma.customRole.updateMany({
      where: { key: roleKey },
      data: {
        name: updatedName,
        description: updatedDesc,
        color: updatedColor,
        permissions: JSON.stringify(validatedPermissions)
      }
    });

    // Update in-memory registry
    registerCustomRole(roleKey, updatedName, updatedDesc, updatedColor, validatedPermissions);

    return res.json({
      success: true,
      message: `Role '${roleKey}' updated successfully`,
      role: {
        key: roleKey,
        name: updatedName,
        description: updatedDesc,
        color: updatedColor,
        permissions: validatedPermissions,
        isSystem: false
      }
    });
  } catch (error: any) {
    console.error('Update custom role error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update custom role' });
  }
});

// -----------------------------------------------------------------------------
// DELETE /api/permissions/roles/:key - Delete a custom role
// -----------------------------------------------------------------------------
router.delete('/roles/:key', authenticate, requirePermission('settings.manage'), async (req: AuthRequest, res: Response) => {
  try {
    await syncCustomRolesFromDb();

    const roleKey = (req.params.key as string).toUpperCase();
    const existing = DYNAMIC_ROLE_REGISTRY[roleKey];

    if (!existing) {
      return res.status(404).json({ success: false, message: `Role '${roleKey}' not found` });
    }

    if (existing.isSystem) {
      return res.status(403).json({ success: false, message: 'Core system roles cannot be deleted' });
    }

    // Delete from database
    await prisma.customRole.deleteMany({
      where: { key: roleKey }
    });

    // Remove from in-memory registry
    removeCustomRole(roleKey);

    return res.json({ success: true, message: `Role '${roleKey}' has been deleted` });
  } catch (error: any) {
    console.error('Delete custom role error:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to delete role' });
  }
});

export default router;
