export interface Weekend {
    startDay: string;
    endDay: string;
    startHourFrom: number;
    startHourTo: number;
    endHourFrom: number;
    endHourTo: number;
    isLast?: boolean;
    numberOfDays: number;
}