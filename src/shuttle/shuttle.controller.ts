import {Body, Controller, Post, Query} from '@nestjs/common';
import {Flight} from "../model/flight.interface";
import {ShuttleService} from "./shuttle.service";

@Controller('flight-shuttle')
export class ShuttleController {
    private readonly NUMBER_OF_PEOPLE = 1;

    constructor(private readonly shuttleService: ShuttleService) {}

    @Post()
    public updateFlightWithShuttle(@Body() flight: Flight,
                                   @Query() numberOfPeople: number): Promise<Flight> {
        numberOfPeople = Number(numberOfPeople) || this.NUMBER_OF_PEOPLE;
        return this.shuttleService.updateFlightWithShuttle(flight, numberOfPeople);
    }
}
