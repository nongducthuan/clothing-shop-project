import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

interface ErrorDetails {
  statusCode: number;
  status: string;
  message: string;
  isOperational: boolean;
  stack?: string;
}

function normalizeError(err: unknown): ErrorDetails {
  if (err instanceof AppError) {
    return {
      statusCode: err.statusCode,
      status: err.status,
      message: err.message,
      isOperational: err.isOperational,
      stack: err.stack,
    };
  }

  if (err instanceof Error) {
    if (err.name === 'MulterError') {
      const code = (err as Error & { code?: string }).code;
      return {
        statusCode: code === 'LIMIT_FILE_SIZE' ? 413 : 400,
        status: 'fail',
        message: code === 'LIMIT_FILE_SIZE'
          ? 'Image files must be 5 MB or smaller.'
          : 'Invalid image upload.',
        isOperational: true,
      };
    }
    return {
      statusCode: 500,
      status: 'error',
      message: err.message,
      isOperational: false,
      stack: err.stack,
    };
  }

  if (typeof err === 'object' && err !== null) {
    const candidate = err as Partial<ErrorDetails> & { message?: unknown };
    return {
      statusCode: typeof candidate.statusCode === 'number' ? candidate.statusCode : 500,
      status: typeof candidate.status === 'string' ? candidate.status : 'error',
      message: typeof candidate.message === 'string' ? candidate.message : 'Unknown error',
      isOperational: candidate.isOperational === true,
      stack: typeof candidate.stack === 'string' ? candidate.stack : undefined,
    };
  }

  return {
    statusCode: 500,
    status: 'error',
    message: typeof err === 'string' ? err : 'Unknown error',
    isOperational: false,
  };
}

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Express requires the 4-argument signature; next is intentionally unused here.
  void req;
  void next;

  const error = normalizeError(err);

  if (process.env.NODE_ENV === 'development') {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
      error: err,
      stack: error.stack,
    });
    return;
  }

  if (error.isOperational) {
    res.status(error.statusCode).json({
      status: error.status,
      message: error.message,
    });
    return;
  }

  console.error('ERROR 💥:', err);
  res.status(500).json({
    status: 'error',
    message: 'Something went very wrong!',
  });
};
