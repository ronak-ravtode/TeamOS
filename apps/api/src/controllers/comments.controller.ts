import { Request, Response } from 'express';
import { WorkspaceRole } from '@prisma/client';
import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error.middleware';

export class CommentsController {
  static async listForTask(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const taskId = String(req.params.taskId);

    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
    });

    if (!task) {
      throw new AppError('Task not found in this workspace', 404);
    }

    const comments = await prisma.taskComment.findMany({
      where: { taskId, workspaceId },
      include: {
        author: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const response = comments.map((c) => ({
      id: c.id,
      workspaceId: c.workspaceId,
      taskId: c.taskId,
      authorId: c.authorId,
      author: c.author,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
    }));

    res.status(200).json(response);
  }

  static async create(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const taskId = String(req.params.taskId);
    const authorId = req.user!.id;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new AppError('Comment content is required', 400);
    }

    const task = await prisma.task.findFirst({
      where: { id: taskId, workspaceId },
    });

    if (!task) {
      throw new AppError('Task not found in this workspace', 404);
    }

    const comment = await prisma.taskComment.create({
      data: {
        workspaceId,
        taskId,
        authorId,
        content: content.trim(),
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
    });

    res.status(201).json({
      id: comment.id,
      workspaceId: comment.workspaceId,
      taskId: comment.taskId,
      authorId: comment.authorId,
      author: comment.author,
      content: comment.content,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    });
  }

  static async update(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const commentId = String(req.params.commentId);
    const userId = req.user!.id;
    const { content } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new AppError('Comment content cannot be empty', 400);
    }

    const comment = await prisma.taskComment.findFirst({
      where: { id: commentId, workspaceId },
    });

    if (!comment) {
      throw new AppError('Comment not found in this workspace', 404);
    }

    if (comment.authorId !== userId) {
      throw new AppError('Only the comment author can edit this comment', 403);
    }

    const updated = await prisma.taskComment.update({
      where: { id: commentId },
      data: { content: content.trim() },
      include: {
        author: {
          select: { id: true, name: true, email: true, createdAt: true },
        },
      },
    });

    res.status(200).json({
      id: updated.id,
      workspaceId: updated.workspaceId,
      taskId: updated.taskId,
      authorId: updated.authorId,
      author: updated.author,
      content: updated.content,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    });
  }

  static async delete(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const commentId = String(req.params.commentId);
    const userId = req.user!.id;
    const memberRole = req.workspaceMember?.role;

    const comment = await prisma.taskComment.findFirst({
      where: { id: commentId, workspaceId },
    });

    if (!comment) {
      throw new AppError('Comment not found in this workspace', 404);
    }

    const isAuthor = comment.authorId === userId;
    const isPrivileged = memberRole === WorkspaceRole.OWNER || memberRole === WorkspaceRole.ADMIN;

    if (!isAuthor && !isPrivileged) {
      throw new AppError('You do not have permission to delete this comment', 403);
    }

    await prisma.taskComment.delete({
      where: { id: commentId },
    });

    res.status(200).json({ message: 'Comment deleted successfully' });
  }
}
