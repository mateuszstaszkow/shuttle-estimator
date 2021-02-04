import {HttpModule, Module} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FlightController } from './flight/flight.controller';
import { FlightService } from './flight/flight.service';
import { WeekendService } from './weekend/weekend.service';
import { HotelService } from './hotel/hotel.service';
import { HotelController } from './hotel/hotel.controller';
import { ShuttleController } from './shuttle/shuttle.controller';
import { ShuttleService } from './shuttle/shuttle.service';

@Module({
  imports: [HttpModule],
  controllers: [AppController, FlightController, HotelController, ShuttleController],
  providers: [AppService, FlightService, WeekendService, HotelService, ShuttleService],
})
export class AppModule {}
