import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/exception.filter';
import { GlobalValidationPipe } from './common/pipes/validation.pipe';
import { LoggerService } from './common/logger/logger.service';
import { DataSource } from 'typeorm';

async function runMigrations(app: any) {
  try {
    console.log('🔄 Running database migrations...');
    const dataSource = app.get(DataSource);
    if (dataSource && dataSource.isInitialized) {
      await dataSource.runMigrations();
      console.log('✅ Migrations completed successfully!');
    } else {
      console.log('⚠️  DataSource not initialized, skipping migrations');
    }
  } catch (error) {
    console.error('❌ Migration error:', error);
    // Migration hatası olsa bile uygulamayı başlat (belki migration zaten çalıştırılmış)
    console.log('⚠️  Continuing with application startup...');
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Run migrations on startup (only if RUN_MIGRATIONS=true or in production)
  if (process.env.RUN_MIGRATIONS === 'true' || process.env.NODE_ENV === 'production') {
    await runMigrations(app);
  }

  app.setGlobalPrefix('api');

  app.useLogger(new LoggerService());
  app.enableCors();

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new GlobalValidationPipe({ whitelist: true, transform: true }));


  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
