import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [], // AppService kaldırıldı
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('healthCheck', () => {
    it('should return { status: \'ok\', message: \'pong\' }', () => {
      // getHello() yerine healthCheck() test ediliyor
      expect(appController.healthCheck()).toEqual({ status: 'ok', message: 'pong' });
    });
  });
});
