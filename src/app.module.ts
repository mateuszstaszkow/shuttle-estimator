import {HttpModule, Module} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UberEstimateController } from './uber-estimate/uber-estimate.controller';

@Module({
  imports: [HttpModule],
  controllers: [AppController, UberEstimateController],
  providers: [AppService],
})
export class AppModule {}
