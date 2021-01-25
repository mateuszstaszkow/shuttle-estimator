import { Test, TestingModule } from '@nestjs/testing';
import { ShuttleController } from './shuttle.controller';

describe('Shuttle Controller', () => {
  let controller: ShuttleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ShuttleController],
    }).compile();

    controller = module.get<ShuttleController>(ShuttleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
