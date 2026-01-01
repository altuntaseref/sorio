import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/exception.filter';
import { GlobalValidationPipe } from './common/pipes/validation.pipe';
import { LoggerService } from './common/logger/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useLogger(new LoggerService());
  app.enableCors();

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new GlobalValidationPipe({ whitelist: true, transform: true }));


  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
