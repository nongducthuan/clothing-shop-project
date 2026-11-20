import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { AppError } from '../../utils/AppError';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly adapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const adapter = this.adapterHost.httpAdapter;

    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      adapter.reply(
        response,
        typeof body === 'object' ? body : { message: body },
        exception.getStatus(),
      );
      return;
    }

    if (exception instanceof AppError) {
      adapter.reply(response, {
        status: exception.status,
        message: exception.message,
      }, exception.statusCode);
      return;
    }

    if (exception instanceof Error && exception.name === 'MulterError') {
      const code = (exception as Error & { code?: string }).code;
      const statusCode = code === 'LIMIT_FILE_SIZE' ? 413 : 400;
      adapter.reply(response, {
        status: 'fail',
        message: code === 'LIMIT_FILE_SIZE'
          ? 'Image files must be 5 MB or smaller.'
          : 'Invalid image upload.',
      }, statusCode);
      return;
    }

    if (exception instanceof Error) {
      if (process.env.NODE_ENV === 'development' && process.env.EXPOSE_STACK_TRACES !== 'false') {
        adapter.reply(response, {
          status: 'error',
          message: exception.message,
          stack: exception.stack,
        }, HttpStatus.INTERNAL_SERVER_ERROR);
        return;
      }
      console.error('ERROR 💥:', exception);
      adapter.reply(response, {
        status: 'error',
        message: 'Something went very wrong!',
      }, HttpStatus.INTERNAL_SERVER_ERROR);
      return;
    }

    adapter.reply(response, { status: 'error', message: 'Unknown error' }, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
