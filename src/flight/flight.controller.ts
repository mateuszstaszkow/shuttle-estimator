import {Controller, Get} from '@nestjs/common';
import {concatMap, debounceTime, delay} from "rxjs/operators";
import {DetailedFlightAirports, Flight, Hotel, Weekend} from "./model";
import {
    getAgodaHotelBody,
    GOOGLE_FLIGHTS_OPTIONS, GOOGLE_FLIGHTS_URL,
    HOLIDAY_BODY, TRIVAGO_ALL_INCUSIVE, TRIVAGO_BODY, TRIVAGO_GRAPHQL_URL,
    TRIVAGO_HOLIDAY_QUERY_PARAMS,
    TRIVAGO_LOW_COST, TRIVAGO_OPTIONS,
    TRIVAGO_QUERY_PARAMS, TRIVAGO_SUGGESTIONS_BODY, TRIVAGO_SUGGESTIONS_OPTIONS, TRIVAGO_SUGGESTIONS_URL,
    WARSAW_BODY, WARSAW_BODY_2
} from "../app-path.constants";
import {from, Observable, of, Subject} from "rxjs";
import {TaxiFareResponseDto} from "../uber-estimate/taxi-fare-response.dto";
import {UberEstimateController} from "../uber-estimate/uber-estimate.controller";
import {TaxiFareRequestDto} from "../uber-estimate/taxi-fare-request.dto";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('node-fetch');

const NUMBER_OF_PEOPLE = 1;

@Controller('flights')
export class FlightController {
    public currentFlights = 0;
    public taxiRequestTime = 0;
    public distinctCities: string[];
    public readonly requestDebounce = 1000;
    private readonly MS_PER_DAY = 1000 * 3600 * 24;
    private readonly TAXI_REQUEST_DEBOUNCE = 500;
    private readonly WARSAW_TAXI_RATE_PER_KM = 2.4; // TODO: fetch
    private readonly WARSAW_TAXI_STARTING_COST = 8; // TODO: fetch
    private readonly HOME_COORDINATES = [20.979214, 52.231975];
    private readonly HOTEL_MAX_DISTANCE_TO_CENTER = 3;
    private readonly DECIMAL_DEGREE_TO_KM = 111.196672;
    private readonly DISTANCE_THRESHOLD = 20;
    private readonly WIZZ_DISCOUNT_PLN = 43;
    private readonly WIZZ_MIN_PRICE = 78;
    private readonly maxMinuteDistanceForCloseFlights = 2.5;
    private FLIGHT_COST_MAX = 2000;
    private HOTEL_COST_MAX = 1000;
    private readonly startingDay = 5;
    private readonly endingDay = 0;
    private fridayStartFrom = 17;
    private fridayStartTo = 23;
    private sundayStartFrom = 10;
    private sundayStartTo = 23;
    private body; // TODO: remove
    private trivagoQueryParams = TRIVAGO_QUERY_PARAMS; // TODO: remove
    private readonly bannedCountries = [
        'Poland',
        // 'United Kingdom',
        'Ukraine',
        'Germany',
        'Portugal',
        'Belgium',
        'Hungary',
        'Austria',
        'Greece',
        'Latvia',
        'Slovakia',
        'Moldova',
        'France',
        'United Arab Emirates',
        'Czechia',
        'Switzerland'
    ];
    private readonly bannedCities = [
        'London',
        'Birmingham',
        'Manchester',
        'Kaunas',
        'Palanga'
    ];
    public filteredFlights: Flight[];
    private flights: Flight[] = [];
    private flightDetailsLoading = false;
    private peopleCount = 2;
    private searchSubject: Subject<string> = new Subject();
    private taxiController: UberEstimateController;

    constructor() {
        this.taxiController = new UberEstimateController();
    }

