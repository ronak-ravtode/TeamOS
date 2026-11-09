import { Request, Response } from 'express';
import { ProjectStatus, TaskStatus } from '@prisma/client';
import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error.middleware';

export class ProjectsController {
  static async list(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const { status } = req.query;

    const where: any = { workspaceId };
    if (status && Object.values(ProjectStatus).includes(status as ProjectStatus)) {
      where.status = status as ProjectStatus;
    }

    const projects = await prisma.project.findMany({
      where,
      include: {
        team: {
          select: { id: true, name: true },
        },
        tasks: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const response = projects.map((project) => {
      const taskCount = project.tasks.length;
      const completedTaskCount = project.tasks.filter((t) => t.status === TaskStatus.DONE).length;
      const progressPercentage = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

      return {
        id: project.id,
        workspaceId: project.workspaceId,
        name: project.name,
        key: project.key,
        description: project.description,
        teamId: project.teamId,
        teamName: project.team?.name || null,
        status: project.status,
        startDate: project.startDate?.toISOString() || null,
        targetDate: project.targetDate?.toISOString() || null,
        createdById: project.createdById,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
        taskCount,
        completedTaskCount,
        progressPercentage,
      };
    });

    res.status(200).json(response);
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const projectId = String(req.params.projectId);

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId },
      include: {
        team: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true },
            },
            creator: {
              select: { id: true, name: true, email: true },
            },
            _count: {
              select: { comments: true },
            },
          },
          orderBy: { taskNumber: 'asc' },
        },
      },
    });

    if (!project) {
      throw new AppError('Project not found in this workspace', 404);
    }

    const taskCount = project.tasks.length;
    const completedTaskCount = project.tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const progressPercentage = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

    const response = {
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      key: project.key,
      description: project.description,
      teamId: project.teamId,
      teamName: project.team?.name || null,
      team: project.team,
      status: project.status,
      startDate: project.startDate?.toISOString() || null,
      targetDate: project.targetDate?.toISOString() || null,
      createdById: project.createdById,
      createdBy: project.createdBy,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      taskCount,
      completedTaskCount,
      progressPercentage,
      tasks: project.tasks.map((task) => ({
        id: task.id,
        workspaceId: task.workspaceId,
        projectId: task.projectId,
        projectKey: project.key,
        projectName: project.name,
        taskNumber: task.taskNumber,
        formattedKey: `${project.key}-${task.taskNumber}`,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assigneeId: task.assigneeId,
        assignee: task.assignee,
        creatorId: task.creatorId,
        creator: task.creator,
        startDate: task.startDate?.toISOString() || null,
        dueDate: task.dueDate?.toISOString() || null,
        position: task.position,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
        commentCount: task._count.comments,
        isOverdue: task.dueDate ? new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE : false,
      })),
    };

    res.status(200).json(response);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const createdById = req.user!.id;
    const { name, key, description, teamId, status, startDate, targetDate } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new AppError('Project name must be at least 2 characters', 400);
    }

    let normalizedKey = key ? String(key).trim().toUpperCase() : '';

    if (!normalizedKey) {
      const initials = name
        .trim()
        .replace(/[^A-Za-z0-9\s]/g, '')
        .split(/\s+/)
        .map((w) => w[0])
        .join('')
        .toUpperCase();
      const candidate = (initials.length >= 2 ? initials : name.replace(/[^A-Za-z0-9]/g, '')).slice(0, 5).toUpperCase();
      normalizedKey = candidate.length >= 2 ? candidate : 'PRJ';

      let counter = 1;
      let uniqueKey = normalizedKey;
      while (
        await prisma.project.findUnique({
          where: { workspaceId_key: { workspaceId, key: uniqueKey } },
        })
      ) {
        uniqueKey = `${normalizedKey.slice(0, 3)}${counter++}`;
      }
      normalizedKey = uniqueKey;
    } else {
      if (!/^[A-Z0-9]{2,10}$/.test(normalizedKey)) {
        throw new AppError('Project key must be 2 to 10 uppercase alphanumeric characters', 400);
      }

      const existingKey = await prisma.project.findUnique({
        where: {
          workspaceId_key: {
            workspaceId,
            key: normalizedKey,
          },
        },
      });

      if (existingKey) {
        throw new AppError(`Project with key "${normalizedKey}" already exists in this workspace`, 409);
      }
    }

    let parsedStart: Date | null = null;
    let parsedTarget: Date | null = null;

    if (startDate) {
      parsedStart = new Date(startDate);
      if (isNaN(parsedStart.getTime())) {
        throw new AppError('Invalid start date', 400);
      }
    }

    if (targetDate) {
      parsedTarget = new Date(targetDate);
      if (isNaN(parsedTarget.getTime())) {
        throw new AppError('Invalid target date', 400);
      }
    }

    if (parsedStart && parsedTarget && parsedStart > parsedTarget) {
      throw new AppError('Project start date cannot be after target completion date', 400);
    }

    if (teamId) {
      const team = await prisma.team.findFirst({
        where: { id: teamId, workspaceId },
      });
      if (!team) {
        throw new AppError('Associated team not found in this workspace', 400);
      }
    }

    const project = await prisma.project.create({
      data: {
        workspaceId,
        createdById,
        name: name.trim(),
        key: normalizedKey,
        description: description ? description.trim() : null,
        teamId: teamId || null,
        status: status && Object.values(ProjectStatus).includes(status) ? status : ProjectStatus.ACTIVE,
        startDate: parsedStart,
        targetDate: parsedTarget,
      },
      include: {
        team: {
          select: { id: true, name: true },
        },
      },
    });

    res.status(201).json({
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      key: project.key,
      description: project.description,
      teamId: project.teamId,
      teamName: project.team?.name || null,
      status: project.status,
      startDate: project.startDate?.toISOString() || null,
      targetDate: project.targetDate?.toISOString() || null,
      createdById: project.createdById,
      createdAt: project.createdAt.toISOString(),
      updatedAt: project.updatedAt.toISOString(),
      taskCount: 0,
      completedTaskCount: 0,
      progressPercentage: 0,
    });
  }

  static async update(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const projectId = String(req.params.projectId);
    const { name, description, teamId, status, startDate, targetDate } = req.body;

    const existingProject = await prisma.project.findFirst({
      where: { id: projectId, workspaceId },
    });

    if (!existingProject) {
      throw new AppError('Project not found in this workspace', 404);
    }

    const updateData: any = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        throw new AppError('Project name must be at least 2 characters', 400);
      }
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    if (status !== undefined) {
      if (!Object.values(ProjectStatus).includes(status)) {
        throw new AppError('Invalid project status', 400);
      }
      updateData.status = status;
    }

    let parsedStart = existingProject.startDate;
    let parsedTarget = existingProject.targetDate;

    if (startDate !== undefined) {
      if (startDate === null || startDate === '') {
        parsedStart = null;
      } else {
        parsedStart = new Date(startDate);
        if (isNaN(parsedStart.getTime())) {
          throw new AppError('Invalid start date', 400);
        }
      }
      updateData.startDate = parsedStart;
    }

    if (targetDate !== undefined) {
      if (targetDate === null || targetDate === '') {
        parsedTarget = null;
      } else {
        parsedTarget = new Date(targetDate);
        if (isNaN(parsedTarget.getTime())) {
          throw new AppError('Invalid target date', 400);
        }
      }
      updateData.targetDate = parsedTarget;
    }

    if (parsedStart && parsedTarget && parsedStart > parsedTarget) {
      throw new AppError('Project start date cannot be after target completion date', 400);
    }

    if (teamId !== undefined) {
      if (teamId === null || teamId === '') {
        updateData.teamId = null;
      } else {
        const team = await prisma.team.findFirst({
          where: { id: teamId, workspaceId },
        });
        if (!team) {
          throw new AppError('Associated team not found in this workspace', 404);
        }
        updateData.teamId = teamId;
      }
    }

    const updated = await prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        team: {
          select: { id: true, name: true },
        },
        tasks: {
          select: { id: true, status: true },
        },
      },
    });

    const taskCount = updated.tasks.length;
    const completedTaskCount = updated.tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const progressPercentage = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

    res.status(200).json({
      id: updated.id,
      workspaceId: updated.workspaceId,
      name: updated.name,
      key: updated.key,
      description: updated.description,
      teamId: updated.teamId,
      teamName: updated.team?.name || null,
      status: updated.status,
      startDate: updated.startDate?.toISOString() || null,
      targetDate: updated.targetDate?.toISOString() || null,
      createdById: updated.createdById,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      taskCount,
      completedTaskCount,
      progressPercentage,
    });
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const projectId = String(req.params.projectId);

    const existing = await prisma.project.findFirst({
      where: { id: projectId, workspaceId },
    });

    if (!existing) {
      throw new AppError('Project not found in this workspace', 404);
    }

    await prisma.project.delete({
      where: { id: projectId },
    });

    res.status(200).json({ message: 'Project deleted successfully' });
  }
}
