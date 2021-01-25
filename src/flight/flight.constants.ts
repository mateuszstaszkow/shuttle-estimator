/*
 * @param startDay format: "2021-01-22"
 * @param endDay format: "2021-01-22"
 * @param arrivalHours format: [16, 22, 0, 23]
 * @param departHours format: [16, 22, 0, 23]
 */
import {BannedPlaces} from "../model/banned-places.interface";
import {Weekend} from "../model/weekend.interface";
import {Flight} from "../model/flight.interface";

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

export const GOOGLE_FLIGHTS_OPTIONS: RequestInit = {
    "headers": {
        "accept": "*/*",
        "accept-language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
        "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "x-client-data": "CIq2yQEIpLbJAQjEtskBCKmdygEIncLKAQisx8oBCPbHygEI98fKAQi0y8oBCKTNygEI3NXKAQjQm8sBCMGcywEI1JzLAQ==",
        "x-goog-batchexecute-bgr": "[\"!e3ileFHNAAV9TbPufUJ9jJ8f4cCtJVhpJKa20Vtf5AIAAABVUgAAABRoAQeZA7XVus33_vwSlRR8Ps6BVZHIORiqfvY81SY85GMeLa2N8D9Ookva1VS1JCY_wT73LkL_7N4r-aQslTXR77AaI_f0epXlNCPZCBjwDq5c_p4ncJRvfVNgRlc_jV-GlPNepKhy_pPMW4MY_S6l3FLTH1Yi96LjRrvPIoS-Ite_GcF8KcVMGGw9x-8yh_3lkfwzR5C2oRYPZJ7DIz6Z6NujMSLzQjrAz1PD7q9Cj3QWdGUq7T8w7mBjfivX0GredLd1wL1gPqJ_ScQZdkwdM4cqJ2Z1qsux5SZ0sVLKAGkxuKC7q7FzK94wUuVhzTIKWytvAReEQm-yCMMno18hVqwDjILt6Qa5TZXeVPtQJpIW8o6L1Ja-3rjZjgWlbxL1TQTAaepo0o351m8v5EfzPfZwgm8qt8WwhjTCL38-fmdRDV3CgC0rrI7dmbBgxP91ZAS08Q3pxg2Si-5JWrV5-PtSg-JiHFaoXOk3BIY7Z-G2J3kES07wfnxUfxPS1jwj8erP4BIFS0486omxvDN_44K5H1LlWoAwy6Xp_W2m4IyR8A6HGkskvUH7kxbDPVpzqhah-NGgoDizADbb7er99UOsCfjIGs0D0lo1Z3w-WNOVi0lkFpw5jtA0RDl7KbIxGbOMYLXYbL3cgmG6CLSvSGFUWh79QC4vaIgqidFQsHqMFreatHPXpRDfMM6oG-nydREi3JBRixbLG7qLdbF88LajZzvBx-nwESTIExCNUaxk7c0xQwfBwhJ1z39mEqhgUSvDwiR9jW_OCmiv5e2XMuZkCH6FKq_Nx_sWOAEDVfIJnGjdSp63CFvq6y5FmgyeAS30NLhVA5fZGnwyLhEeJjzn6DfBwpYnT8QMwbzBNGNeHSNPAPgNHGPDEda_96K0dlOLKok2Z5do1NvirS8Zp_t1wL3RBAEL-4lvg2aL3ml9Y0IBJPlrLbAMQoF__B3xVtZxVXWATG-ZhDe-sGeAV78kk3pYkPXCGQYuZjUXvaByMr457vBXIiruoGgeXZlaBU9nMbe4-g3HfSGokfhRPKHj3jI1XOGztTC1xoKQFiWV-IH7lcR6LSQhK9KflxLSy70MxPdfFlVtnhxM25IjPBB4XRma9eX2a1-A5qCxkGVqbeVXVYGGa4gL5tTlXZPqZSDfDpCjXixLJTSz6SG_NrpwsecdSkeHkF8ngAq1H-tST8LJeGRppAYma57ITLqEBNnRXkbGhu9kQPT_SB2h6PzwvYIYlZxPoclMlQg1kts0q5H_k0mDTcNw\",null,null,115,null,null,null,0,\"1\"]",
        "x-goog-ext-259736195-jspb": "[\"en-US\",\"PL\",\"PLN\",1,null,[-60],null,[[45626902,4370888]],1,[]]",
        "x-same-domain": "1"
    },
    "referrer": "https://www.google.com/",
    "referrerPolicy": "origin",
    "body": "",
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
};

