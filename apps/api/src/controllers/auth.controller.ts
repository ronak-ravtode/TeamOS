import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { config } from '../config';
import { AppError } from '../middleware/error.middleware';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new AppError('Full name must be at least 2 characters', 400);
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new AppError('A valid email address is required', 400);
    }

    if (!password || typeof password !== 'string' || password.length < 12) {
      throw new AppError('Password must be at least 12 characters long', 400);
    }

    if (password !== confirmPassword) {
      throw new AppError('Password and password confirmation do not match', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new AppError('An account with this email address already exists', 409);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim(),
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    const tokens = await AuthController.generateTokens(user.id, user.email);

    res.status(201).json({
      user,
      ...tokens,
    });
  }

  static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const passwordMatches = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError('Invalid email or password', 401);
    }

    const tokens = await AuthController.generateTokens(user.id, user.email);

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      ...tokens,
    });
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    try {
      const payload = jwt.verify(refreshToken, config.jwtRefreshSecret) as {
        sub: string;
        email: string;
      };
      const userId = payload.sub;

      const sessions = await prisma.refreshToken.findMany({
        where: {
          userId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
      });

      let matchingSession: any = null;
      for (const session of sessions) {
        const matches = await bcrypt.compare(refreshToken, session.hashedToken);
        if (matches) {
          matchingSession = session;
          break;
        }
      }

      if (!matchingSession) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      // Token rotation
      await prisma.refreshToken.update({
        where: { id: matchingSession.id },
        data: { revokedAt: new Date() },
      });

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, name: true, createdAt: true },
      });

      if (!user) {
        throw new AppError('User no longer exists', 401);
      }

      const tokens = await AuthController.generateTokens(user.id, user.email);

      res.status(200).json({
        user,
        ...tokens,
      });
    } catch (err) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { refreshToken } = req.body;

    if (refreshToken) {
      const sessions = await prisma.refreshToken.findMany({
        where: { userId, revokedAt: null },
      });

      for (const session of sessions) {
        const matches = await bcrypt.compare(refreshToken, session.hashedToken);
        if (matches) {
          await prisma.refreshToken.update({
            where: { id: session.id },
            data: { revokedAt: new Date() },
          });
          break;
        }
      }
    } else {
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    res.status(200).json({ message: 'Logged out successfully' });
  }

  static async getMe(req: Request, res: Response): Promise<void> {
    res.status(200).json(req.user);
  }

  static async updateProfile(req: Request, res: Response): Promise<void> {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      throw new AppError('Name must be at least 2 characters long', 400);
    }

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: name.trim() },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    res.status(200).json(updated);
  }

  private static async generateTokens(userId: string, email: string) {
    const accessToken = jwt.sign({ sub: userId, email }, config.jwtAccessSecret, {
      expiresIn: config.jwtAccessExpiration as any,
    });

    const refreshToken = jwt.sign({ sub: userId, email }, config.jwtRefreshSecret, {
      expiresIn: config.jwtRefreshExpiration as any,
    });

    const hashedToken = await bcrypt.hash(refreshToken, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: {
        userId,
        hashedToken,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}

