import {HttpService, Injectable} from '@nestjs/common';
import {GOOGLE_FLIGHTS_OPTIONS, GOOGLE_FLIGHTS_URL} from "../app-path.constants";
import {BannedPlaces} from "../model/banned-places.interface";
import {getWarsawBody} from "./flight.constants";
import {Weekend} from "../model/weekend.interface";
import {Flight} from "../model/flight.interface";
import {buildAirport} from "../model/airport.interface";

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

    private getRoundFlights(weekend: Weekend, flightMaxCost: number, bannedPlaces: BannedPlaces): Promise<Flight[]> {
        const body = this.buildFlightsBody(weekend);
        const encodedBody = this.buildFlightsBodyEncoded(body);
        return fetch(GOOGLE_FLIGHTS_URL, { ...GOOGLE_FLIGHTS_OPTIONS, body: encodedBody })
            .then(response => response.text())
            .then(responseText => {
                const response = this.buildResponseObjectFrom(responseText);
                return this.buildFlights(weekend, response, flightMaxCost, body[3][13][0][0][0][0][0])
                    .filter((flight: Flight) => !this.isAirportBanned(flight, bannedPlaces));
            });
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
        return bannedPlaces.countries.includes(flight.arrival.country)
            || bannedPlaces.cities.includes(flight.arrival.city)
            || bannedPlaces.countries.includes(flight.depart.country)
            || bannedPlaces.cities.includes(flight.depart.city);
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