export const GOOGLE_FLIGHTS_DETAILS_OPTIONS: RequestInit = {
    'credentials': 'include',
    'headers': {
        'accept': '*/*',
        'accept-language': 'pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'same-origin'
    },
    'referrer': 'https://www.google.com/',
    'referrerPolicy': 'origin',
    'body': null,
    'method': 'GET',
    'mode': 'cors'
};

export const getGoogleFlightsDetailsUrl = (flight: Flight,
                                           startHourFrom: number,
                                           startHourTo: number,
                                           endHourFrom: number,
                                           endHourTo: number): string => {
    return 'https://www.google.com/async/flights/search?vet=10ahUKEwiVpOWjqMznAhVKfZoKHSluDWIQjUMIZigA..i&ei=0hdEXpXzBMr66QSp3LWQBg&hl=en-US&yv=3&async=data:'
        + encodeURI(JSON.stringify([[[[[[null, [[flight.arrival.startId, 4]]], [null, [[flight.arrival.endId, 4]]], [flight.weekend.startDay]], [[null, [[flight.arrival.endId, 4]]], [null, [[flight.arrival.startId, 4]]], [flight.weekend.endDay]]], null, [], null, null, null, null, 1, null, 2, null, null, null, null, null, true], [[[null, [], [[startHourFrom, startHourTo]], [], [], null, [], []], [null, [], [[endHourFrom, endHourTo]], [], [], null, [], []]]], null, 'PLN', null, []], [0]])).replace(/,/g, '%2C').replace(/%5C/g, '%22')
        + ',s:s,tfg-bgr:%5B%22!_P-l_95CfJUuTPkGl0RYmy5IRqqQmHUCAAAAg1IAAAARmQG-54Shq2iVgQNBOEbpRA0sPhvX7PuOvzY1_C2GxMZX8htN96oME911MaRpfmPJuFlINC0mKmVLh8IVF_ZJRDG5ixU7lHqlaNvzYBLwr1CclxUXc9AqaMrUTS7zOEd3tHEsxEfS_TtPAwVnK-jvnyHziKVyr4Nq1XYNTpQ00YaQ593CHPoWH3K3Mw6hhNwwW0qnS4sLBHdNYDK6DoQRfeLdxXLvTkVN2fzfGNIErPPwp-puYdjCsZj77GPJL3PKF7SOmHzfi3Oty2WWhjLfdiCDTApUgK9PWAnVyAvPS9COjKZIw29bpDoluTh5uST5euyxb50VNqbeGAu_P6PaLWI2AyX5IRiUbVgmnkCRS5fdwJ--yU5u43MqelmLDIVPH1VmX6B_V5nOv5dAfXsLen5VymOoZHZTdNV6HC9yTMyj9dUyqcV1hPt0UOi43cWnT-hRd9fh1cnWKuMswAte_d2b6hQ2q36eSeYOa3yQMbKZcqzI6y5VbCHtS6uIqJDPJ1ExaymHBLzKEH42SrZwlt6XFp62J1dZI6jJh4_eHINH-WyTRSai1elvgnh5I7g6bJpWRDzeN9pqTmTXXvdu7P4%22%2Cnull%2Cnull%2C19%2C140%2Cnull%2Cnull%2C0%5D,_fmt:jspb';
}

export const MS_PER_DAY = 1000 * 3600 * 24;

export const GOOGLE_FLIGHTS_URL = 'https://www.google.com/_/TravelFrontendUi/data/travel.frontend.flights.FlightsFrontendService/GetExploreDestinations?f.sid=-3557253472044563618&bl=boq_travel-frontend-ui_20210106.02_p0&hl=en-US&gl=PL&soc-app=162&soc-platform=1&soc-device=1&_reqid=2181305&rt=c';