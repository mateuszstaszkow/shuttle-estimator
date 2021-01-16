/*
 * @param startDay format: "2021-01-22"
 * @param endDay format: "2021-01-22"
 * @param arrivalHours format: [16, 22, 0, 23]
 * @param departHours format: [16, 22, 0, 23]
 */
import {BannedPlaces} from "../model/banned-places.interface";
import {Weekend} from "../model/weekend.interface";

export function getWarsawBody(startDay: string, endDay: string, arrivalHours: number[], departHours: number[]): any {
    return [
        null,
        [[67.89884754593243, 73.31933593749997], [17.954022726070548, -51.83691406250003]],
        null,
        [
            null,
            null,
            1,
            null,
            [],
            1,
            [1, 0, 0, 0],
            null,
            null,
            null,
            null,
            null,
            null,
            [
                [
                    [[["/m/081m_", 4]]],
                    [[]],
                    arrivalHours,
                    1,
                    [],
                    [],
                    startDay,
                    [360],
                    [],
                    [],
                    [],
                    null,
                    null
                ],
                [
                    [[]],
                    [[["/m/081m_", 4]]],
                    departHours,
                    1,
                    [],
                    [],
                    endDay,
                    [360],
                    [],
                    [],
                    [],
                    null,
                    null
                ]
            ],
            null,
            null,
            null,
            true,
            null,
            null,
            null,
            null,
            null,
            [],
            1
        ],
        null,
        1,
        true,
        false,
        true,
        false
    ];
}

// TODO: translate
export const BANNED_PLACES: BannedPlaces = {
    countries: [
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
    ],
    cities: [
        'London',
        'Birmingham',
        'Manchester',
        'Kaunas',
        'Palanga'
    ]
}

export const FLIGHT_HOURS_DEFAULT: Partial<Weekend> = {
    startHourFrom: 17,
    startHourTo: 23,
    endHourFrom: 10,
    endHourTo: 23,
}

export const MS_PER_DAY = 1000 * 3600 * 24;