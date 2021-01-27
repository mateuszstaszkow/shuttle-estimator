import {Body, Controller, Get, Post} from '@nestjs/common';
import {concatMap, delay, map, scan} from "rxjs/operators";
import {from, Observable, of} from "rxjs";
import {FlightService} from "./flight.service";
import {Weekend} from "../model/weekend.interface";
import {Flight} from "../model/flight.interface";
import {WeekendService} from "../weekend/weekend.service";
import {BANNED_PLACES, FLIGHT_HOURS_DEFAULT} from "./flight.constants";

@Controller()
export class FlightController {
    public readonly requestDebounce = 1000;
    private FLIGHT_COST_MAX = 2000;
    private readonly maxMinuteDistanceForCloseFlights = 2.5;

    constructor(private readonly flightService: FlightService,
                private readonly weekendService: WeekendService) {
    }

    @Get('flights')
    public getDetailedFlightInfo(): Observable<Flight[]> {
        const weekends = this.weekendService
            .buildRemainingWeekends(5, 0, 16, FLIGHT_HOURS_DEFAULT);
        return this.mapToDelayedObservableArray<Weekend>(weekends).pipe(
            concatMap((weekend: Weekend) => this.flightService
                .getFlights(weekend, this.FLIGHT_COST_MAX, BANNED_PLACES)),
            scan((acc, flight) => acc.concat(flight)),
            map(flights => flights.sort((a, b) => a.summary > b.summary ? 1 : a.summary < b.summary ? -1 : 0))
        );
    }

    @Post('flight-airport-coordinates')
    public updateFlightWithAirportCoordinates(@Body() flight: Flight): Promise<Flight> {
        return this.flightService.updateFlightWithAirportCoordinates(flight);
    }

    private mapToDelayedObservableArray<T>(elements: T[]): Observable<T | T[]> {
        return from(elements).pipe(
            concatMap(element => {
                const noisyDebounce = this.requestDebounce + (100 - Math.floor(Math.random() * 200));
                return of(element).pipe(
                    delay(noisyDebounce)
                );
            })
        );
    }
}
