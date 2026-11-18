import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AppError } from '../../utils/AppError';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      response.status(status).json(
        typeof exceptionResponse === 'object'
          ? exceptionResponse
          : { message: exceptionResponse }
      );
      return;
    }

    if (exception instanceof AppError) {
      response.status(exception.statusCode).json({
        status: exception.status,
        message: exception.message,
      });
      return;
    }

    if (exception instanceof Error && exception.name === 'MulterError') {
      const code = (exception as Error & { code?: string }).code;
      const statusCode = code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      response.status(statusCode).json({
        status: 'fail',
        message: code === 'LIMIT_FILE_SIZE'
          ? 'Image files must be 5 MB or smaller.'
          : 'Invalid image upload.',
      });
      return;
    }

    if (exception instanceof Error) {
      // Only expose stack traces when explicitly opted in,
      // not just based on NODE_ENV (which may be misconfigured in staging).
      if (process.env.NODE_ENV === 'development' && process.env.EXPOSE_STACK_TRACES !== 'false') {
        response.status(500).json({
          status: 'error',
          message: exception.message,
          stack: exception.stack,
        });
        return;
      }
      console.error('ERROR 💥:', exception);
      response.status(500).json({
        status: 'error',
        message: 'Something went very wrong!',
      });
      return;
    }

    response.status(500).json({
      status: 'error',
      message: 'Unknown error',
    });
  }
}
