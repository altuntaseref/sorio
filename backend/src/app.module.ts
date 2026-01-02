import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './common/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { LoggerService } from './common/logger/logger.service';
import { SubjectsModule } from './subjects/subjects.module'; // Import SubjectsModule

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    UsersModule,
    AuthModule,
    SubjectsModule, // Add SubjectsModule here
  ],
  controllers: [AppController],
  providers: [LoggerService],
})
export class AppModule {}
