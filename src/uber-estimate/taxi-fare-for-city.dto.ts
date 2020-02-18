import {TaxiFareDto} from "./taxi-fare.dto";

export class TaxiFareForCityDto {
    startingCost: TaxiFareDto;
    costPerKilometer: TaxiFareDto;
    costPerHourWait?: TaxiFareDto;

    constructor (start: number, ride: number, wait: number) {
        this.startingCost = new TaxiFareDto(start);
        this.costPerKilometer = new TaxiFareDto(ride);
        this.costPerHourWait = new TaxiFareDto(wait);
    }
}
