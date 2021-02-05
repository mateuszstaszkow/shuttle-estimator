import {HttpService, Injectable} from '@nestjs/common';
import {Observable} from "rxjs";
import {CoordinatesDto} from "../model/coordinates-dto.interface";
import {map} from "rxjs/operators";
import {getGeoCodeUrl} from "./geocode.constants";

@Injectable()
export class GeocodeService {

    constructor(private readonly httpService: HttpService) {}

    public getCoordinatesFor(city: string, country?: string): Observable<CoordinatesDto> {
        const query = country ? city + ', ' + country : city;
        const encodedQuery = encodeURIComponent(query);
        const url = getGeoCodeUrl(encodedQuery);
        return this.httpService.get(url).pipe(
            map(response => response.data.results[0].geometry),
            map(geometry => ({ geocode: [geometry.lng, geometry.lat] }))
        );
    }
}
