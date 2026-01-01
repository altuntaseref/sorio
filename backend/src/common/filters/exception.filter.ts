import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { LoggerService } from '../logger/logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new LoggerService('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as any).message || exception.message
        : 'Internal server error';

    const errorResponse = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    };

    // Handle potential undefined stack
    const stack = exception instanceof Error ? exception.stack : undefined;

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status}`,
      stack || JSON.stringify(exception),
    );

    response.status(status).json(errorResponse);
  }
}
