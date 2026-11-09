import { Request, Response } from 'express';
import { ProjectStatus, TaskStatus } from '@prisma/client';
import { prisma } from '../db/prisma';

export class DashboardController {
  static async getMetrics(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const userId = req.user!.id;
    const now = new Date();

    const [
      totalActiveProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasksCount,
      myAssignedRaw,
      overdueRaw,
      recentProjectsRaw,
    ] = await Promise.all([
      prisma.project.count({
        where: { workspaceId, status: ProjectStatus.ACTIVE },
      }),
      prisma.task.count({
        where: { workspaceId },
      }),
      prisma.task.count({
        where: { workspaceId, status: TaskStatus.DONE },
      }),
      prisma.task.count({
        where: { workspaceId, status: TaskStatus.IN_PROGRESS },
      }),
      prisma.task.count({
        where: { workspaceId, status: TaskStatus.BLOCKED },
      }),
      prisma.task.count({
        where: {
          workspaceId,
          dueDate: { lt: now },
          status: { not: TaskStatus.DONE },
        },
      }),
      prisma.task.findMany({
        where: {
          workspaceId,
          assigneeId: userId,
          status: { not: TaskStatus.DONE },
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
          _count: {
            select: { comments: true },
          },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 6,
      }),
      prisma.task.findMany({
        where: {
          workspaceId,
          dueDate: { lt: now },
          status: { not: TaskStatus.DONE },
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
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { dueDate: 'asc' },
        take: 6,
      }),
      prisma.project.findMany({
        where: { workspaceId },
        include: {
          team: {
            select: { id: true, name: true },
          },
          tasks: {
            select: { id: true, status: true },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

    const formatTask = (t: any) => ({
      id: t.id,
      workspaceId: t.workspaceId,
      projectId: t.projectId,
      projectKey: t.project?.key || '',
      projectName: t.project?.name || '',
      taskNumber: t.taskNumber,
      formattedKey: t.project?.key ? `${t.project.key}-${t.taskNumber}` : `TASK-${t.taskNumber}`,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assigneeId: t.assigneeId,
      assignee: t.assignee,
      creatorId: t.creatorId,
      creator: t.creator,
      startDate: t.startDate?.toISOString() || null,
      dueDate: t.dueDate?.toISOString() || null,
      position: t.position,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      commentCount: t._count?.comments || 0,
      isOverdue: t.dueDate ? new Date(t.dueDate) < now && t.status !== TaskStatus.DONE : false,
    });

    const recentProjects = recentProjectsRaw.map((p) => {
      const taskCount = p.tasks.length;
      const doneCount = p.tasks.filter((t) => t.status === TaskStatus.DONE).length;
      const progressPercentage = taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0;

      return {
        id: p.id,
        workspaceId: p.workspaceId,
        name: p.name,
        key: p.key,
        description: p.description,
        teamId: p.teamId,
        teamName: p.team?.name || null,
        status: p.status,
        startDate: p.startDate?.toISOString() || null,
        targetDate: p.targetDate?.toISOString() || null,
        createdById: p.createdById,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        taskCount,
        completedTaskCount: doneCount,
        progressPercentage,
      };
    });

    res.status(200).json({
      totalActiveProjects,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      overdueTasksCount,
      myAssignedTasks: myAssignedRaw.map(formatTask),
      overdueTasks: overdueRaw.map(formatTask),
      recentProjects,
    });
  }
}
