import {Injectable} from '@nestjs/common';
import {BannedPlaces} from "../model/banned-places.interface";
import {
    getGoogleFlightsDetailsBody,
    getFlightsBody,
    GOOGLE_FLIGHTS_DETAILED_URL,
    GOOGLE_FLIGHTS_OPTIONS,
    GOOGLE_FLIGHTS_URL, GOOGLE_FLIGHTS_CITY_CODES_URL, getGoogleFlightsCityCodesOptions
} from "./flight.constants";
import {Weekend} from "../model/weekend.interface";
import {Flight} from "../model/flight.interface";
import {buildAirport, DetailedFlightAirports} from "../model/airport.interface";
import {CityCodeDto} from "../model/city-code-dto.interface";
import {GeocodeService} from "../geocode/geocode.service";
import {forkJoin, from, Observable} from "rxjs";
import {concatMap, map} from "rxjs/operators";

// TODO: replace with HttpService
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('node-fetch');

@Injectable()
export class FlightService {
    private readonly WIZZ_DISCOUNT_PLN = 43;
    private readonly WIZZ_MIN_PRICE_PLN = 78;

    constructor(private readonly geocodeService: GeocodeService) {
    }

    public getFlights(weekend: Weekend,
                      flightMaxCost: number,
                      bannedPlaces: BannedPlaces,
                      cityCode: string): Promise<Flight[]> {
        console.log('Flight request: ', weekend.startDay, ', ', weekend.endDay);
        return this.getRoundFlights(weekend, flightMaxCost, bannedPlaces, cityCode);
        // TODO implement
        // if (this.body === CHOPIN_BODY || this.body === WARSAW_BODY) {
        //   this.getOneWayFlights(weekend);
        // }
    }

    public updateFlightWithAirportCoordinates(flight: Flight): Promise<Flight> {
        console.log('        Flight details: ' + flight.arrival.city + ', '
            + flight.weekend.startDay + ' - ' + flight.weekend.endDay);
        const body = this.buildFlightDetailsBody(flight);
        const encodedBody = this.buildFlightsBodyEncoded(body);
        return fetch(GOOGLE_FLIGHTS_DETAILED_URL, { ...GOOGLE_FLIGHTS_OPTIONS, body: encodedBody })
            .then(response => response.text())
            .then(response => this.buildResponseObjectFrom(response, [1]))
            .then(body => this.mapToDetailedAirports(body[0]))
            .catch(err => console.error(err));
    }

    public getCityCodes(city: string): Observable<CityCodeDto[]> {
        const cityCodes$: Promise<CityCodeDto[]> = fetch(GOOGLE_FLIGHTS_CITY_CODES_URL, getGoogleFlightsCityCodesOptions(city))
            .then(response => response.text())
            .then(responseText => this.buildCityCodes(responseText));
        return from(cityCodes$).pipe(
            map(cityCodes => cityCodes.map(c => this.geocodeService.getCoordinatesFor(c.city, c.country)
                .pipe(map(geocode => ({ ...c, ...geocode }))))),
            concatMap((cityCodes$: Observable<CityCodeDto>[]) => forkJoin(cityCodes$))
        );
    }

    private buildCityCodes(responseText: string): CityCodeDto[] {
        const parts = this.mapToValidObjectParts(responseText, '"H028ib"');
        const validObject = JSON.parse(parts[1].split(']"')[0] + ']');
        return validObject[0].map(result => {
            const location = result[0][1].split(', ');
            return {
                code: result[1] ? result[1][0][0][4] : result[0][result[0].length - 1],
                city: location[0],
                country: location[1]
            };
        });
    }

    private mapToDetailedAirports(body: any): DetailedFlightAirports {
        const flights = body[3][0];
        const airports = body[17];
        if (!flights) {
            return null;
        }
        const cheapestFlightStartId = flights[0][0][3];
        const cheapestFlightEndId = flights[0][0][6];
        const startAirport = airports.find(airport => airport[0][0] === cheapestFlightStartId);
        const endAirport = airports.find(airport => airport[0][0] === cheapestFlightEndId);
        return this.buildDetailedAirports(startAirport, endAirport);
    }

    private buildDetailedAirports(startAirport: any[], endAirport: any[]): DetailedFlightAirports {
        return {
            start: {
                id: startAirport[2][0],
                name: startAirport[1],
                coordinates: startAirport[3].reverse()
            },
            end: {
                id: endAirport[2][0],
                name: endAirport[1],
                coordinates: endAirport[3].reverse()
            }
        };
    }

    private getRoundFlights(weekend: Weekend,
                            flightMaxCost: number,
                            bannedPlaces: BannedPlaces,
                            cityCode: string): Promise<Flight[]> {
        const body = this.buildFlightsBody(weekend, cityCode);
        const encodedBody = this.buildFlightsBodyEncoded(body);
        return fetch(GOOGLE_FLIGHTS_URL, { ...GOOGLE_FLIGHTS_OPTIONS, body: encodedBody })
            .then(response => response.text())
            .then(responseText => {
                const response = this.buildResponseObjectFrom(responseText, [1, 2]);
                return this.buildFlights(weekend, response, flightMaxCost, cityCode)
                    .filter((flight: Flight) => !this.isAirportBanned(flight, bannedPlaces));
            }).catch(err => {
                console.error('Could not fetch any flights from the Google. ', err);
                return [];
            })
    }

