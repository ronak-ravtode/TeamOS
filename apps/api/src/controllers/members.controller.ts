import { Request, Response } from 'express';
import { WorkspaceRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { prisma } from '../db/prisma';
import { AppError } from '../middleware/error.middleware';

export class MembersController {
  static async list(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);

    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId },
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
      orderBy: { joinedAt: 'asc' },
    });

    const teams = await prisma.team.findMany({
      where: { workspaceId },
      include: {
        members: {
          select: { userId: true },
        },
      },
    });

    const response = members.map((member) => {
      const userTeams = teams
        .filter((t) => t.members.some((m) => m.userId === member.userId))
        .map((t) => ({ id: t.id, name: t.name }));

      return {
        id: member.id,
        workspaceId: member.workspaceId,
        userId: member.userId,
        role: member.role,
        joinedAt: member.joinedAt,
        user: member.user,
        teams: userTeams,
      };
    });

    res.status(200).json(response);
  }

  static async add(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const currentMemberRole = req.workspaceMember?.role;
    const { email, role, name } = req.body;

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new AppError('A valid email address is required', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    // If user is not yet registered, auto-provision their account with a default password
    // so workspace owners are never blocked from adding teammates!
    if (!user) {
      const defaultPasswordHash = await bcrypt.hash('Password1234!', 10);
      const displayName = name && typeof name === 'string' && name.trim().length > 0
        ? name.trim()
        : normalizedEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: displayName,
          passwordHash: defaultPasswordHash,
        },
      });
    }

    const existingMembership = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (existingMembership) {
      throw new AppError('This user is already a member of this workspace', 409);
    }

    const assignedRole = role || WorkspaceRole.MEMBER;

    if (assignedRole === WorkspaceRole.OWNER && currentMemberRole !== WorkspaceRole.OWNER) {
      throw new AppError('Only the workspace owner can assign the OWNER role', 403);
    }

    const newMember = await prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: assignedRole,
      },
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
    });

    res.status(201).json({
      id: newMember.id,
      workspaceId: newMember.workspaceId,
      userId: newMember.userId,
      role: newMember.role,
      joinedAt: newMember.joinedAt,
      user: newMember.user,
      teams: [],
      note: 'Member added successfully! They can log in with their email and Password1234! (or register their own password).',
    });
  }

  static async updateRole(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const memberId = String(req.params.memberId);
    const currentMemberRole = req.workspaceMember?.role;
    const { role } = req.body;

    if (!role || !Object.values(WorkspaceRole).includes(role)) {
      throw new AppError('Role must be OWNER, ADMIN, or MEMBER', 400);
    }

    const targetMember = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });

    if (!targetMember) {
      throw new AppError('Workspace member not found', 404);
    }

    if (targetMember.role === WorkspaceRole.OWNER && currentMemberRole !== WorkspaceRole.OWNER) {
      throw new AppError('Administrators cannot modify the owner role', 403);
    }

    if (role === WorkspaceRole.OWNER && currentMemberRole !== WorkspaceRole.OWNER) {
      throw new AppError('Only the workspace owner can grant the OWNER role', 403);
    }

    if (targetMember.role === WorkspaceRole.OWNER && role !== WorkspaceRole.OWNER) {
      const ownerCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: WorkspaceRole.OWNER },
      });

      if (ownerCount <= 1) {
        throw new AppError('Cannot demote the only owner of the workspace', 400);
      }
    }

    const updated = await prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
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
    });

    res.status(200).json(updated);
  }

  static async remove(req: Request, res: Response): Promise<void> {
    const workspaceId = String(req.params.workspaceId);
    const memberId = String(req.params.memberId);
    const currentMemberRole = req.workspaceMember?.role;

    const targetMember = await prisma.workspaceMember.findFirst({
      where: { id: memberId, workspaceId },
    });

    if (!targetMember) {
      throw new AppError('Workspace member not found', 404);
    }

    if (targetMember.role === WorkspaceRole.OWNER && currentMemberRole !== WorkspaceRole.OWNER) {
      throw new AppError('Administrators cannot remove the workspace owner', 403);
    }

    if (targetMember.role === WorkspaceRole.OWNER) {
      const ownerCount = await prisma.workspaceMember.count({
        where: { workspaceId, role: WorkspaceRole.OWNER },
      });

      if (ownerCount <= 1) {
        throw new AppError('Cannot remove the only owner of the workspace', 400);
      }
    }

    await prisma.$transaction(async (tx) => {
      const workspaceTeams = await tx.team.findMany({
        where: { workspaceId },
        select: { id: true },
      });
      const teamIds = workspaceTeams.map((t) => t.id);

      if (teamIds.length > 0) {
        await tx.teamMember.deleteMany({
          where: {
            teamId: { in: teamIds },
            userId: targetMember.userId,
          },
        });
      }

      await tx.task.updateMany({
        where: {
          workspaceId,
          assigneeId: targetMember.userId,
        },
        data: {
          assigneeId: null,
        },
      });

      await tx.workspaceMember.delete({
        where: { id: memberId },
      });
    });

    res.status(200).json({ message: 'Member removed successfully' });
  }
}
