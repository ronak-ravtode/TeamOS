import { Request, Response } from 'express';
import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error.middleware';

export class TeamsController {
  static async list(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);

    const teams = await prisma.team.findMany({
      where: { workspaceId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const response = teams.map((team) => ({
      id: team.id,
      workspaceId: team.workspaceId,
      name: team.name,
      description: team.description,
      createdById: team.createdById,
      createdAt: team.createdAt,
      memberCount: team.members.length,
      members: team.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
    }));

    res.status(200).json(response);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const createdById = req.user!.id;
    const { name, description } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new AppError('Team name must be at least 2 characters', 400);
    }

    const team = await prisma.team.create({
      data: {
        workspaceId,
        createdById,
        name: name.trim(),
        description: description?.trim() || null,
        members: {
          create: {
            userId: createdById,
          },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({
      id: team.id,
      workspaceId: team.workspaceId,
      name: team.name,
      description: team.description,
      createdById: team.createdById,
      createdAt: team.createdAt,
      memberCount: team.members.length,
      members: team.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
    });
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const teamId = String(req.params.teamId);

    const team = await prisma.team.findFirst({
      where: { id: teamId, workspaceId },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
              },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        projects: {
          select: {
            id: true,
            name: true,
            key: true,
            status: true,
          },
        },
      },
    });

    if (!team) {
      throw new AppError('Team not found in this workspace', 404);
    }

    res.status(200).json({
      id: team.id,
      workspaceId: team.workspaceId,
      name: team.name,
      description: team.description,
      createdById: team.createdById,
      createdBy: team.createdBy,
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
      memberCount: team.members.length,
      members: team.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      projects: team.projects,
    });
  }

  static async update(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const teamId = String(req.params.teamId);
    const { name, description } = req.body;

    const existing = await prisma.team.findFirst({
      where: { id: teamId, workspaceId },
    });

    if (!existing) {
      throw new AppError('Team not found in this workspace', 404);
    }

    const updated = await prisma.team.update({
      where: { id: teamId },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
      },
    });

    res.status(200).json(updated);
  }

  static async addMember(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const teamId = String(req.params.teamId);
    const { userId } = req.body;

    if (!userId || typeof userId !== 'string') {
      throw new AppError('A valid user ID is required', 400);
    }

    const team = await prisma.team.findFirst({
      where: { id: teamId, workspaceId },
    });

    if (!team) {
      throw new AppError('Team not found in this workspace', 404);
    }

    const isWorkspaceMember = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    if (!isWorkspaceMember) {
      throw new AppError('User is not a member of this workspace', 400);
    }

    const isTeamMember = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (isTeamMember) {
      throw new AppError('User is already a member of this team', 409);
    }

    const member = await prisma.teamMember.create({
      data: {
        teamId,
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            createdAt: true,
          },
        },
      },
    });

    res.status(201).json(member);
  }

  static async removeMember(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const teamId = String(req.params.teamId);
    const userId = String(req.params.userId);

    const team = await prisma.team.findFirst({
      where: { id: teamId, workspaceId },
    });

    if (!team) {
      throw new AppError('Team not found in this workspace', 404);
    }

    const membership = await prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new AppError('User is not a member of this team', 404);
    }

    await prisma.teamMember.delete({
      where: { id: membership.id },
    });

    res.status(200).json({ message: 'Member removed from team successfully' });
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const teamId = String(req.params.teamId);

    const team = await prisma.team.findFirst({
      where: { id: teamId, workspaceId },
    });

    if (!team) {
      throw new AppError('Team not found in this workspace', 404);
    }

    await prisma.team.delete({
      where: { id: teamId },
    });

    res.status(200).json({ message: 'Team deleted successfully' });
  }
}
