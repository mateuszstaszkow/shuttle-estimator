import {Controller, Get} from '@nestjs/common';
import {concatMap, delay, map, scan} from "rxjs/operators";
import {
    HOLIDAY_BODY,
    TRIVAGO_ALL_INCUSIVE,
    TRIVAGO_BODY,
    TRIVAGO_GRAPHQL_URL,
    TRIVAGO_LOW_COST,
    TRIVAGO_OPTIONS,
    TRIVAGO_QUERY_PARAMS,
    TRIVAGO_SUGGESTIONS_BODY,
} from "../app-path.constants";
import {from, Observable, of} from "rxjs";
import {TaxiFareResponseDto} from "../uber-estimate/taxi-fare-response.dto";
import {UberEstimateController} from "../uber-estimate/uber-estimate.controller";
import {FlightService} from "./flight.service";
import {Weekend} from "../model/weekend.interface";
import {Flight} from "../model/flight.interface";
import {DetailedFlightAirports} from "../model/airport.interface";
import {Hotel} from "../model/hotel.interface";
import {WeekendService} from "../weekend/weekend.service";
import {BANNED_PLACES, FLIGHT_HOURS_DEFAULT, MS_PER_DAY} from "./flight.constants";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('node-fetch');

@Controller('flights')
export class FlightController {
    public readonly requestDebounce = 1000;
    public currentFlights = 0;
    public taxiRequestTime = 0;
    public distinctCities: string[];
    public filteredFlights: Flight[];
    private readonly TAXI_REQUEST_DEBOUNCE = 500;
    private readonly WARSAW_TAXI_RATE_PER_KM = 2.4; // TODO: fetch
    private readonly WARSAW_TAXI_STARTING_COST = 8; // TODO: fetch
    private readonly HOME_COORDINATES = [20.979214, 52.231975];
    private readonly HOTEL_MAX_DISTANCE_TO_CENTER = 3;
    private readonly DECIMAL_DEGREE_TO_KM = 111.196672;
    private readonly DISTANCE_THRESHOLD = 20;
    private readonly maxMinuteDistanceForCloseFlights = 2.5;
    private FLIGHT_COST_MAX = 2000;
    private HOTEL_COST_MAX = 1000;
    private body; // TODO: remove
    private trivagoQueryParams = TRIVAGO_QUERY_PARAMS; // TODO: remove
    private flights: Flight[] = [];
    private flightDetailsLoading = false;
    private taxiController: UberEstimateController;

    constructor(private readonly flightService: FlightService,
                private readonly weekendService: WeekendService) {
        this.taxiController = new UberEstimateController();
    }

    @Get()
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

    public sortFlightsByTotalAndFixMissingData() {
        this.fixMissingFlightsData();
        this.flights.sort((a, b) => this.sortBySummary(a, b));
        // console.log(JSON.stringify(this.flights, null, 4))
        console.log('koniec')
        this.filteredFlights = this.flights.slice(0);
    }

    public sortFlightsByPricePerDayAndFixMissingData() {
        this.fixMissingFlightsData();
        this.flights.sort((a, b) => this.sortBySummaryPerDay(a, b));
        this.filteredFlights = this.flights.slice(0);
    }

    public sortFlightsByFlightCostAndFixMissingData() {
        this.fixMissingFlightsData();
        this.flights.sort((a, b) => this.sortByFlightCost(a, b));
        this.filteredFlights = this.flights.slice(0);
    }

    public getProgress(): number {
        if (!this.flights.length) {
            return 0;
        }
        return Math.round(this.currentFlights / this.flights.length * 100);
    }

    public getTaxiProgress(): number {
        if (!this.distinctCities || !this.distinctCities.length) {
            return 0;
        }
        return Math.round(this.taxiRequestTime / this.distinctCities.length / this.TAXI_REQUEST_DEBOUNCE * 100000);
    }

    public getPricePerDay(flight: Flight): number {
        const endTimeStamp = new Date(flight.weekend.endDay).getTime();
        const startTimeStamp = new Date(flight.weekend.startDay).getTime();
        const numberOfDays = (endTimeStamp - startTimeStamp) / MS_PER_DAY;
        return Math.round(flight.summary / numberOfDays);
    }

