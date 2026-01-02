import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const configService = new ConfigService();

export default new DataSource({
  type: 'postgres',
  url: configService.get<string>('DATABASE_URL'),
  // Restoring the original, correct path for entities
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  // FIX: The path now correctly includes the `/src` directory
  migrations: [__dirname + '/src/database/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations',
});
