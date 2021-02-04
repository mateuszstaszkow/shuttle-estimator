import {Body, Controller, Post, Query} from '@nestjs/common';
import {HotelService} from "./hotel.service";
import {Observable} from "rxjs";
import {Flight} from "../model/flight.interface";

@Controller('flight-hotels')
export class HotelController {
    private readonly HOTEL_COST_MAX_PLN = 1000;
    private readonly NUMBER_OF_PEOPLE = 1;

    constructor(private readonly hotelService: HotelService) {}

    @Post()
    public updateFlightWithHotelDetails(@Body() flight: Flight,
                                        @Query('numberOfPeople') numberOfPeople: number,
                                        @Query('hotelCostMax') hotelCostMax: number = this.HOTEL_COST_MAX_PLN,
                                        @Query('isHoliday') isHoliday = false): Observable<Flight> {
        numberOfPeople = Number(numberOfPeople) || this.NUMBER_OF_PEOPLE;
        return this.hotelService.updateFlightWithHotelDetails(flight, numberOfPeople, hotelCostMax, isHoliday);
    }
}
