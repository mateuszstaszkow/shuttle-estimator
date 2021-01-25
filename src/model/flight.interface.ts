import {Weekend} from "./weekend.interface";
import {Airport, DetailedFlightAirports} from "./airport.interface";
import {Hotel} from "./hotel.interface";

export interface Flight {
    cost: number;
    coordinates: [number, number];
    arrival: Airport;
    depart: Airport;
    weekend: Weekend;
    isRound: boolean;
    summary?: number;
    hotel?: Hotel;
    invocations?: number; // TODO: remove
    detailedFlight?: DetailedFlightAirports;
}