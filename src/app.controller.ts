import { Controller, Get } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const fetch = require('node-fetch');

@Controller()
export class AppController {

  @Get()
  getHello(): Promise<any> {
    // return fetch("https://www.trivago.pl/graphql", {
    //   "headers": {
    //     "accept": "*/*",
    //     "accept-language": "pl",
    //     "apollographql-client-name": "hs-web",
    //     "apollographql-client-version": "v93_01_2_ap_3f507809f77",
    //     "content-type": "application/json",
    //     "sec-fetch-dest": "empty",
    //     "sec-fetch-mode": "cors",
    //     "sec-fetch-site": "same-origin",
    //     "x-trv-app-id": "HS_WEB_APP",
    //     "x-trv-cst": "27291,32046,38217,40402,45749,46136,46164,46535,47225,47828,47908,48329,48405,48506,48508,48542,48681,49291,49382,49419,49696,49752,49777,49819,50165,50553,50567,50805,50910,50950,51032,51076,51195,51198,51246,51458,51530,51591,51619,51886,51913,52217,52219,52244,52345,52366,52551,52590,52830,52891,53005,53018,53172-1,53183,53192,53231,53393,53508,53513,53593,53687,53763-1,53852,53894,54061,54098,54244,54273,54297-1,54333,54362,54596,54633-1,54792-6,54827,54889,55113",
    //     "x-trv-platform": "pl",
    //     "x-trv-tid": "7bc774897565e168fb4a0d8d90"
    //   },
    //   "referrer": "https://www.trivago.pl/?aDateRange%5Barr%5D=2021-01-22&aDateRange%5Bdep%5D=2021-01-24&aPriceRange%5Bfrom%5D=0&aPriceRange%5Bto%5D=0&iRoomType=1&aRooms%5B0%5D%5Badults%5D=1&cpt2=2555%2F106%2C2007%2F106%2C1527%2F106%2C1324%2F106%2C31357%2F200&hasList=1&hasMap=1&bIsSeoPage=0&sortingId=1&slideoutsPageItemId=&iGeoDistanceLimit=20000&address=&addressGeoCode=&offset=0&ra=&overlayMode=",
    //   "referrerPolicy": "no-referrer-when-downgrade",
    //   "body": "{\"operationName\":\"regionSearch\",\"variables\":{\"searchType\":\"cep.json\",\"queryParams\":\"{\\\"dt\\\":1,\\\"iph\\\":1,\\\"tz\\\":-60,\\\"pra\\\":\\\"\\\",\\\"channel\\\":\\\"b,isd:0,sps:22\\\",\\\"csid\\\":105,\\\"ccid\\\":\\\"X-eXDyMFHSQ2PW1ha81ltgAAACo\\\",\\\"adl\\\":3,\\\"crcl\\\":\\\"8.542821884155273/47.37184143066406,20000\\\",\\\"s\\\":\\\"0\\\",\\\"uiv\\\":\\\"2555/106,2007/106,1527/106,1324/106,31357/200:1\\\",\\\"tid\\\":\\\"7bc774897565e168fb4a0d8d90\\\",\\\"sp\\\":\\\"20210122/20210124\\\",\\\"rms\\\":\\\"1\\\",\\\"p\\\":\\\"pl\\\",\\\"l\\\":\\\"pl\\\",\\\"ccy\\\":\\\"PLN\\\",\\\"accoff\\\":0,\\\"acclim\\\":25}\",\"minEurocentPrice\":6639,\"maxEurocentPrice\":50895,\"pollData\":null,\"bucketIntervals\":[[6639,7056],[7057,7500],[7501,8137],[8138,8650],[8651,9195],[9196,9976],[9977,10605],[10606,11273],[11274,11983],[11984,13001],[13002,13820],[13821,14993],[14994,15938],[15939,16942],[16943,18380],[18381,19539],[19540,20770],[20771,22533],[22534,23953],[23954,25462],[25463,27624],[27625,29364],[29365,31215],[31216,33864],[33865,35998],[35999,38266],[38267,40678],[40679,44131],[44132,50895],[50896,2147483647]],\"isSponsoredListings\":true,\"advertiserLogoUrlParams\":{\"locale\":\"PL\",\"width\":68},\"openItemsInNewTab\":false,\"showBudgetHotels\":true,\"isMobileList\":false,\"shouldSkipRedirect\":true,\"aaScoreRating\":false,\"houseApartmentType\":true,\"locale\":\"PL\",\"cidns\":\"31357/200\",\"isVRBOOLB\":true,\"allowTrivagoPriceIndex\":true,\"showExclusiveBookingRatings\":true,\"showExclusiveVRBORatings\":false,\"amenities\":false,\"getFlashDeals\":true,\"shouldShowNewSpecialOffers\":false},\"extensions\":{\"persistedQuery\":{\"version\":1,\"sha256Hash\":\"b9ff99b23bb9d1ec014125d00f85ba0ccb1e129af7bbaabe98779e6c676f2a0e\"}}}",
    //   "method": "POST",
    //   "mode": "cors",
    //   "credentials": "include"
    // }).then(x => x.json());
    return fetch("https://www.trivago.pl/?aDateRange%5Barr%5D=2021-01-22&aDateRange%5Bdep%5D=2021-01-24&aPriceRange%5Bfrom%5D=0&aPriceRange%5Bto%5D=0&iRoomType=1&aRooms%5B0%5D%5Badults%5D=1&cpt2=2555%2F106%2C2007%2F106%2C1527%2F106%2C1324%2F106%2C22235%2F200&hasList=1&hasMap=1&bIsSeoPage=0&sortingId=2&slideoutsPageItemId=&iGeoDistanceLimit=20000&address=&addressGeoCode=&offset=0&ra=&overlayMode=", {
      "headers": {
        "Upgrade-Insecure-Requests": "1",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/87.0.4280.88 Safari/537.36",
        'X-Requested-With': 'XMLHttpRequest'
      }
    }).then(r => r.text());
  }
}
