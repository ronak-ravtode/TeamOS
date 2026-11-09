import { Request, Response } from 'express';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error.middleware';

export class TasksController {
  static async list(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const { projectId, assigneeId, assignedToId, status, priority, search } = req.query;

    const where: any = { workspaceId };

    if (projectId && typeof projectId === 'string') {
      where.projectId = projectId;
    }

    const effectiveAssigneeId = assigneeId || assignedToId;
    if (effectiveAssigneeId && typeof effectiveAssigneeId === 'string') {
      where.assigneeId = effectiveAssigneeId;
    }

    if (status && Object.values(TaskStatus).includes(status as TaskStatus)) {
      where.status = status as TaskStatus;
    }

    if (priority && Object.values(TaskPriority).includes(priority as TaskPriority)) {
      where.priority = priority as TaskPriority;
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const tasks = await prisma.task.findMany({
      where,
      include: {
        project: {
          select: { id: true, name: true, key: true },
        },
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
      orderBy: [{ position: 'asc' }, { createdAt: 'desc' }],
    });

    const now = new Date();
    const response = tasks.map((task) => ({
      id: task.id,
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      projectKey: task.project.key,
      projectName: task.project.name,
      taskNumber: task.taskNumber,
      formattedKey: `${task.project.key}-${task.taskNumber}`,
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
      isOverdue: task.dueDate ? new Date(task.dueDate) < now && task.status !== TaskStatus.DONE : false,
    }));

    res.status(200).json(response);
  }

  static async getById(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const taskId = String(req.params.taskId);

    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
      include: {
        project: {
          select: { id: true, name: true, key: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true, createdAt: true },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) {
      throw new AppError('Task not found in this workspace', 404);
    }

    const now = new Date();
    const response = {
      id: task.id,
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      projectKey: task.project.key,
      projectName: task.project.name,
      taskNumber: task.taskNumber,
      formattedKey: `${task.project.key}-${task.taskNumber}`,
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
      commentCount: task.comments.length,
      isOverdue: task.dueDate ? new Date(task.dueDate) < now && task.status !== TaskStatus.DONE : false,
      comments: task.comments.map((c) => ({
        id: c.id,
        workspaceId: c.workspaceId,
        taskId: c.taskId,
        authorId: c.authorId,
        author: c.author,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
      })),
    };

    res.status(200).json(response);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const creatorId = req.user!.id;
    const {
      title,
      description,
      projectId,
      status,
      priority,
      assigneeId,
      assignedToId,
      startDate,
      dueDate,
      position,
    } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      throw new AppError('Task title is required', 400);
    }

    if (!projectId || typeof projectId !== 'string') {
      throw new AppError('Project ID is required', 400);
    }

    const project = await prisma.project.findFirst({
      where: { id: projectId, workspaceId },
    });

    if (!project) {
      throw new AppError('Project not found in this workspace', 404);
    }

    const effectiveAssigneeId = assigneeId || assignedToId;
    if (effectiveAssigneeId) {
      const membership = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: effectiveAssigneeId,
          },
        },
      });
      if (!membership) {
        throw new AppError('Assignee must be a member of this workspace', 400);
      }
    }

    let parsedStart: Date | null = null;
    let parsedDue: Date | null = null;

    if (startDate) {
      parsedStart = new Date(startDate);
      if (isNaN(parsedStart.getTime())) {
        throw new AppError('Invalid start date', 400);
      }
    }

    if (dueDate) {
      parsedDue = new Date(dueDate);
      if (isNaN(parsedDue.getTime())) {
        throw new AppError('Invalid due date', 400);
      }
    }

    if (parsedStart && parsedDue && parsedStart > parsedDue) {
      throw new AppError('Start date cannot be after due date', 400);
    }

    const lastTask = await prisma.task.findFirst({
      where: { projectId },
      orderBy: { taskNumber: 'desc' },
      select: { taskNumber: true },
    });
    const nextTaskNumber = (lastTask?.taskNumber || 0) + 1;

    const task = await prisma.task.create({
      data: {
        workspaceId,
        projectId,
        taskNumber: nextTaskNumber,
        title: title.trim(),
        description: description ? description.trim() : null,
        status: status && Object.values(TaskStatus).includes(status) ? status : TaskStatus.TODO,
        priority: priority && Object.values(TaskPriority).includes(priority) ? priority : TaskPriority.MEDIUM,
        assigneeId: effectiveAssigneeId || null,
        creatorId,
        startDate: parsedStart,
        dueDate: parsedDue,
        position: typeof position === 'number' ? position : 0,
      },
      include: {
        project: {
          select: { id: true, name: true, key: true },
        },
        assignee: {
          select: { id: true, name: true, email: true },
        },
        creator: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    const now = new Date();
    res.status(201).json({
      id: task.id,
      workspaceId: task.workspaceId,
      projectId: task.projectId,
      projectKey: task.project.key,
      projectName: task.project.name,
      taskNumber: task.taskNumber,
      formattedKey: `${task.project.key}-${task.taskNumber}`,
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
      commentCount: 0,
      isOverdue: task.dueDate ? new Date(task.dueDate) < now && task.status !== TaskStatus.DONE : false,
    });
  }

  static async update(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const taskId = String(req.params.taskId);
    const {
      title,
      description,
      status,
      priority,
      assigneeId,
      assignedToId,
      startDate,
      dueDate,
      position,
    } = req.body;

    const existingTask = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
    });

    if (!existingTask) {
      throw new AppError('Task not found in this workspace', 404);
    }

    const updateData: any = {};

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        throw new AppError('Task title cannot be empty', 400);
      }
      updateData.title = title.trim();
    }

    if (description !== undefined) {
      updateData.description = description ? description.trim() : null;
    }

    if (status !== undefined) {
      if (!Object.values(TaskStatus).includes(status)) {
        throw new AppError('Invalid task status', 400);
      }
      updateData.status = status;
    }

    if (priority !== undefined) {
      if (!Object.values(TaskPriority).includes(priority)) {
        throw new AppError('Invalid task priority', 400);
      }
      updateData.priority = priority;
    }

    const effectiveAssigneeId = assigneeId !== undefined ? assigneeId : assignedToId;
    if (effectiveAssigneeId !== undefined) {
      if (effectiveAssigneeId === null || effectiveAssigneeId === '') {
        updateData.assigneeId = null;
      } else {
        const membership = await prisma.workspaceMember.findUnique({
          where: {
            workspaceId_userId: {
              workspaceId,
              userId: effectiveAssigneeId,
            },
          },
        });
        if (!membership) {
          throw new AppError('Assignee must be a member of this workspace', 400);
        }
        updateData.assigneeId = effectiveAssigneeId;
      }
    }

    let parsedStart = existingTask.startDate;
    let parsedDue = existingTask.dueDate;

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

    if (dueDate !== undefined) {
      if (dueDate === null || dueDate === '') {
        parsedDue = null;
      } else {
        parsedDue = new Date(dueDate);
        if (isNaN(parsedDue.getTime())) {
          throw new AppError('Invalid due date', 400);
        }
      }
      updateData.dueDate = parsedDue;
    }

    if (parsedStart && parsedDue && parsedStart > parsedDue) {
      throw new AppError('Start date cannot be after due date', 400);
    }

    if (position !== undefined && typeof position === 'number') {
      updateData.position = position;
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
      include: {
        project: {
          select: { id: true, name: true, key: true },
        },
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
    });

    const now = new Date();
    res.status(200).json({
      id: updated.id,
      workspaceId: updated.workspaceId,
      projectId: updated.projectId,
      projectKey: updated.project.key,
      projectName: updated.project.name,
      taskNumber: updated.taskNumber,
      formattedKey: `${updated.project.key}-${updated.taskNumber}`,
      title: updated.title,
      description: updated.description,
      status: updated.status,
      priority: updated.priority,
      assigneeId: updated.assigneeId,
      assignee: updated.assignee,
      creatorId: updated.creatorId,
      creator: updated.creator,
      startDate: updated.startDate?.toISOString() || null,
      dueDate: updated.dueDate?.toISOString() || null,
      position: updated.position,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      commentCount: updated._count.comments,
      isOverdue: updated.dueDate ? new Date(updated.dueDate) < now && updated.status !== TaskStatus.DONE : false,
    });
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const taskId = String(req.params.taskId);

    const existing = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
    });

    if (!existing) {
      throw new AppError('Task not found in this workspace', 404);
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    res.status(200).json({ message: 'Task deleted successfully' });
  }
}
