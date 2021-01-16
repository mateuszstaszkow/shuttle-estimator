import { Injectable } from '@nestjs/common';
import {Weekend} from "../model/weekend.interface";
import {MS_PER_DAY} from "../flight/flight.constants";

@Injectable()
export class WeekendService {

    // TODO: implement multiweekends
    public buildRemainingWeekends(startingDayOfTheWeek: number,
                                  endingDayOfTheWeek: number,
                                  numberOfWeekends: number,
                                  hours: Partial<Weekend>,
                                  isHoliday = false): Weekend[] {
        if (isHoliday) {
            return this.buildHolidayWeeks(hours);
        }
        console.log("Asia chce dac buziaczka Mateuszkowi")
        const today = new Date();
        today.setHours(11);
        const weekends: Weekend[] = [];
        let firstDay = this.getNextDayOfWeek(today, startingDayOfTheWeek);
        let lastDay = this.getNextDayOfWeek(firstDay, endingDayOfTheWeek);
        while (weekends.length < numberOfWeekends) {
            weekends.push(this.buildWeekend(firstDay, lastDay, hours));
            firstDay = this.getNextDayOfWeek(lastDay, startingDayOfTheWeek);
            lastDay = this.getNextDayOfWeek(firstDay, endingDayOfTheWeek);
        }
        return weekends;
    }

    // TODO: implement
    private buildHolidayWeeks(hours: Partial<Weekend>): Weekend[] {
        const today = new Date();
        today.setHours(11);
        const weekends: Weekend[] = [];
        // this.FLIGHT_COST_MAX = 3000;
        // this.HOTEL_COST_MAX = 3000;
        // this.trivagoQueryParams = TRIVAGO_HOLIDAY_QUERY_PARAMS as any;
        let firstDay = this.getNextDayOfWeek(today, 6);
        let lastDay = this.getNextDayOfWeek(this.getNextDayOfWeek(firstDay, 1), 7);
        while (lastDay.getFullYear() === today.getFullYear()) {
            weekends.push(this.buildWeekend(firstDay, lastDay, hours));
            firstDay = this.getNextDayOfWeek(lastDay, 6);
            lastDay = this.getNextDayOfWeek(this.getNextDayOfWeek(firstDay, 1), 7);
        }
        return weekends;
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

    private buildWeekend(firstDay: Date, lastDay: Date, hours: Partial<Weekend>): Weekend {
        const numberOfDays = (lastDay.getTime() - firstDay.getTime()) / MS_PER_DAY;
        return {
            startDay: this.mapToISOStringDate(firstDay),
            endDay: this.mapToISOStringDate(lastDay),
            startHourFrom: hours.startHourFrom,
            startHourTo: hours.startHourTo,
            endHourFrom: hours.endHourFrom,
            endHourTo: hours.endHourTo,
            numberOfDays
        };
    }
}
