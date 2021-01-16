export interface Airport {
    startId?: string;
    endId?: string;
    city: string;
    country: string;
    airline?: string;
    coordinates?: [number, number];
    startDistance?: number;
    endDistance?: number;
    startTaxiCost?: number;
    endTaxiCost?: number;
}

export interface DetailedAirport {
    id: string;
    name: string;
    coordinates: number[];
}

export interface DetailedFlightAirports {
    start: DetailedAirport;
    end: DetailedAirport;
}

export function buildAirport(startId: string, endId: string, destination: any[], airline: string): Airport {
    return {
        startId,
        endId,
        city: destination[2],
        country: destination[4],
        startDistance: 0,
        endDistance: 0,
        airline,
    }
}