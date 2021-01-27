import { Injectable } from '@nestjs/common';
import {Flight} from "../model/flight.interface";
import {Hotel} from "../model/hotel.interface";
import {
    AGODA_GRAPHQL_URL_SEARCH,
    getAgodaHotelOptions,
    getAgodaSuggestionsOptions,
    getAgodaSuggestionsUrl,
    getTrivagoOptions,
    getTrivagoSuggestionsOptions,
    TRIVAGO_ALL_INCUSIVE,
    TRIVAGO_GRAPHQL_URL, TRIVAGO_LOW_COST
} from "./hotel.constants";
import {from, Observable} from "rxjs";

// TODO: replace with HttpService
// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('node-fetch');

@Injectable()
export class HotelService {
    private readonly PAGE_SIZE = 25;
    private readonly HOTEL_MAX_DISTANCE_TO_CENTER = 3;
    private readonly MAX_RETRIES = 3;
    private readonly DECIMAL_DEGREE_TO_KM = 111.196672;

    public updateFlightWithHotelDetails(flight: Flight,
                                        numberOfPeople: number,
                                        hotelCostMax: number,
                                        isHoliday = false): Observable<Flight> {
        return from(
            this.getAgodaCityCode(flight.arrival.city)
                .then(cityId => this.getAgodaHotelsAndAssignForRoundFlight(flight, cityId, numberOfPeople, hotelCostMax))
        );
    }

    private getAgodaHotelsAndAssignForRoundFlight(flight: Flight,
                                                  cityId: number,
                                                  numberOfPeople: number,
                                                  hotelCostMax: number,
                                                  calls = 0): Promise<Flight> {
        calls++;
        console.log(`    Hotel request (calls: ${calls}): `, flight.arrival.city);
        const options = getAgodaHotelOptions(
            cityId,
            flight.weekend.startDay,
            flight.weekend.numberOfDays,
            numberOfPeople,
            !!(calls % 2)
        );
        return fetch(AGODA_GRAPHQL_URL_SEARCH, options)
            .then(response => response.json())
            .then(response => {
                if (!this.getAgodaHotelPrice(response.data?.citySearch.properties[0]) && (calls <= 5)) {
                    return this.getAgodaHotelsAndAssignForRoundFlight(
                        flight,
                        cityId,
                        numberOfPeople,
                        hotelCostMax,
                        calls
                    );
                }
                const hotel = response.data?.citySearch.properties
                    .find(p => this.isNotHostelAndDistantAndExpensiveAgoda(flight, p, numberOfPeople, hotelCostMax));
                if (!hotel) {
                    return flight;
                }
                return this.updateFlightWithHotelData(flight, hotel, numberOfPeople);
            })
    }

    private isNotHostelAndDistantAndExpensiveAgoda(flight: Flight, property, numberOfPeople: number, hotelCostMax: number): boolean {
        const distance = this.calculateStraightDistanceInKm(flight.coordinates, this.getAgodaHotelGeoInfo(property));
        return !property.propertyResultType.includes('Hostel') // TODO: remove?
            && !property.content.informationSummary.propertyType.includes('Hostel') // TODO: remove?
            && !this.isHotelExpensiveAgoda(property, numberOfPeople, hotelCostMax)
            && distance < this.HOTEL_MAX_DISTANCE_TO_CENTER;
    }

    private isHotelExpensiveAgoda(property, numberOfPeople: number, hotelCostMax: number): boolean {
        const price = this.getAgodaHotelPrice(property);
        if (price === 0) {
            return true;
        }
        return price > (hotelCostMax * numberOfPeople);
    }

    private getAgodaHotelPrice(hotel: any): number {
        const offer = hotel?.pricing?.offers[0]
        if (!offer) {
            return 0;
        }
        const room = offer.roomOffers[0].room[0] || offer.roomOffers[0].room;
        return room.pricing[0].price.perBook.inclusive.display;
    }

    private getAgodaHotelGeoInfo(hotel: any): [number, number] {
        const geoInfo = hotel.content.informationSummary.geoInfo;
        return [geoInfo.longitude, geoInfo.latitude];
    }

