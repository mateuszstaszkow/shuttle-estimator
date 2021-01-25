export const getNumbeoOptions = (encodedCity: string): RequestInit => ({
    "credentials": "include",
    "headers": {
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "accept-language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
        "cache-control": "max-age=0",
        "sec-fetch-dest": "document",
        "sec-fetch-mode": "navigate",
        "sec-fetch-site": "same-origin",
        "sec-fetch-user": "?1",
        "upgrade-insecure-requests": "1"
    },
    "referrer": `https://www.numbeo.com/taxi-fare/in/${encodedCity}?displayCurrency=PLN`,
    "referrerPolicy": "no-referrer-when-downgrade",
    "body": null,
    "method": "GET",
    "mode": "cors"
});

export const TAXI_START_EXP = /<tr><td>Taxi Start \(Normal Tariff\) <\/td> <td style="text-align: right" class="priceValue "> <span class="first_currency">(.*)&nbsp;/;
export const TAXI_RIDE_EXP = /<td style="text-align: right" class="priceValue tr_highlighted"> <span class="first_currency">(.*)&nbsp;/;
export const TAXI_WAIT_EXP = /<tr><td>Taxi 1hour Waiting \(Normal Tariff\) <\/td> <td style="text-align: right" class="priceValue "> <span class="first_currency">(.*)&nbsp;/;

export const getNumbeoUrl = (encodedCity: string, currency: string): string => `https://www.numbeo.com/taxi-fare/in/${encodedCity}?displayCurrency=${currency}`;