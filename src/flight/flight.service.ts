import {HttpService, Injectable} from '@nestjs/common';
import {BannedPlaces} from "../model/banned-places.interface";
import {
    getGoogleFlightsDetailsUrl,
    getWarsawBody, GOOGLE_FLIGHTS_DETAILS_OPTIONS,
    GOOGLE_FLIGHTS_OPTIONS,
    GOOGLE_FLIGHTS_URL
} from "./flight.constants";
import {Weekend} from "../model/weekend.interface";
import {Flight} from "../model/flight.interface";
import {buildAirport, DetailedFlightAirports} from "../model/airport.interface";

// TODO: replace with HttpService
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('node-fetch');

@Injectable()
export class FlightService {
    private readonly WIZZ_DISCOUNT_PLN = 43;
    private readonly WIZZ_MIN_PRICE_PLN = 78;

    constructor(private readonly httpService: HttpService) {
    }

    public getFlights(weekend: Weekend, flightMaxCost: number, bannedPlaces: BannedPlaces): Promise<Flight[]> {
        console.log('Flight request: ', weekend.startDay, ', ', weekend.endDay);
        return this.getRoundFlights(weekend, flightMaxCost, bannedPlaces);
        // TODO implement
        // if (this.body === CHOPIN_BODY || this.body === WARSAW_BODY) {
        //   this.getOneWayFlights(weekend);
        // }
    }

    public updateFlightWithAirportCoordinates(flight: Flight): Promise<Flight> {
        console.log('        Flight details: ' + flight.arrival.city + ', '
            + flight.weekend.startDay + ' - ' + flight.weekend.endDay);
        const startHourFrom = flight.weekend.startHourFrom || 16;
        const startHourTo = flight.weekend.startHourTo || 23;
        const endHourFrom = flight.weekend.endHourFrom || 12;
        const endHourTo = flight.weekend.endHourTo || 23;
        const url = getGoogleFlightsDetailsUrl(flight, startHourFrom, startHourTo, endHourFrom, endHourTo);
        return fetch(url, GOOGLE_FLIGHTS_DETAILS_OPTIONS)
            .then(response => response.text())
            .then(response => JSON.parse(response.substring(4, response.length))['_r'])
            .then(body => this.mapToDetailedAirports(body))
            .catch(err => console.error(err));
    }

    private mapToDetailedAirports(body: any): DetailedFlightAirports {
        const flights = body[2][2][0] || body[2][2][1];
        const airports = body[3][0];
        if (!flights) {
            return null;
        }
        const cheapestFlight = flights[0][0][4];
        const lastCheapestFlight = cheapestFlight[cheapestFlight.length - 1];
        const cheapestStart = airports.find(airport => airport[0] === cheapestFlight[0][0]);
        const cheapestEnd = airports.find(airport => airport[0] === lastCheapestFlight[1]);
        return this.buildDetailedAirports(cheapestStart, cheapestEnd);
    }

    private buildDetailedAirports(cheapestStart: any[], cheapestEnd: any[]): DetailedFlightAirports {
        return {
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
    }

    private getRoundFlights(weekend: Weekend, flightMaxCost: number, bannedPlaces: BannedPlaces): Promise<Flight[]> {
        const body = this.buildFlightsBody(weekend);
        const encodedBody = this.buildFlightsBodyEncoded(body);
        return fetch(GOOGLE_FLIGHTS_URL, { ...GOOGLE_FLIGHTS_OPTIONS, body: encodedBody })
            .then(response => response.text())
            .then(responseText => {
                const response = this.buildResponseObjectFrom(responseText);
                return this.buildFlights(weekend, response, flightMaxCost, body[3][13][0][0][0][0][0])
                    .filter((flight: Flight) => !this.isAirportBanned(flight, bannedPlaces));
            }).catch(err => {
                console.error('Could not fetch any flights from the Google. ', err);
                return [];
            })
    }

    private buildFlightsBody(weekend: Weekend): any {
        return getWarsawBody(
            weekend.startDay,
            weekend.endDay,
            [weekend.startHourFrom, weekend.startHourTo, 0, 23],
            [weekend.endHourFrom, weekend.endHourTo, 0, 23]
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

    private buildResponseObjectFrom(responseText: string): any {
        const parts = responseText.replace(/(\r\n|\n|\r|\\n)/gm, '')
            .replace(/\\\\/gm, '\\')
            .replace(/\\"/gm, '"')
            .split('[["wrb.fr",null,"');
        return [1, 2].map(i => JSON.parse(parts[i].substring(0, parts[i].search(/][0-9]/) - 2)));
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
            .filter(flightResponse => Number(flightResponse[1][0][1]) < flightMaxCost)
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
