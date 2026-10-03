import { Request, Response, NextFunction } from 'express';


export const globalErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    // Send detailed error in development
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  } else {
    // Send generic error in production
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    } else {
      // Programming or other unknown error
      console.error('ERROR 💥:', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
    }
  }
};
