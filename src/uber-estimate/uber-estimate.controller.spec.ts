import { Test, TestingModule } from '@nestjs/testing';
import { UberEstimateController } from './uber-estimate.controller';

describe('UberEstimate Controller', () => {
  let controller: UberEstimateController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UberEstimateController],
    }).compile();

    controller = module.get<UberEstimateController>(UberEstimateController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
