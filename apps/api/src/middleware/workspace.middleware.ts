import { Request, Response, NextFunction } from 'express';
import { WorkspaceRole } from '@prisma/client';
import { prisma } from '../db/prisma';

export const requireWorkspace = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  if (!req.user || !req.user.id) {
    res.status(401).json({
      statusCode: 401,
      message: 'User is not authenticated',
      error: 'Unauthorized',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
    return;
  }

  const workspaceId =
    req.params.workspaceId ||
    (req.headers['x-workspace-id'] as string) ||
    req.body?.workspaceId;

  if (!workspaceId) {
    res.status(403).json({
      statusCode: 403,
      message: 'Workspace context is required',
      error: 'Forbidden',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
    return;
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace) {
    res.status(404).json({
      statusCode: 404,
      message: 'Workspace not found',
      error: 'Not Found',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
    return;
  }

  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: req.user.id,
      },
    },
    include: {
      workspace: true,
    },
  });

  if (!membership) {
    res.status(403).json({
      statusCode: 403,
      message: 'Access denied: You are not a member of this workspace',
      error: 'Forbidden',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
    return;
  }

  req.workspaceMember = membership;
  req.currentWorkspace = workspace;
  next();
};

export const requireRole = (...roles: WorkspaceRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const membership = req.workspaceMember;

    if (!membership) {
      res.status(403).json({
        statusCode: 403,
        message: 'Workspace membership context missing',
        error: 'Forbidden',
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
      return;
    }

    if (!roles.includes(membership.role)) {
      res.status(403).json({
        statusCode: 403,
        message: `Insufficient workspace permissions. Required: [${roles.join(', ')}], Current: ${membership.role}`,
        error: 'Forbidden',
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
      return;
    }

    next();
  };
};