    private isNotHostelAndCloseAndCheap(flight: Flight,
                                        accommodation: any,
                                        numberOfPeople: number,
                                        hotelCostMax: number): boolean {
        const geoLocation = [accommodation.geocode.lng, accommodation.geocode.lat];
        const hotelDistanceFromCityCenter = this.calculateStraightDistanceInKm(flight.coordinates, geoLocation);
        console.log(flight.arrival.city)
        console.log('distance hotel: ', geoLocation);
        console.log('distance flight: ', flight.coordinates);
        const isClose = hotelDistanceFromCityCenter < this.HOTEL_MAX_DISTANCE_TO_CENTER;
        return !accommodation.accommodationType.value.includes('Hostel')
            && !this.isHotelExpensive(accommodation, numberOfPeople, hotelCostMax)
            && isClose;
    }

    private isHotelExpensive(hotel: any, numberOfPeople: number, hotelCostMax: number): boolean {
        return hotel.deals.bestPrice.pricePerStay > (hotelCostMax * numberOfPeople);
    }

    private updateFlightWithHotelData(flight: Flight, hotel: any, numberOfPeople: number): Flight {
        const hotelData: Hotel = {
            name: hotel.content.informationSummary.displayName,
            cost: Math.round(this.getAgodaHotelPrice(hotel) / numberOfPeople),
            coordinates: this.getAgodaHotelGeoInfo(hotel)
        };
        flight.summary = flight.cost + hotelData.cost;
        flight.hotel = hotelData;
        return flight;
    }

    private getAgodaCityCode(name: string): Promise<number> {
        const encodedCityName = encodeURIComponent(name);
        const url = getAgodaSuggestionsUrl(encodedCityName)
        return fetch(url, getAgodaSuggestionsOptions())
            .then(response => response.json())
            .then(response => response.SuggestionList[0]?.ObjectID);
    }

    private calculateStraightDistanceInKm(first: [number, number] | number[],
                                                  second: [number, number] | number[]): number {
        const x2 = Math.pow(first[0] - second[0], 2);
        const y2 = Math.pow(first[1] - second[1], 2);
        return Math.sqrt(x2 + y2) * this.DECIMAL_DEGREE_TO_KM;
    }

    private getFlightWithHotelDetailsTrivago(flight: Flight,
                                             cityCode: string,
                                             dates: string,
                                             numberOfPeople: number,
                                             hotelCostMax: number,
                                             isHoliday: boolean,
                                             pageNo = 0): Promise<Flight> {
        const qualityCodes = isHoliday ? TRIVAGO_ALL_INCUSIVE : TRIVAGO_LOW_COST;
        const codes = cityCode + qualityCodes
        const options = getTrivagoOptions(codes, dates, numberOfPeople, cityCode, pageNo);
        flight.invocations++;
        // console.log(options)
        return fetch(TRIVAGO_GRAPHQL_URL, options)
            .then(response => response.json())
            .then(response => {
                console.log('response', flight.invocations)
                const hotel = response.data.rs.accommodations
                    .find(a => this.isNotHostelAndCloseAndCheap(flight, a, numberOfPeople, hotelCostMax));
                if (hotel) {
                    return this.updateFlightWithHotelData(flight, hotel, numberOfPeople);
                } else if (response.data.rs.accommodations.length) {
                    pageNo += this.PAGE_SIZE;
                } else if (flight.invocations > this.MAX_RETRIES) {
                    return flight;
                }
                return this
                    .getFlightWithHotelDetailsTrivago(flight, cityCode, dates, numberOfPeople, hotelCostMax, isHoliday, pageNo);
            })
            .catch(err => {
                const message =  'Could not read hotel data for the flight: ' + flight.arrival.city + ', '
                    + flight.weekend.startDay + ' - ' + flight.weekend.endDay;
                console.error(message, err);
                return flight;
            });
    }

    private getTrivagoCityCode(name: string): Promise<string> {
        const options = getTrivagoSuggestionsOptions(name);
        return fetch(TRIVAGO_GRAPHQL_URL, options)
            .then(response => response.json())
            .then(response => {
                const nsid = response.data.getSearchSuggestions.searchSuggestions[0].nsid;
                return nsid.id + '/' + nsid.ns;
            }).catch(err => console.error('Could not read Trivago city code', err));
    }
}
