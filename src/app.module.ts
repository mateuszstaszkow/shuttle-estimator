import {HttpModule, Module} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UberEstimateController } from './uber-estimate/uber-estimate.controller';
import { FlightController } from './flight/flight.controller';
import { FlightService } from './flight/flight.service';
import { WeekendService } from './weekend/weekend.service';

@Module({
  imports: [HttpModule],
  controllers: [AppController, UberEstimateController, FlightController],
  providers: [AppService, FlightService, WeekendService],
})
export class AppModule {}
