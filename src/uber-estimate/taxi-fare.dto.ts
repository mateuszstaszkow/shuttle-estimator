export class TaxiFareDto {
    min?: number;
    max?: number;
    mean: number;

    constructor(mean: number) {
        this.mean = mean;
    }
}
