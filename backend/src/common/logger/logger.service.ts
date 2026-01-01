import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends ConsoleLogger {
  log(message: string, context?: string) {
    super.log(message, context);
  }

  error(message: string, trace: string, context?: string) {
    super.error(message, trace, context);
  }
}