    public getDayName(flight: Flight): string {
        const dayNo = new Date(flight.weekend.startDay).getDay();
        if (dayNo === 1) {
            return 'Monday';
        } else if (dayNo === 5) {
            return 'Friday';
        } else if (dayNo === 6) {
            return 'Saturday';
        } else if (dayNo === 7) {
            return 'Sunday';
        }
    }

    private search(term: string): void {
        this.filteredFlights = this.flights.filter(flight => [
                flight.hotel.name,
                flight.depart.city,
                flight.depart.country,
                flight.arrival.city,
                flight.arrival.country
            ].map(name => name.includes(term))
                .reduce((a, b) => a || b)
        );
    }

    private fixMissingFlightsData(): void {
        this.flights.filter(f => f.hotel && (!f.arrival.endTaxiCost || !f.arrival.startTaxiCost))
            .forEach(errorFlight => {
                const similarFlight = this.flights.find(f => !!f.arrival.startTaxiCost
                    && !!f.hotel
                    && f.hotel.name === errorFlight.hotel.name
                    && f.arrival.city === errorFlight.arrival.city);
                if (!similarFlight) {
                    return;
                }
                errorFlight.arrival.startDistance = similarFlight.arrival.startDistance;
                errorFlight.arrival.endDistance = similarFlight.arrival.endDistance;
                errorFlight.arrival.startTaxiCost = similarFlight.arrival.startTaxiCost;
                errorFlight.arrival.endTaxiCost = similarFlight.arrival.endTaxiCost;
                errorFlight.summary += (errorFlight.arrival.startTaxiCost + errorFlight.arrival.endTaxiCost);
            });
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

    private sendRoundFlights() {
        this.flights.forEach(flight => this.setHotelForRoundFlight(flight));
    }

    private setHotelForRoundFlight(flight: Flight) {
        const queryParams = {...this.trivagoQueryParams};
        const body = {...TRIVAGO_BODY, variables: {...TRIVAGO_BODY.variables}};
        const options = {...TRIVAGO_OPTIONS};
        flight.invocations = 0;
        console.log('    Hotel request: ', flight.arrival.city);
        this.getTrivagoCityCode(flight.arrival.city)
            .then(code => {
                // console.log(flight.arrival.city, code)
                queryParams.uiv = code;
                queryParams.sp = this.mapToTrivagoDate(flight.weekend.startDay) + '/' + this.mapToTrivagoDate(flight.weekend.endDay);
                body.variables.queryParams = JSON.stringify(queryParams) as any;
                options.body = JSON.stringify(body);
                this.fetchHotelAndAssignForRoundFlight(flight, options, body, queryParams);
                // this.getAgodaHotelsAndAssignForRoundFlight(flight, code);
            });
    }

    private fetchHotelAndAssignForRoundFlight(flight: Flight, options, body, queryParams) {
        flight.invocations++;
        fetch(TRIVAGO_GRAPHQL_URL, options)
            .then(response => {
                // console.log(response.headers.get('set-cookie'));
                return response.json();
            })
            .then(response => {
                // console.log(flight.arrival.city, JSON.stringify(response.data.rs.accommodations.map(a => a.name.value)))
                const hotel = response.data.rs.accommodations.find(a => this.isNotHostelAndDistantAndExpensive(flight, a));
                if (hotel) {
                    this.assignHotelToRoundFlight(flight, hotel);
                    if (flight.weekend.isLast) {
                        this.updateFlightsWithAirportCoordinates();
                    }
                    return;
                } else if (response.data.rs.accommodations.length) {
                    queryParams.accoff += 25;
                    body.variables.queryParams = JSON.stringify(queryParams) as any;
                    options.body = JSON.stringify(body);
                    this.fetchHotelAndAssignForRoundFlight(flight, options, body, queryParams);
                } else if (flight.invocations > 3) {
                    const index = this.flights.indexOf(flight);
                    if (index !== -1) {
                        this.flights.splice(index, 1);
                    }
                    if (flight.weekend.isLast) {
                        this.updateFlightsWithAirportCoordinates();
                    }
                    return;
                }
                this.fetchHotelAndAssignForRoundFlight(flight, options, body, queryParams);
            })
            .catch(error => this.updateFlightsWithAirportCoordinates());
    }

    private updateFlightsWithAirportCoordinates(): void {
        if (this.currentFlights) {
            return;
        }
        this.currentFlights++;
        this.mapToDelayedObservableArray(this.flights)
            .subscribe((flight: Flight) => {
                console.log('***Detailed flight start*** ', flight.arrival.city)
                return this.taxiController
                        .getDetailedFlightInfo(
                            flight.arrival.startId,
                            flight.arrival.endId,
                            flight.weekend.startDay,
                            flight.weekend.endDay,
                            flight.weekend.startHourFrom,
                            flight.weekend.startHourTo,
                            flight.weekend.endHourFrom,
                            flight.weekend.endHourTo
                        ).then(body => {
                        const flights = body[2][2][0];
                        const airports = body[3][0];
                        if (!flights) {
                            // TODO: retry query
                            this.currentFlights++;
                            flight.arrival.endDistance = 0;
                            flight.arrival.startDistance = 0;
                            return;
                        }
                        const cheapestFlight = flights[0][0][4];
                        const lastCheapestFlight = cheapestFlight[cheapestFlight.length - 1];
                        const cheapestStart = airports.find(airport => airport[0] === cheapestFlight[0][0]);
                        const cheapestEnd = airports.find(airport => airport[0] === lastCheapestFlight[1]);
                        const detailedFlight = {
                            start: {
                                id: cheapestStart[0],
                                name: cheapestStart[1],
                                coordinates: [cheapestStart[12], cheapestStart[11]]
                            },
                            end: {
                                id: cheapestEnd[0],
                                name: cheapestEnd[1],
                                coordinates: [cheapestEnd[12], cheapestEnd[11]]
                            }
                        };
                        console.log('        Detailed flight: ', flight.arrival.city, ', ', detailedFlight.end.name);
                        this.calculateSummaryWithShuttle(flight, detailedFlight, flights);
                    }).catch(err => console.error(err))
                }
            );
    }

    private calculateSummaryWithShuttle(flight: Flight, detailedFlight: DetailedFlightAirports, flights: any): void {
        // console.log(flight)
        if (flight.hotel) {
            flight.arrival.endDistance = Math.round(this
                .calculateStraightDistanceInKilometers(detailedFlight.end.coordinates, flight.hotel.coordinates));
        } else {
            flight.arrival.endDistance = 0; // TODO: fix
        }
        flight.arrival.startDistance = Math.round(this
            .calculateStraightDistanceInKilometers(detailedFlight.start.coordinates, this.HOME_COORDINATES));
        // TODO: calculate taxi cost for single case - not so important
        if (flight.arrival.startDistance > this.DISTANCE_THRESHOLD || flight.arrival.endDistance > this.DISTANCE_THRESHOLD) {
            // TODO calculate
        }
        console.log(this.currentFlights, this.flights.length)
        if (++this.currentFlights === this.flights.length + 1) {
            const taxiProgressIntervalDelay = 100;
            const id = setInterval(() => {
                this.taxiRequestTime += taxiProgressIntervalDelay / 1000;
                if (this.taxiRequestTime > this.distinctCities.length) {
                    clearInterval(id);
                }
            }, taxiProgressIntervalDelay);
            const cities = this.flights.map(f => f.arrival.city); // TODO: implement one way
            this.distinctCities = Array.from(new Set(cities));
            this.taxiController.getTaxiCostForCity({cities: this.distinctCities, currency: 'PLN'})
                .then(response => {
                    console.log('Taxi request: ', response)
                    this.flights.filter(f => f.hotel && f.arrival.endDistance && f.arrival.startDistance)
                        .forEach(f => f.summary += this.setTaxiCostsAndCalculateTaxiSummary(f, response));
                    this.sortFlightsByTotalAndFixMissingData();
                    this.flightDetailsLoading = false;
                });
        }
    }

    private setTaxiCostsAndCalculateTaxiSummary(flight: Flight, fareResponseDto: TaxiFareResponseDto): number {
        const rms = +this.trivagoQueryParams.rms;
        const fare = fareResponseDto.faresByCities[flight.arrival.city];
        flight.arrival.startTaxiCost = Math
            .round((flight.arrival.startDistance * this.WARSAW_TAXI_RATE_PER_KM + this.WARSAW_TAXI_STARTING_COST) / rms);
        flight.arrival.endTaxiCost = Math
            .round((flight.arrival.endDistance * fare.costPerKilometer.mean + fare.startingCost.mean) / rms);
        return flight.arrival.startTaxiCost + flight.arrival.endTaxiCost;
    }

    private isNotHostelAndDistantAndExpensive(flight: Flight, accommodation): boolean {
        return !accommodation.accommodationType.value.includes('Hostel')
            && !this.isHotelExpensive(accommodation)
            && this.calculateStraightDistanceInKilometers(
                flight.coordinates,
                [accommodation.geocode.lng, accommodation.geocode.lat]
            ) < this.HOTEL_MAX_DISTANCE_TO_CENTER;
    }

    private isHotelExpensive(hotel): boolean {
        const rms = +this.trivagoQueryParams.rms;
        return hotel.deals.bestPrice.pricePerStay > (this.HOTEL_COST_MAX * rms);
    }

    private assignHotelToRoundFlight(flight: Flight, hotel) {
        const cost = hotel.deals.bestPrice.pricePerStay;
        const rms = +this.trivagoQueryParams.rms;
        const hotelData: Hotel = {
            name: hotel.name.value,
            cost: Math.round(cost / rms),
            coordinates: [hotel.geocode.lng, hotel.geocode.lat]
        };
        flight.summary = flight.cost + hotelData.cost;
        flight.hotel = hotelData;
    }

    private calculateStraightDistanceInKilometers(first: [number, number] | number[], second: [number, number] | number[]): number {
        const x2 = Math.pow(first[0] - second[0], 2);
        const y2 = Math.pow(first[1] - second[1], 2);
        return Math.sqrt(x2 + y2) * this.DECIMAL_DEGREE_TO_KM;
    }

    private sortBySummary(a: Flight, b: Flight): number {
        if (a.summary > b.summary) {
            return 1;
        } else if (a.summary < b.summary) {
            return -1;
        }
        return 0;
    }

    private sortBySummaryPerDay(a: Flight, b: Flight): number {
        const aPrice = this.getPricePerDay(a);
        const bPrice = this.getPricePerDay(b);
        if (aPrice > bPrice) {
            return 1;
        } else if (aPrice < bPrice) {
            return -1;
        }
        return 0;
    }

    private sortByFlightCost(a: Flight, b: Flight): number {
        const aPrice = a.cost;
        const bPrice = b.cost;
        if (aPrice > bPrice) {
            return 1;
        } else if (aPrice < bPrice) {
            return -1;
        }
        return 0;
    }

    private mapToTrivagoDate(date: string): string {
        return date
            .replace(/-/g, '');
    }

    private getTrivagoCityCode(name: string): Promise<string> {
        const body = {
            ...TRIVAGO_SUGGESTIONS_BODY,
            variables: {
                input: {
                    ...TRIVAGO_SUGGESTIONS_BODY.variables.input,
                    query: name
                },
            }
        };
        const options = {...TRIVAGO_OPTIONS};
        options.body = JSON.stringify(body);
        return fetch(TRIVAGO_GRAPHQL_URL, options)
            .then(response => response.json())
            .then(response => {
                const nsid = response.data.getSearchSuggestions.searchSuggestions[0].nsid;
                const qualityCodes = (this.body === HOLIDAY_BODY)
                    ? TRIVAGO_ALL_INCUSIVE
                    : TRIVAGO_LOW_COST;
                return nsid.id + '/' + nsid.ns + qualityCodes;
            });
    }
}
