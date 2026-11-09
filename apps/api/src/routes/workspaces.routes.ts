import { Router } from 'express';
import { WorkspaceRole } from '@prisma/client';
import { WorkspacesController } from '../controllers/workspaces.controller';
import { authenticate } from '../middleware/auth.middleware';
import { requireWorkspace, requireRole } from '../middleware/workspace.middleware';
import membersRouter from './members.routes';
import teamsRouter from './teams.routes';
import projectsRouter from './projects.routes';
import tasksRouter from './tasks.routes';
import commentsRouter from './comments.routes';
import dashboardRouter from './dashboard.routes';

const router = Router();

// All workspace routes require authentication
router.use(authenticate);

// Workspace collection endpoints
router.post('/', WorkspacesController.create);
router.get('/', WorkspacesController.listUserWorkspaces);

// Single workspace endpoints
router.get('/:workspaceId', requireWorkspace, WorkspacesController.getById);
router.patch(
  '/:workspaceId',
  requireWorkspace,
  requireRole(WorkspaceRole.OWNER, WorkspaceRole.ADMIN),
  WorkspacesController.update,
);

// Nested resource routes (tenant-scoped)
router.use('/:workspaceId/members', membersRouter);
router.use('/:workspaceId/teams', teamsRouter);
router.use('/:workspaceId/projects', projectsRouter);
router.use('/:workspaceId/tasks', tasksRouter);
router.use('/:workspaceId/comments', commentsRouter);
router.use('/:workspaceId/dashboard', dashboardRouter);

export default router;