    private buildFlightDetailsBody(flight: Flight): any {
        return getGoogleFlightsDetailsBody(
            flight,
            [flight.weekend.startHourFrom, flight.weekend.startHourTo, 0, 23],
            [flight.weekend.endHourFrom, flight.weekend.endHourTo, 0, 23]
        );
    }

    private buildFlightsBody(weekend: Weekend, cityCode: string): any {
        return getFlightsBody(
            weekend.startDay,
            weekend.endDay,
            [weekend.startHourFrom, weekend.startHourTo, 0, 23],
            [weekend.endHourFrom, weekend.endHourTo, 0, 23],
            cityCode
        );
    }

    private buildFlightsBodyEncoded(body: any): string {
        const sanitizedBody = JSON.stringify(body)
            .trim()
            .replace(/"/gm, '\\"');
        return encodeURI('f.req=[null,"' + sanitizedBody + '"]&')
            .replace(/,/gm, '%2C')
            .replace(/\//gm, '%2F');
    }

    private mapToValidObjectParts(responseText: string, key: string): string[] {
        return responseText.replace(/(\r\n|\n|\r|\\n)/gm, '')
            .replace(/\\\\/gm, '\\')
            .replace(/\\"/gm, '"')
            .split('[["wrb.fr",' + key + ',"');
    }

    private buildResponseObjectFrom(responseText: string, indexes: number[]): any {
        const parts = this.mapToValidObjectParts(responseText, 'null');
        return indexes.map(i => JSON.parse(parts[i].substring(0, parts[i].search(/][0-9]/) - 2)));
    }

    private isAirportBanned(flight: Flight, bannedPlaces: BannedPlaces): boolean {
        return false; // TODO: add as a query param
        // return bannedPlaces.countries.includes(flight.arrival.country)
        //     || bannedPlaces.cities.includes(flight.arrival.city)
        //     || bannedPlaces.countries.includes(flight.depart.country)
        //     || bannedPlaces.cities.includes(flight.depart.city);
    }

    // TODO: implement one way
    private buildFlights(weekend: Weekend, response: any, flightMaxCost: number, homeId: string): Flight[] {
        return response[1][4][0]
            .filter(flightResponse => (Number(flightResponse[1][0][1]) < flightMaxCost) && !flightResponse[6][10])
            .map((flightResponse): Flight => {
                const destination = response[0][3][0].find(d => d[0] === flightResponse[0]);
                const airline = flightResponse[6][1];
                const cost = this.calculateCostFor(flightResponse, airline);
                return {
                    cost,
                    coordinates: [destination[1][1], destination[1][0]],
                    arrival: buildAirport(homeId, flightResponse[0], destination, airline),
                    depart: buildAirport(flightResponse[0], homeId, destination, airline),
                    isRound: true,
                    summary: cost,
                    weekend
                };
            });
    }

    private calculateCostFor(flightResponse: any, airline: string): number {
        let cost = flightResponse[1][0][1];
        if (airline === 'Wizz Air') {
            cost = cost - this.WIZZ_DISCOUNT_PLN;
            cost = cost < this.WIZZ_MIN_PRICE_PLN ? this.WIZZ_MIN_PRICE_PLN : cost;
        }
        return cost;
    }

    // TODO implement
    // private getOneWayFlights(weekend: Weekend, flightId?) {
    //     const options = this.buildOneWayFlightOptions();
    //     fetch(GOOGLE_FLIGHTS_URL, options)
    //         .then(response => response.json())
    //         .then(response => this.buildFlights(weekend, response))
    //         .then(flights => this.mapToDelayedObservableArray(flights)
    //             .subscribe((flight: Flight) => this.appendOneWayFlight(flight, weekend)));
    //     // .catch(error => {
    //     //   this.flights[this.flights.length - 1].weekend.isLast = true;
    //     //   this.sendRoundFlights();
    //     // });
    // }

    // TODO
    // private appendOneWayFlight(flight: Flight, weekend: Weekend): void {
    //     const options = this.buildOneWayFlightOptions(flight.arrival.endId);
    //     fetch(GOOGLE_FLIGHTS_URL, options)
    //         .then(response => response.json())
    //         .then(response => this.buildFlights(weekend, response)
    //             .find(f => f.arrival.endId === flight.arrival.endId))
    //         .then(returnFlight => console.log(returnFlight));
    // }

    // TODO
    // private buildOneWayFlightOptions(flightId?) {
    //     const body = [...this.body];
    //     const airports = [...this.body[3]];
    //     const directionId = flightId ? 0 : 1;
    //     airports[13] = [...this.body[3][13]];
    //     airports[13].splice(directionId, 1);
    //     if (flightId) {
    //         airports[13][0][0] = [[[flightId, 4]]]; // TODO: what is 4?
    //         airports[13][0][1] = null;
    //     }
    //     body[3] = airports;
    //     return {...GOOGLE_FLIGHTS_OPTIONS, body: JSON.stringify(body)};
    // }
}
