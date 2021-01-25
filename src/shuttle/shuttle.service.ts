import {Injectable} from '@nestjs/common';
import {Flight} from "../model/flight.interface";
import {TaxiFareResponseDto} from "../uber-estimate/taxi-fare-response.dto";
import {TaxiFareForCityDto} from "../uber-estimate/taxi-fare-for-city.dto";
import {getNumbeoOptions, getNumbeoUrl, TAXI_RIDE_EXP, TAXI_START_EXP, TAXI_WAIT_EXP} from "./shuttle.constants";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('node-fetch');

@Injectable()
export class ShuttleService {
    private readonly WARSAW_TAXI_RATE_PER_KM = 2.4; // TODO: fetch
    private readonly WARSAW_TAXI_STARTING_COST = 8; // TODO: fetch
    private readonly HOME_COORDINATES = [20.979214, 52.231975];
    private readonly DECIMAL_DEGREE_TO_KM = 111.196672;
    private readonly DISTANCE_THRESHOLD = 20;

    public updateFlightWithShuttle(flight: Flight, numberOfPeople: number): Promise<Flight> {
        console.log('            Shuttle for: ' + flight.arrival.city + ', '
            + flight.weekend.startDay + ' - ' + flight.weekend.endDay);
        if (flight.hotel) {
            flight.arrival.endDistance = Math.round(this
                .calculateStraightDistanceInKilometers(flight.detailedFlight.end.coordinates, flight.hotel.coordinates));
        } else {
            flight.arrival.endDistance = 0; // TODO: fix
        }
        flight.arrival.startDistance = Math.round(this
            .calculateStraightDistanceInKilometers(flight.detailedFlight.start.coordinates, this.HOME_COORDINATES));
        // TODO: calculate taxi cost for single case - not so important
        if (flight.arrival.startDistance > this.DISTANCE_THRESHOLD || flight.arrival.endDistance > this.DISTANCE_THRESHOLD) {
            // TODO calculate
        }
        return this.getTaxiCostForCity(flight.arrival.city)
            .then(response => {
                flight.summary += this.setTaxiCostsAndCalculateTaxiSummary(flight, response, numberOfPeople)
                return flight;
            });
    }

    private getTaxiCostForCity(city: string): Promise<TaxiFareForCityDto> {
        const currency = 'PLN';
        const encodedCity = this.correctCityName(city);
        const response = new TaxiFareResponseDto();
        response.currency = currency;
        return fetch(getNumbeoUrl(encodedCity, currency), getNumbeoOptions(encodedCity))
            .then(response => response.text())
            .then(htmlResponse => {
                const start = this.getValueFromHtml(htmlResponse, TAXI_START_EXP);
                const ride = this.getValueFromHtml(htmlResponse, TAXI_RIDE_EXP);
                const wait = this.getValueFromHtml(htmlResponse, TAXI_WAIT_EXP);
                return new TaxiFareForCityDto(start, ride, wait);
            }).catch(err => console.error('Error fetching shuttle data for: ' + city, err));
    }

    private getValueFromHtml(htmlResponse: string, expression: RegExp): number {
        const match = htmlResponse.match(expression);
        if (!match) {
            return 0;
        }
        return Number(match[1].trim())
    }

    private correctCityName(city: string): string {
        const encodedCity = city.replace(/ /g, '-')
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");
        switch (encodedCity) {
            case 'Kyiv':
                return 'Kiev';
            case 'Krakow':
                return 'Krakow-Cracow';
            default:
                return encodedCity;
        }
    }

    private setTaxiCostsAndCalculateTaxiSummary(flight: Flight, fare: TaxiFareForCityDto, numberOfPeople: number): number {
        flight.arrival.startTaxiCost = Math
            .round((flight.arrival.startDistance * this.WARSAW_TAXI_RATE_PER_KM + this.WARSAW_TAXI_STARTING_COST) / numberOfPeople);
        flight.arrival.endTaxiCost = Math
            .round((flight.arrival.endDistance * fare.costPerKilometer.mean + fare.startingCost.mean) / numberOfPeople);
        return flight.arrival.startTaxiCost + flight.arrival.endTaxiCost;
    }

    private calculateStraightDistanceInKilometers(first: [number, number] | number[], second: [number, number] | number[]): number {
        const x2 = Math.pow(first[0] - second[0], 2);
        const y2 = Math.pow(first[1] - second[1], 2);
        return Math.sqrt(x2 + y2) * this.DECIMAL_DEGREE_TO_KM;
    }
}
