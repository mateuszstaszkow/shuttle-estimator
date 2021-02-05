import {Injectable} from '@nestjs/common';
import {Flight} from "../model/flight.interface";
import {TaxiFareResponseDto} from "../model/taxi-fare-response.dto";
import {TaxiFareForCityDto} from "../model/taxi-fare-for-city.dto";
import {
    getNumbeoCorrectCityNameExp,
    getNumbeoOptions,
    getNumbeoUrl,
    TAXI_RIDE_EXP,
    TAXI_START_EXP,
    TAXI_WAIT_EXP
} from "./shuttle.constants";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('node-fetch');

@Injectable()
export class ShuttleService {
    private readonly DECIMAL_DEGREE_TO_KM = 111.196672;
    private readonly DISTANCE_THRESHOLD = 20;

    public updateFlightWithShuttle(flight: Flight, numberOfPeople: number): Promise<Flight> {
        console.log('            Shuttle for: ' + flight.arrival.city + ', '
            + flight.weekend.startDay + ' - ' + flight.weekend.endDay);
        this.updateFlightDistances(flight);
        return this.getTaxiCostForCity(flight.start.city, flight.start.country)
            .then(startFare => flight.arrival.startTaxiCost = this
                .calculateTaxiCost(flight.arrival.startDistance, startFare, numberOfPeople))
            .then(() => this.getTaxiCostForCity(flight.arrival.city, flight.arrival.country))
            .then(endFare => {
                flight.arrival.endTaxiCost = this
                    .calculateTaxiCost(flight.arrival.endDistance, endFare, numberOfPeople);
                flight.summary += flight.arrival.startTaxiCost + flight.arrival.endTaxiCost;
                return flight;
            });
    }

    private getTaxiCostForCity(city: string, country: string, isRepeat = false): Promise<TaxiFareForCityDto> {
        const currency = 'PLN';
        const encodedCity = this.correctCityName(city);
        const response = new TaxiFareResponseDto();
        response.currency = currency;
        return fetch(getNumbeoUrl(encodedCity, currency), getNumbeoOptions(encodedCity))
            .then(response => response.text())
            .then(htmlResponse => {
                const start = Number(this.getValueFromHtml(htmlResponse, TAXI_START_EXP));
                if (!start && !isRepeat) {
                    const parts = this.getValueFromHtml(htmlResponse, getNumbeoCorrectCityNameExp(country))
                        .split('>');
                    const correctCityName = parts.length === 1 ? parts[0] : parts[parts.length - 1];
                    return this.getTaxiCostForCity(correctCityName, country, true);
                }
                const ride = Number(this.getValueFromHtml(htmlResponse, TAXI_RIDE_EXP));
                const wait = Number(this.getValueFromHtml(htmlResponse, TAXI_WAIT_EXP));
                return new TaxiFareForCityDto(start, ride, wait);
            }).catch(err => {
                console.error('Error fetching shuttle data for: ' + city, err);
                return null;
            });
    }

    private updateFlightDistances(flight: Flight): void {
        if (flight.hotel) {
            flight.arrival.endDistance = this.calculateStraightDistanceInKilometers(
                flight.detailedFlight.end.coordinates,
                flight.hotel.coordinates
            );
        } else {
            flight.arrival.endDistance = 0; // TODO: fix
        }
        flight.arrival.startDistance = this.calculateStraightDistanceInKilometers(
            flight.detailedFlight.start.coordinates,
            flight.start.geocode
        );
        if (flight.arrival.startDistance > this.DISTANCE_THRESHOLD || flight.arrival.endDistance > this.DISTANCE_THRESHOLD) {
            // TODO get dedicated shuttle
        }
    }

    private getValueFromHtml(htmlResponse: string, expression: RegExp): string {
        const match = htmlResponse.match(expression);
        if (!match) {
            return '0';
        }
        return match[1].trim()
    }

    private correctCityName(city: string): string {
        return city.replace(/ /g, '-')
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
    }

    private calculateTaxiCost(distance: number, fare: TaxiFareForCityDto, numberOfPeople: number): number {
        if (!fare) {
            return 0;
        }
        return Math.round((distance * fare.costPerKilometer.mean + fare.startingCost.mean) / numberOfPeople);
    }

    private calculateStraightDistanceInKilometers(first: [number, number] | number[], second: [number, number] | number[]): number {
        const x2 = Math.pow(first[0] - second[0], 2);
        const y2 = Math.pow(first[1] - second[1], 2);
        return Math.round(Math.sqrt(x2 + y2) * this.DECIMAL_DEGREE_TO_KM);
    }
}
