import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const statusCode = err.statusCode || (err.status ? err.status : 500);
  const message = err.message || 'Internal server error';
  const error = err.name || (statusCode >= 500 ? 'Internal Server Error' : 'Bad Request');

  res.status(statusCode).json({
    statusCode,
    message,
    error,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
  });
};

