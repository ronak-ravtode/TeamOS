import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma';
import { config } from '../config';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      workspaceMember?: any;
      currentWorkspace?: any;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      statusCode: 401,
      message: 'Authentication token required',
      error: 'Unauthorized',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, config.jwtAccessSecret) as { sub: string; email: string };

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(401).json({
        statusCode: 401,
        message: 'User account no longer exists',
        error: 'Unauthorized',
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      statusCode: 401,
      message: 'Invalid or expired authentication token',
      error: 'Unauthorized',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
    });
  }
};

