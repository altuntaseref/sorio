import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        // Production'da TypeScript (.ts) değil, derlenmiş JavaScript (.js) dosyalarını okumalıyız
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
        migrationsTableName: 'migrations',
        // ÇOK ÖNEMLİ: Canlıda synchronize ASLA true olmamalı! Veri kaybı yaşatır.
        synchronize: false,
        // İŞTE ÇÖZÜM BU: Uygulama başlarken migrationları otomatik çalıştır.
        migrationsRun: true,
        // SSL: Sadece DB_SSL=true environment variable'ı set edildiğinde aktif olur
        // Bazı veritabanları SSL desteklemez, bu yüzden esnek bir yapı kullanıyoruz
        ssl:
          configService.get<string>('DB_SSL') === 'true'
            ? { rejectUnauthorized: false }
            : false,
        logging: configService.get<string>('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
