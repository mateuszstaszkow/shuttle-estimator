export class TokenResponse {
    access_token: string;
    token_type: string;
    expires_in: string;
    refresh_token: string;
    scope: string;
}

export class EstimatesResponse {
    prices: Array<{
        localized_display_name: string;
        distance: number;
        product_id: string;
        high_estimate: number;
        low_estimate: number;
        duration: number;
        estimate: string;
        currency_code: 'PLN';
    }>;
}

export class UberPath {
    start_latitude: number;
    start_longitude: number;
    end_latitude: number;
    end_longitude: number;
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
