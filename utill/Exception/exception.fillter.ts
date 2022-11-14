import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Inject,
  InternalServerErrorException,
  Logger,
  LoggerService,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionFiller implements ExceptionFilter {
  constructor(@Inject(Logger) private readonly logger: LoggerService) {}
  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    if (!(exception instanceof HttpException)) {
      exception = new InternalServerErrorException();
    }

    const response = (exception as HttpException).getResponse();

    const log = {
      response,
      url: req.url,
      timestamp: new Date().toLocaleString(),
    };
    this.logger.error(
      `${log.timestamp} ${exception.name} url: ${log.url}`,
      exception.stack,
      'AllExceptionFiller',
    );
    res.status((exception as HttpException).getStatus()).json(response);
  }
}