    @Get()
    public getDetailedFlightInfo(): Flight[] {
        if (this.flights.length) {
            return this.flights;
        }
        this.body = WARSAW_BODY_2;
        const weekends = this.buildRemainingWeekends();
        weekends[weekends.length - 1].isLast = true;
        this.mapToDelayedObservableArray(weekends)
            .subscribe((weekend: Weekend) => {
                this.body[3][13][0][6] = weekend.startDay;
                this.body[3][13][1][6] = weekend.endDay;
                this.body[3][13][0][2] = [weekend.startHourFrom, weekend.startHourTo, 0, 23];
                this.body[3][13][1][2] = [weekend.endHourFrom, weekend.endHourTo, 0, 23];
                this.getFlights(weekend);
            });
        this.searchSubject.pipe(
            debounceTime(500)
        ).subscribe(term => this.search(term));
        return [];
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
        const numberOfDays = (endTimeStamp - startTimeStamp) / this.MS_PER_DAY;
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

    public onSearchKeyUp(event: Event): void {
        const searchTerm: string = (event.target as any).value;
        this.searchSubject.next(searchTerm);
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

    // TODO implement
    private getFlights(weekend: Weekend) {
        this.getRoundFlights(weekend);
        // if (this.body === CHOPIN_BODY || this.body === WARSAW_BODY) {
        //   this.getOneWayFlights(weekend);
        // }
    }

    // TODO implement
    private getOneWayFlights(weekend: Weekend, flightId?) {
        const options = this.buildOneWayFlightOptions();
        fetch(GOOGLE_FLIGHTS_URL, options)
            .then(response => response.json())
            .then(response => this.buildFlights(weekend, response))
            .then(flights => this.mapToDelayedObservableArray(flights)
                .subscribe((flight: Flight) => this.appendOneWayFlight(flight, weekend)));
        // .catch(error => {
        //   this.flights[this.flights.length - 1].weekend.isLast = true;
        //   this.sendRoundFlights();
        // });
    }

    private appendOneWayFlight(flight: Flight, weekend: Weekend): void {
        const options = this.buildOneWayFlightOptions(flight.arrival.endId);
        fetch(GOOGLE_FLIGHTS_URL, options)
            .then(response => response.json())
            .then(response => this.buildFlights(weekend, response)
                .find(f => f.arrival.endId === flight.arrival.endId))
            .then(returnFlight => console.log(returnFlight));
    }

    private buildOneWayFlightOptions(flightId?) {
        const body = [...this.body];
        const airports = [...this.body[3]];
        const directionId = flightId ? 0 : 1;
        airports[13] = [...this.body[3][13]];
        airports[13].splice(directionId, 1);
        if (flightId) {
            airports[13][0][0] = [[[flightId, 4]]]; // TODO: what is 4?
            airports[13][0][1] = null;
        }
        body[3] = airports;
        return {...GOOGLE_FLIGHTS_OPTIONS, body: JSON.stringify(body)};
    }

    private getRoundFlights(weekend: Weekend) {
        console.log('Flight request: ', weekend.startDay, ', ', weekend.endDay);
        const body = encodeURI('f.req=[null,"' + JSON.stringify(this.body).trim().replace(/"/gm, '\\"') + '"]&')
            .replace(/,/gm, '%2C')
            .replace(/\//gm, '%2F');
        const options = {...GOOGLE_FLIGHTS_OPTIONS, body};
        fetch(GOOGLE_FLIGHTS_URL, options)
            .then(response => response.text())
            .then(textResponse => {
                const buff = textResponse.replace(/(\r\n|\n|\r|\\n)/gm, '')
                    .replace(/\\\\/gm, '\\')
                    .replace(/\\"/gm, '"');
                const parts = buff.split('[["wrb.fr",null,"');
                // console.log(JSON.parse(buff.substring(buff.indexOf('"[[]') + 1, buff.indexOf('"]]]"') + 4)));
                const response = [
                    JSON.parse(parts[1].substring(0, parts[1].search(/][0-9]/) - 2)),
                    JSON.parse(parts[2].substring(0, parts[2].search(/][0-9]/) - 2))
                ];
                this.appendRoundFlight(weekend, response);
            })
        // .then(response => this.appendRoundFlight(weekend, response))
        // .catch(error => {
        //     this.flights[this.flights.length - 1].weekend.isLast = true;
        //     this.sendRoundFlights();
        // });
    }

    // TODO: implement one way
    private buildFlights(weekend: Weekend, response): Flight[] {
        return response[1][4][0]
            .filter(flightResponse => +flightResponse[1][0][1] < this.FLIGHT_COST_MAX)
            .map((flightResponse): Flight => {
                const destination = response[0][3][0].find(d => d[0] === flightResponse[0]);
                let cost = flightResponse[1][0][1];
                const airline = flightResponse[6][1];
                const homeId = this.body[3][13][0][0][0][0][0];
                if (airline === 'Wizz Air') {
                    cost = cost - this.WIZZ_DISCOUNT_PLN;
                    cost = cost < this.WIZZ_MIN_PRICE ? this.WIZZ_MIN_PRICE : cost;
                }
                return {
                    cost: cost + ' zł',
                    coordinates: [destination[1][1], destination[1][0]],
                    arrival: {
                        startId: homeId,
                        endId: flightResponse[0],
                        city: destination[2],
                        country: destination[4],
                        startDistance: 0,
                        endDistance: 0,
                        airline,
                    },
                    depart: {
                        startId: flightResponse[0],
                        endId: homeId,
                        city: destination[2],
                        country: destination[4],
                        startDistance: 0,
                        endDistance: 0,
                        airline,
                    },
                    isRound: true,
                    weekend
                };
            });
    }

    private appendRoundFlight(weekend: Weekend, response): void {
        const properFlights = this.buildFlights(weekend, response)
            .filter((flight: Flight) => !this.isAirportBanned(flight));
        this.flights = this.flights.concat(properFlights);
        this.filteredFlights = this.flights;
        if (weekend.isLast) {
            this.sendRoundFlights();
        }
    }

    private isAirportBanned(flight: Flight): boolean {
        return this.bannedCountries.includes(flight.arrival.country)
            || this.bannedCities.includes(flight.arrival.city)
            || this.bannedCountries.includes(flight.depart.country)
            || this.bannedCities.includes(flight.depart.city);
    }

    private sendRoundFlights() {
        this.flights.forEach(flight => this.setHotelForRoundFlight(flight));
    }

    private setHotelForRoundFlight(flight: Flight) {
        const queryParams = {...this.trivagoQueryParams};
        const body = {...TRIVAGO_BODY, variables: {...TRIVAGO_BODY.variables}};
        const options = {...TRIVAGO_OPTIONS};
        flight.invocations = 0;
        console.log('Hotel request: ', flight.arrival.city);
        this.getTrivagoCityCode(flight.arrival.city)
            .then(code => {
                // console.log(flight.arrival.city, code)
                queryParams.uiv = code;
                queryParams.sp = this.mapToTrivagoDate(flight.weekend.startDay) + '/' + this.mapToTrivagoDate(flight.weekend.endDay);
                body.variables.queryParams = JSON.stringify(queryParams) as any;
                options.body = JSON.stringify(body);
                // console.log(flight.arrival.city, ': ', options)
                // this.activateCity(code).then(r => r.text()).then(response => {
                //     console.log(flight.arrival.city + ': ', response);
                //     this.getCalendarColors(code).then(r => r.json()).then(response => {
                //         console.log('getCalendarColors: ', response)
                //         this.getFilterRecommendations(code).then(r => r.json()).then(response => {
                //             console.log('getFilterRecommendations: ', response)
                //             this.getRehydrateConcepts(code).then(r => r.json()).then(response => {
                //                 console.log('getRehydrateConcepts: ', response);
                //                 this.fetchHotelAndAssignForRoundFlight(flight, options, body, queryParams);
                //             });
                //         });
                //     });
                //     // this.fetchHotelAndAssignForRoundFlight(flight, options, body, queryParams);
                // });
                this.fetchHotelAndAssignForRoundFlight(flight, options, body, queryParams);
                // this.getAgodaHotelsAndAssignForRoundFlight(flight, code);
            });
    }

    private getFilterRecommendations(code: string): Promise<any> {
        const cityCodes = code.split(',')[0].split('/').map(c => Number(c));
        return fetch("https://www.trivago.pl/graphql", {
            "headers": {
                "accept": "*/*",
                "accept-language": "pl",
                "apollographql-client-name": "hs-web",
                "apollographql-client-version": "v93_01_3_ad_c1d9fa01b83",
                "content-type": "application/json",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-trv-app-id": "HS_WEB_APP",
                "x-trv-cst": "27291,32046,38217,40402,45749,46136,46164,46535,47225,47828,47908,48329,48405,48506,48508,48542,48681,49291,49382,49419,49696,49752,49777,49819,50165,50553,50567,50805,50910,50950,51032,51076,51195,51198,51246,51458,51530,51591,51619,51886,51913,52217,52219,52244,52345,52366,52551,52590,52830,52891,53005,53018,53172-1,53183,53192,53231,53393,53508,53513,53593,53687,53763-1,53852,53894,54061,54098,54244,54273,54297-1,54333,54362,54596,54633-1,54792-6,54827,54889,54999,55113",
                "x-trv-platform": "pl",
                "x-trv-tid": "7bc774897565e168fb4a0d8d90"
            },
            "referrer": "https://www.trivago.pl/?aDateRange%5Barr%5D=2021-01-22&aDateRange%5Bdep%5D=2021-01-24&aPriceRange%5Bfrom%5D=0&aPriceRange%5Bto%5D=0&iRoomType=1&aRooms%5B0%5D%5Badults%5D=1&cpt2=2555%2F106%2C2007%2F106%2C1527%2F106%2C1324%2F106%2C22235%2F200&hasList=1&hasMap=1&bIsSeoPage=0&sortingId=2&slideoutsPageItemId=&iGeoDistanceLimit=20000&address=&addressGeoCode=&offset=0&ra=&overlayMode=",
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": "{\"operationName\":\"getFilterRecommendations\",\"variables\":{\"input\":{\"rooms\":[{\"adults\":1,\"children\":[]}],\"limit\":15,\"stayPeriod\":{\"arrival\":\"2021-01-22\",\"departure\":\"2021-01-24\"},\"isStandardDate\":false,\"clientApplicationType\":\"WEB_APP\",\"recommendationType\":\"REDUCED_FILTERS\",\"landingChannelType\":\"BRANDED\",\"activeConcepts\":[{\"id\":" + cityCodes[0] + ",\"ns\":" + cityCodes[1] + "},{\"id\":2007,\"ns\":106},{\"id\":1527,\"ns\":106},{\"id\":1324,\"ns\":106},{\"id\":22235,\"ns\":200}]}},\"extensions\":{\"persistedQuery\":{\"version\":1,\"sha256Hash\":\"deccfdb97eb864df51ade7564452ce810a1d6a7ac9d15a41db8069d5d466f088\"}}}",
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
    }

    private getCalendarColors(nsid: string): Promise<any> {
        return fetch("https://www.trivago.pl/graphql", {
            "headers": {
                "accept": "*/*",
                "accept-language": "pl",
                "apollographql-client-name": "hs-web",
                "apollographql-client-version": "v93_01_3_ad_c1d9fa01b83",
                "content-type": "application/json",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-trv-app-id": "HS_WEB_APP",
                "x-trv-cst": "27291,32046,38217,40402,45749,46136,46164,46535,47225,47828,47908,48329,48405,48506,48508,48542,48681,49291,49382,49419,49696,49752,49777,49819,50165,50553,50567,50805,50910,50950,51032,51076,51195,51198,51246,51458,51530,51591,51619,51886,51913,52217,52219,52244,52345,52366,52551,52590,52830,52891,53005,53018,53172-1,53183,53192,53231,53393,53508,53513,53593,53687,53763-1,53852,53894,54061,54098,54244,54273,54297-1,54333,54362,54596,54633-1,54792-6,54827,54889,54999,55113",
                "x-trv-platform": "pl",
                "x-trv-tid": "7bc774897565e168fb4a0d8d90"
            },
            "referrer": "https://www.trivago.pl/?aDateRange%5Barr%5D=2021-01-22&aDateRange%5Bdep%5D=2021-01-24&aPriceRange%5Bfrom%5D=0&aPriceRange%5Bto%5D=0&iRoomType=1&aRooms%5B0%5D%5Badults%5D=1&cpt2=2555%2F106%2C2007%2F106%2C1527%2F106%2C1324%2F106%2C22235%2F200&hasList=1&hasMap=1&bIsSeoPage=0&sortingId=2&slideoutsPageItemId=&iGeoDistanceLimit=20000&address=&addressGeoCode=&offset=0&ra=&overlayMode=",
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": "{\"operationName\":\"getCalendarColors\",\"variables\":{\"locale\":\"PL\",\"pathNsid\":\"" + nsid.split(',')[0] + "\"},\"extensions\":{\"persistedQuery\":{\"version\":1,\"sha256Hash\":\"4aee390e63431d54a27b101c8f6093b51856f7ad408a8133e03e19dc46463c28\"}}}",
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
    }

    private getRehydrateConcepts(code: string): Promise<any> {
        const cityCodes = code.split(',')[0].split('/').map(c => Number(c));
        return fetch("https://www.trivago.pl/graphql", {
            "headers": {
                "accept": "*/*",
                "accept-language": "pl",
                "apollographql-client-name": "hs-web",
                "apollographql-client-version": "v93_01_3_aj_98370feebca",
                "content-type": "application/json",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-trv-app-id": "HS_WEB_APP",
                "x-trv-cst": "27291,32046,40402,45749,46136,46164,46535,47225,47828,47908,48329,48405,48506,48508,48542,48681,49291,49382,49419,49696,49752,49777,49819,50165,50553,50567,50805,50910,50950,51009,51032,51076,51198,51206,51208,51246,51458,51530,51591,51619,51886,51913,52217,52219,52244,52345,52366,52551,52590,52830,52891,53005,53018,53172-1,53183,53192,53231,53393,53508,53513,53593,53687,53763-1,53852,53894,54061,54244,54273,54297-1,54333,54362,54596,54633-1,54792-8,54827,54889,54999,55113,55145",
                "x-trv-platform": "pl",
                "x-trv-tid": "f263441b48830487e3ff1a80ae"
            },
            "referrer": "https://www.trivago.pl/?aDateRange%5Barr%5D=2021-01-22&aDateRange%5Bdep%5D=2021-01-24&aPriceRange%5Bfrom%5D=0&aPriceRange%5Bto%5D=0&iRoomType=1&aRooms%5B0%5D%5Badults%5D=1&cpt2=2555%2F106%2C2007%2F106%2C1527%2F106%2C1324%2F106%2C22235%2F200&hasList=1&hasMap=1&bIsSeoPage=0&sortingId=2&slideoutsPageItemId=&iGeoDistanceLimit=20000&address=&addressGeoCode=&offset=0&ra=&overlayMode=",
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": "{\"operationName\":\"rehydrateConcepts\",\"variables\":{\"input\":{\"nsids\":[{\"id\":2555,\"ns\":106},{\"id\":2007,\"ns\":106},{\"id\":1527,\"ns\":106},{\"id\":1324,\"ns\":106},{\"id\":1314,\"ns\":105},{\"id\":1316,\"ns\":105},{\"id\":1318,\"ns\":105},{\"id\":1320,\"ns\":105},{\"id\":1322,\"ns\":105},{\"id\":" + cityCodes[0] + ",\"ns\":" + cityCodes[1] + "},{\"id\":" + cityCodes[0] + ",\"ns\":" + cityCodes[1] + "}]}},\"extensions\":{\"persistedQuery\":{\"version\":1,\"sha256Hash\":\"e0b5f6233f109e5e5caac9b08735ddb7d385a239c8b2bf1442b939163a6112e4\"}}}",
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        });
    }

    private getAgodaHotelsAndAssignForRoundFlight(flight: Flight, cityId: number): void {
        fetch("https://www.agoda.com/graphql/search", {
            "headers": {
                "accept": "*/*",
                "accept-language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
                "access-control-max-age": "7200",
                "ag-debug-override-origin": "PL",
                "ag-language-locale": "pl-pl",
                "ag-page-type-id": "103",
                "ag-request-attempt": "1",
                "ag-request-id": "fa874264-544d-45b5-a9e7-c659e710bfbe",
                "ag-retry-attempt": "0",
                "content-type": "application/json",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin"
            },
            "referrer": "https://www.agoda.com/pl-pl/search?city=15470&checkIn=2021-01-22&los=2&rooms=1&adults=1&children=0&cid=1844104&gclid=Cj0KCQiA0fr_BRDaARIsAABw4Eurc1ej9agq29QbsqXAF1hr9JU5kAscWFPGWdM53mjlFUHElKIvyDAaAoJ-EALw_wcB&languageId=27&userId=a3d46da8-532a-41d6-a2a2-d42786317148&sessionId=vwjqd0y4rxujhr5luhjmg0gs&pageTypeId=1&origin=PL&locale=pl-PL&aid=130589&currencyCode=PLN&htmlLanguage=pl-pl&cultureInfoName=pl-PL&ckuid=a3d46da8-532a-41d6-a2a2-d42786317148&prid=0&checkOut=2021-01-24&priceCur=PLN&textToSearch=Pary%C5%BC&travellerType=0&familyMode=off&hotelReviewScore=7&sort=priceLowToHigh",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": JSON.stringify(getAgodaHotelBody(cityId, flight.weekend.startDay, flight.weekend.numberOfDays, NUMBER_OF_PEOPLE)),
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        }).then(response => response.json())
            .then(response => {
                const hotel = response.data.citySearch.properties.find(p => this.isNotHostelAndDistantAndExpensiveAgoda(flight, p));
                this.assignHotelToRoundFlight(flight, hotel);
                if (flight.weekend.isLast) {
                    this.updateFlightsWithAirportCoordinates();
                }
            })
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

    private activateCity(code: string): Promise<any> {
        const cityCodes = code.split(',')[0].split('/').map(c => Number(c));
        // console.log(cityCodes)
        const activationBody = {
            "operationName": "destinationHierarchy",
            "variables": {"destinationConcepts": {"nsids": [{"id": cityCodes[0], "ns": cityCodes[1]}]}},
            "extensions": {
                "persistedQuery": {
                    "version": 1,
                    "sha256Hash": "097e7abd2a307dd34ae21ae8da1e067856625d226dbfc4244d5f316271d558c3"
                }
            }
        }
        // console.log(JSON.stringify(activationBody))
        return fetch("https://www.trivago.pl/graphql", {
            "headers": {
                "accept": "*/*",
                "accept-language": "pl",
                "apollographql-client-name": "hs-web",
                "apollographql-client-version": "v93_01_3_ad_c1d9fa01b83",
                "content-type": "application/json",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-trv-app-id": "HS_WEB_APP",
                "x-trv-cst": "27291,32046,38217,40402,45749,46136,46164,46535,47225,47828,47908,48329,48405,48506,48508,48542,48681,49291,49382,49419,49696,49752,49777,49819,50165,50553,50567,50805,50910,50950,51032,51076,51195,51198,51246,51458,51530,51591,51619,51886,51913,52217,52219,52244,52345,52366,52551,52590,52830,52891,53005,53018,53172-1,53183,53192,53231,53393,53508,53513,53593,53687,53763-1,53852,53894,54061,54098,54244,54273,54297-1,54333,54362,54596,54633-1,54792-6,54827,54889,54999,55113",
                "x-trv-platform": "pl",
                "x-trv-tid": "7bc774897565e168fb4a0d8d90"
            },
            "referrer": "https://www.trivago.pl/?aDateRange%5Barr%5D=2021-01-22&aDateRange%5Bdep%5D=2021-01-24&aPriceRange%5Bfrom%5D=0&aPriceRange%5Bto%5D=0&iRoomType=1&aRooms%5B0%5D%5Badults%5D=1&cpt2=2555%2F106%2C2007%2F106%2C1527%2F106%2C1324%2F106%2C1803%2F200&hasList=1&hasMap=1&bIsSeoPage=0&sortingId=2&slideoutsPageItemId=&iGeoDistanceLimit=20000&address=&addressGeoCode=&offset=0&ra=&overlayMode=",
            "referrerPolicy": "no-referrer-when-downgrade",
            "body": JSON.stringify(activationBody),
            "method": "POST",
            "mode": "cors",
            "credentials": "include"
        }).then(r => r.text()).then(r => {
            console.log('1: ', r);
            return fetch('https://www.trivago.pl/?aDateRange%5Barr%5D=2021-01-22&aDateRange%5Bdep%5D=2021-01-24&aPriceRange%5Bfrom%5D=0&aPriceRange%5Bto%5D=0&iRoomType=1&aRooms%5B0%5D%5Badults%5D=1&cpt2=2555%2F106%2C2007%2F106%2C1527%2F106%2C1324%2F106%2C' + cityCodes[0] + '%2F' + cityCodes[1] + '&hasList=1&hasMap=1&bIsSeoPage=0&sortingId=2&slideoutsPageItemId=&iGeoDistanceLimit=20000&address=&addressGeoCode=&offset=0&ra=&overlayMode=', {
                "headers": {
                    "Upgrade-Insecure-Requests": "1",
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
        }).then(r => r.text()).then(r => {
            // console.log('2: ', r)
            return fetch("https://sdk.adara.com/api", {
                "headers": {
                    "accept": "*/*",
                    "accept-language": "pl-PL,pl;q=0.9",
                    "content-type": "text/plain;charset=UTF-8",
                    "sec-fetch-dest": "empty",
                    "sec-fetch-mode": "cors",
                    "sec-fetch-site": "cross-site",
                    "x-adara-key": "OWVhMzY2YTYtNjk2MS00NDY4LWJmYzQtNTZmMzdhMzg4NTJk"
                },
                "referrer": "https://www.trivago.pl/?aDateRange%5Barr%5D=2021-01-22&aDateRange%5Bdep%5D=2021-01-24&aPriceRange%5Bfrom%5D=0&aPriceRange%5Bto%5D=0&iRoomType=1&aRooms%5B0%5D%5Badults%5D=1&cpt2=2555%2F106%2C2007%2F106%2C1527%2F106%2C1324%2F106%2C" + cityCodes[0] + "%2F" + cityCodes[1] + "&hasList=1&hasMap=1&bIsSeoPage=0&sortingId=2&slideoutsPageItemId=&iGeoDistanceLimit=20000&address=&addressGeoCode=&offset=0&ra=&overlayMode=",
                "referrerPolicy": "no-referrer-when-downgrade",
                "body": "{\"event\":\"init\",\"context\":{\"title\":\"Paryż — hotele (Ocena: 7,0+) | Znajdź i porównaj znakomite oferty na trivago\",\"path\":{\"ancestorOrigins\":{},\"href\":\"https://www.trivago.pl/?aDateRange%5Barr%5D=2021-01-22&aDateRange%5Bdep%5D=2021-01-24&aPriceRange%5Bfrom%5D=0&aPriceRange%5Bto%5D=0&iRoomType=1&aRooms%5B0%5D%5Badults%5D=1&cpt2=2555%2F106%2C2007%2F106%2C1527%2F106%2C1324%2F106%2C" + cityCodes[0] + "%2F" + cityCodes[1] + "&hasList=1&hasMap=1&bIsSeoPage=0&sortingId=2&slideoutsPageItemId=&iGeoDistanceLimit=20000&address=&addressGeoCode=&offset=0&ra=&overlayMode=\",\"origin\":\"https://www.trivago.pl\",\"protocol\":\"https:\",\"host\":\"www.trivago.pl\",\"hostname\":\"www.trivago.pl\",\"port\":\"\",\"pathname\":\"/\",\"search\":\"?aDateRange%5Barr%5D=2021-01-22&aDateRange%5Bdep%5D=2021-01-24&aPriceRange%5Bfrom%5D=0&aPriceRange%5Bto%5D=0&iRoomType=1&aRooms%5B0%5D%5Badults%5D=1&cpt2=2555%2F106%2C2007%2F106%2C1527%2F106%2C1324%2F106%2C" + cityCodes[0] + "%2F" + cityCodes[1] + "&hasList=1&hasMap=1&bIsSeoPage=0&sortingId=2&slideoutsPageItemId=&iGeoDistanceLimit=20000&address=&addressGeoCode=&offset=0&ra=&overlayMode=\",\"hash\":\"\"},\"clientDefined\":null,\"i\":{},\"sid\":\"\",\"cookie\":\"_yoid=7418f0d7-7bc9-427d-8649-243cd17f6b19; _yosid=d75e0ba5-9eac-4b6e-9324-807bffbeca44\"}}",
                "method": "POST",
                "mode": "cors",
                "credentials": "omit"
            });
        })
    }

    private updateFlightsWithAirportCoordinates(): void {
        if (this.currentFlights) {
            return;
        }
        this.currentFlights++;
        this.mapToDelayedObservableArray(this.flights)
            .subscribe((flight: Flight) => {
                console.log('Detailed flight start*** ', flight.arrival.city)
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
                        console.log('Detailed flight: ', flight.arrival.city, ', ', detailedFlight.end.name);
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

    private isNotHostelAndDistantAndExpensiveAgoda(flight: Flight, property): boolean {
        return !property.propertyResultType.includes('Hostel') // TODO: remove?
            && !this.isHotelExpensiveAgoda(property)
            && this.calculateStraightDistanceInKilometers(
                flight.coordinates,
                [property.content.informationSummary.geoInfo.longitude, property.content.informationSummary.geoInfo.latitude]
            ) < this.HOTEL_MAX_DISTANCE_TO_CENTER;
    }

    private isHotelExpensiveAgoda(property): boolean {
        return property.pricing.offers[0].roomOffers[0].room[0].pricing[0].price.perBook.inclusive.display > (this.HOTEL_COST_MAX * NUMBER_OF_PEOPLE);
    }

    private calculateStraightDistanceInKilometersAgoda(first: [number, number] | number[], second: [number, number] | number[]): number {
        const x2 = Math.pow(first[0] - second[0], 2);
        const y2 = Math.pow(first[1] - second[1], 2);
        return Math.sqrt(x2 + y2) * this.DECIMAL_DEGREE_TO_KM;
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
        flight.summary = +flight.cost.split(' ')[0] + hotelData.cost;
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

    private buildRemainingWeekends(long = false): Weekend[] {
        if (this.body === HOLIDAY_BODY) {
            // tslint:disable-next-line:no-shadowed-variable
            const today = new Date();
            today.setHours(11);
            // tslint:disable-next-line:no-shadowed-variable
            const weekends: Weekend[] = [];
            this.fridayStartFrom = 1;
            this.sundayStartFrom = 1;
            this.FLIGHT_COST_MAX = 3000;
            this.HOTEL_COST_MAX = 3000;
            this.trivagoQueryParams = TRIVAGO_HOLIDAY_QUERY_PARAMS as any;
            let firstDay = this.getNextDayOfWeek(today, 6);
            let lastDay = this.getNextDayOfWeek(this.getNextDayOfWeek(firstDay, 1), 7);
            while (lastDay.getFullYear() === today.getFullYear()) {
                weekends.push({
                    startDay: this.mapToISOStringDate(firstDay),
                    endDay: this.mapToISOStringDate(lastDay),
                    startHourFrom: this.fridayStartFrom,
                    startHourTo: this.fridayStartTo,
                    endHourFrom: this.sundayStartFrom,
                    endHourTo: this.sundayStartTo,
                    numberOfDays: 2
                });
                firstDay = this.getNextDayOfWeek(lastDay, 6);
                lastDay = this.getNextDayOfWeek(this.getNextDayOfWeek(firstDay, 1), 7);
            }
            return weekends;
        }
        // const today = new Date('2020-07-01');
        // const weekends: Weekend[] = [];
        // let friday = this.getNextDayOfWeek(today, this.startingDay);
        // let sunday = this.getNextDayOfWeek(friday, this.endingDay);
        // while (sunday.getDate() < 7 && sunday.getMonth() === 6) {
        const today = new Date();
        today.setHours(11);
        const weekends: Weekend[] = [];
        let friday = this.getNextDayOfWeek(today, this.startingDay);
        let sunday = this.getNextDayOfWeek(friday, this.endingDay);
        while (sunday.getFullYear() === today.getFullYear()) {
            weekends.push({
                startDay: this.mapToISOStringDate(friday),
                endDay: this.mapToISOStringDate(sunday),
                startHourFrom: this.fridayStartFrom,
                startHourTo: this.fridayStartTo,
                endHourFrom: this.sundayStartFrom,
                endHourTo: this.sundayStartTo,
                numberOfDays: 2
            });
            friday = this.getNextDayOfWeek(sunday, this.startingDay);
            sunday = this.getNextDayOfWeek(friday, this.endingDay);
        }
        // return weekends;
        return [
            { startDay: '2021-02-05', endDay: '2021-02-07', startHourFrom: 16, startHourTo: 23, endHourFrom: 10, endHourTo: 23, numberOfDays: 2 },
            // { startDay: '2021-02-06', endDay: '2021-02-07', startHourFrom: 7, startHourTo: 13, endHourFrom: 20, endHourTo: 23, numberOfDays: 1 },
            // { startDay: '2021-02-05', endDay: '2021-02-08', startHourFrom: 16, startHourTo: 23, endHourFrom: 1, endHourTo: 8, numberOfDays: 3 },
            // { startDay: '2021-02-06', endDay: '2021-02-08', startHourFrom: 7, startHourTo: 13, endHourFrom: 1, endHourTo: 8, numberOfDays: 2 },

            // { startDay: '2021-02-12', endDay: '2021-02-14', startHourFrom: 16, startHourTo: 23, endHourFrom: 12, endHourTo: 23, numberOfDays: 2 },
            // { startDay: '2021-02-19', endDay: '2021-02-21', startHourFrom: 16, startHourTo: 23, endHourFrom: 12, endHourTo: 23, numberOfDays: 2 },
            // { startDay: '2021-02-26', endDay: '2021-02-28', startHourFrom: 16, startHourTo: 23, endHourFrom: 12, endHourTo: 23, numberOfDays: 2 },

            // {startDay: '2021-07-11', endDay: '2021-07-12', startHourFrom: 7, startHourTo: 13, endHourFrom: 20, endHourTo: 23 },
            // {startDay: '2021-07-10', endDay: '2021-07-13', startHourFrom: 17, startHourTo: 23, endHourFrom: 1, endHourTo: 8 },
            // {startDay: '2021-07-11', endDay: '2021-07-13', startHourFrom: 7, startHourTo: 13, endHourFrom: 1, endHourTo: 8 },

            // {startDay: '2021-07-17', endDay: '2021-07-19', startHourFrom: 17, startHourTo: 23, endHourFrom: 10, endHourTo: 23 },
            // {startDay: '2021-07-18', endDay: '2021-07-19', startHourFrom: 7, startHourTo: 13, endHourFrom: 20, endHourTo: 23 },
            // {startDay: '2021-07-17', endDay: '2021-07-20', startHourFrom: 17, startHourTo: 23, endHourFrom: 1, endHourTo: 8 },
            // {startDay: '2021-07-18', endDay: '2021-07-20', startHourFrom: 7, startHourTo: 13, endHourFrom: 1, endHourTo: 8 },

            // {startDay: '2020-09-04', endDay: '2020-09-06', startHourFrom: 17, startHourTo: 23, endHourFrom: 10, endHourTo: 23 },
            // {startDay: '2020-09-05', endDay: '2020-09-06', startHourFrom: 7, startHourTo: 13, endHourFrom: 20, endHourTo: 23 },
            // {startDay: '2020-09-04', endDay: '2020-09-07', startHourFrom: 17, startHourTo: 23, endHourFrom: 1, endHourTo: 8 },
            // {startDay: '2020-09-05', endDay: '2020-09-07', startHourFrom: 7, startHourTo: 13, endHourFrom: 1, endHourTo: 8 },
            // {startDay: '2020-09-11', endDay: '2020-09-13', startHourFrom: 17, startHourTo: 23, endHourFrom: 10, endHourTo: 23 },
            // {startDay: '2020-09-12', endDay: '2020-09-13', startHourFrom: 7, startHourTo: 13, endHourFrom: 20, endHourTo: 23 },
            // {startDay: '2020-09-11', endDay: '2020-09-14', startHourFrom: 17, startHourTo: 23, endHourFrom: 1, endHourTo: 8 },
            // {startDay: '2020-09-12', endDay: '2020-09-14', startHourFrom: 7, startHourTo: 13, endHourFrom: 1, endHourTo: 8 },
            // {startDay: '2020-09-18', endDay: '2020-09-20', startHourFrom: 17, startHourTo: 23, endHourFrom: 10, endHourTo: 23 },
            // {startDay: '2020-09-19', endDay: '2020-09-20', startHourFrom: 7, startHourTo: 13, endHourFrom: 20, endHourTo: 23 },
            // {startDay: '2020-09-18', endDay: '2020-09-21', startHourFrom: 17, startHourTo: 23, endHourFrom: 1, endHourTo: 8 },
            // {startDay: '2020-09-19', endDay: '2020-09-21', startHourFrom: 7, startHourTo: 13, endHourFrom: 1, endHourTo: 8 },
            // {startDay: '2020-09-25', endDay: '2020-09-27', startHourFrom: 17, startHourTo: 23, endHourFrom: 10, endHourTo: 23 },
            // {startDay: '2020-09-26', endDay: '2020-09-27', startHourFrom: 7, startHourTo: 13, endHourFrom: 20, endHourTo: 23 },
            // {startDay: '2020-09-25', endDay: '2020-09-28', startHourFrom: 17, startHourTo: 23, endHourFrom: 1, endHourTo: 8 },
            // {startDay: '2020-09-26', endDay: '2020-09-28', startHourFrom: 7, startHourTo: 13, endHourFrom: 1, endHourTo: 8 },
        ];
    }

    private mapToTrivagoDate(date: string): string {
        return date
            .replace(/-/g, '');
    }

    private mapToISOStringDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    private getNextDayOfWeek(date, dayOfWeek): Date {
        if (dayOfWeek < 0 || dayOfWeek > 7) {
            return date;
        }
        const resultDate = new Date(date.getTime());
        resultDate.setDate(date.getDate() + (7 + dayOfWeek - date.getDay()) % 7);
        return resultDate;
    }

    private getAgodaCityCode(name: string): Promise<number> {
        const encodedCityName = encodeURIComponent(name);
        return fetch(`https://www.agoda.com/api/cronos/search/GetUnifiedSuggestResult/3/27/27/0/pl-pl?searchText=${encodedCityName}&guid=5860c32c-1afd-48aa-88ae-a125437eaba3&origin=PL&cid=1844104&pageTypeId=103&logtime=Wed%20Jan%2013%202021%2023%3A11%3A35%20GMT%2B0100%20(czas%20%C5%9Brodkowoeuropejski%20standardowy)&logTypeId=1&isHotelLandSearch=true`, {
            "headers": {
                "accept": "application/json, text/javascript, */*; q=0.01",
                "accept-language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
                "ag-language-id": "27",
                "ag-language-locale": "pl-pl",
                "content-type": "application/json; charset=utf-8",
                "cr-currency-code": "PLN",
                "cr-currency-id": "23",
                "sec-fetch-dest": "empty",
                "sec-fetch-mode": "cors",
                "sec-fetch-site": "same-origin",
                "x-requested-with": "XMLHttpRequest"
            },
            "referrer": "https://www.agoda.com/pl-pl/search?city=15470&locale=pl-pl&ckuid=a3d46da8-532a-41d6-a2a2-d42786317148&prid=0&gclid=Cj0KCQiA0fr_BRDaARIsAABw4Eurc1ej9agq29QbsqXAF1hr9JU5kAscWFPGWdM53mjlFUHElKIvyDAaAoJ-EALw_wcB&currency=PLN&correlationId=d139d68f-2bd0-4a4a-9f1e-143ed71b1bb7&pageTypeId=103&realLanguageId=27&languageId=27&origin=PL&cid=1844104&userId=a3d46da8-532a-41d6-a2a2-d42786317148&whitelabelid=1&loginLvl=0&storefrontId=3&currencyId=23&currencyCode=PLN&htmlLanguage=pl-pl&cultureInfoName=pl-pl&machineName=am-crweb-4005&trafficGroupId=1&sessionId=vwjqd0y4rxujhr5luhjmg0gs&trafficSubGroupId=84&aid=130589&useFullPageLogin=true&cttp=4&isRealUser=true&checkIn=2021-01-22&checkOut=2021-01-26&rooms=1&adults=1&children=0&priceCur=PLN&los=4&textToSearch=Pary%C5%BC&travellerType=0&familyMode=off&hotelReviewScore=7",
            "referrerPolicy": "strict-origin-when-cross-origin",
            "body": null,
            "method": "GET",
            "mode": "cors",
            "credentials": "include"
        }).then(response => response.json())
            .then(response => {
                return response.SuggestionList[0]?.ObjectID
            });
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
