import { Request, Response } from 'express';
import { WorkspaceRole } from '@prisma/client';
import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error.middleware';

export class WorkspacesController {
  static async create(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { name, description, slug } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new AppError('Workspace name must be at least 2 characters', 400);
    }

    const rawSlug = slug
      ? String(slug).toLowerCase().trim()
      : name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

    const finalSlug = await WorkspacesController.ensureUniqueSlug(rawSlug || 'workspace');

    // Create workspace + owner membership inside transaction
    const result = await prisma.$transaction(async (tx) => {
      const workspace = await tx.workspace.create({
        data: {
          name: name.trim(),
          slug: finalSlug,
          description: description?.trim() || null,
        },
      });

      const membership = await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId,
          role: WorkspaceRole.OWNER,
        },
      });

      return {
        ...workspace,
        role: membership.role,
      };
    });

    res.status(201).json(result);
  }

  static async listUserWorkspaces(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            createdAt: true,
          },
        },
      },
      orderBy: { joinedAt: 'asc' },
    });

    const response = memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));

    res.status(200).json(response);
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);

    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        members: {
          where: { role: WorkspaceRole.OWNER },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
              },
            },
          },
        },
        _count: {
          select: {
            members: true,
            projects: true,
            teams: true,
          },
        },
      },
    });

    if (!workspace) {
      throw new AppError('Workspace not found', 404);
    }

    const owner = workspace.members[0]?.user || null;

    res.status(200).json({
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      role: req.workspaceMember?.role || WorkspaceRole.MEMBER,
      owner,
      memberCount: workspace._count.members,
      projectCount: workspace._count.projects,
      teamCount: workspace._count.teams,
    });
  }

  static async update(req: Request, res: Response): Promise<void> {
    const { name, description } = req.body;
    const workspaceId = String(req.params.workspaceId);

    const updated = await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });

    res.status(200).json(updated);
  }

  private static async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const existing = await prisma.workspace.findUnique({
        where: { slug },
      });

      if (!existing) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }
}
