export function getGeoCodeUrl(encodedQuery: string): string {
    return 'https://api.opencagedata.com/geocode/v1/json?q=' + encodedQuery + '&key=d2343fb53f3f4466a4b187e871bc5ece';
}