/*
* @param dates format: "20210122/20210124"
 */
export function getTrivagoQueryParams(hotelOptions: string,
                                      dates: string,
                                      numberOfPeople: number,
                                      pageNo: number): any {
    return {
        "dt": 1,
        "iph": 1,
        "tz": -60,
        "pra": "",
        "channel": "b,isd:0,sps:22",
        "csid": 105,
        "ccid": "X-eXDyMFHSQ2PW1ha81ltgAAACo",
        "adl": 3,
        "crcl": "8.542821884155273/47.37184143066406,20000",
        "s": "0",
        "uiv": hotelOptions,
        "tid": "7bc774897565e168fb4a0d8d90",
        "sp": dates,
        "rms": String(numberOfPeople),
        "p": "pl",
        "l": "pl",
        "ccy": "PLN",
        "accoff": pageNo,
        "acclim": 25
    };
}

export function getTrivagoBody(hotelOptions: string,
                               dates: string,
                               numberOfPeople: number,
                               cityCode: string,
                               pageNo: number): any {
    return {
        "operationName": "regionSearch",
        "variables": {
            "searchType": "cep.json",
            "queryParams": JSON.stringify(getTrivagoQueryParams(hotelOptions, dates, numberOfPeople, pageNo)),
            "minEurocentPrice": 6614,
            "maxEurocentPrice": 50710,
            "pollData": "",
            "bucketIntervals": [[6614, 7029], [7030, 7472], [7473, 8107], [8108, 8618], [8619, 9161], [9162, 9939], [9940, 10565], [10566, 11231], [11232, 11939], [11940, 12952], [12953, 13768], [13769, 14937], [14938, 15879], [15880, 16879], [16880, 18312], [18313, 19466], [19467, 20693], [20694, 22450], [22451, 23865], [23866, 25368], [25369, 27522], [27523, 29256], [29257, 31100], [31101, 33740], [33741, 35866], [35867, 38127], [38128, 40529], [40530, 43970], [43971, 50710], [50711, 2147483647]],
            "isSponsoredListings": true,
            "advertiserLogoUrlParams": {"locale": "PL", "width": 68},
            "openItemsInNewTab": false,
            "showBudgetHotels": true,
            "isMobileList": false,
            "shouldSkipRedirect": true,
            "aaScoreRating": true,
            "houseApartmentType": true,
            "locale": "PL",
            "cidns": cityCode,
            "isVRBOOLB": true,
            "allowTrivagoPriceIndex": true,
            "showExclusiveBookingRatings": true,
            "showExclusiveVRBORatings": false,
            "amenities": false,
            "getFlashDeals": true,
            "shouldShowNewSpecialOffers": false
        },
        "query": "query regionSearch($searchType: String, $queryParams: String, $pollData: String, $isSponsoredListings: Boolean!, $openItemsInNewTab: Boolean!, $aaScoreRating: Boolean!, $houseApartmentType: Boolean!, $showBudgetHotels: Boolean!, $isMobileList: Boolean!, $bucketIntervals: [[Int]], $shouldSkipRedirect: Boolean!, $amenities: Boolean!, $locale: String, $cidns: String, $isVRBOOLB: Boolean!, $advertiserLogoUrlParams: AdvertiserLogoUrlInput!, $allowTrivagoPriceIndex: Boolean!, $showExclusiveBookingRatings: Boolean!, $showExclusiveVRBORatings: Boolean!, $getFlashDeals: Boolean!, $shouldShowNewSpecialOffers: Boolean!) {\n  rs(searchType: $searchType, queryParams: $queryParams, pollData: $pollData, bucketIntervals: $bucketIntervals) {\n    ...FullResult\n    __typename\n  }\n}\n\nfragment FullResult on rsRes {\n  priceHistogram {\n    priceBins {\n      frequency\n      from\n      to\n      __typename\n    }\n    __typename\n  }\n  accommodations {\n    id {\n      id\n      ns\n      __typename\n    }\n    name {\n      value\n      lang @skip(if: $isMobileList)\n      dir\n      __typename\n    }\n    accommodationCategory\n    accommodationType {\n      value\n      lang @skip(if: $isMobileList)\n      dir @skip(if: $isMobileList)\n      __typename\n    }\n    accommodationTypeId\n    amenities @include(if: $amenities) {\n      group {\n        nsid {\n          ns\n          id\n          __typename\n        }\n        __typename\n      }\n      features {\n        nsid {\n          ns\n          id\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    houseApartmentType @include(if: $houseApartmentType)\n    advertiserInfo {\n      advertiserNsid {\n        ns\n        id\n        __typename\n      }\n      isSuperHost\n      reviewCount\n      reviewRating\n      reviewRatingIndex\n      __typename\n    }\n    searchReflectionConcepts @skip(if: $isMobileList)\n    locality {\n      value\n      lang @skip(if: $isMobileList)\n      dir @skip(if: $isMobileList)\n      __typename\n    }\n    localityId\n    distanceInMeters\n    constructionYear @skip(if: $isMobileList)\n    conceptDistance {\n      id\n      ns\n      distance_meters\n      typeId\n      name {\n        value\n        lang @skip(if: $isMobileList)\n        dir @skip(if: $isMobileList)\n        __typename\n      }\n      __typename\n    }\n    images {\n      main\n      count\n      mainUri @skip(if: $isMobileList)\n      retinaMainUri @skip(if: $isMobileList)\n      __typename\n    }\n    hasSpecialOffer @skip(if: $isMobileList)\n    hasSpecialOfferStatus @include(if: $shouldShowNewSpecialOffers)\n    inGreatDemand(locale: $locale, cidns: $cidns)\n    rating {\n      basedOn\n      category\n      superior\n      overallLiking\n      overallLikingIndex\n      formattedOverallLiking\n      __typename\n    }\n    aaScoreRating @include(if: $aaScoreRating)\n    aaCategory\n    creationDatetime {\n      date {\n        year\n        month\n        day\n        __typename\n      }\n      __typename\n    }\n    geocode {\n      lng\n      lat\n      __typename\n    }\n    deals {\n      bestPrice {\n        ptr\n        dealId\n        groupId\n        partnerId\n        shouldRedirect(queryParams: $queryParams) @include(if: $shouldSkipRedirect)\n        name {\n          value\n          lang @skip(if: $isMobileList)\n          dir @skip(if: $isMobileList)\n          __typename\n        }\n        advertiserLogo(params: $advertiserLogoUrlParams) {\n          url\n          __typename\n        }\n        priceAttributes {\n          nsid {\n            id\n            ns\n            __typename\n          }\n          name {\n            value\n            lang @skip(if: $isMobileList)\n            dir @skip(if: $isMobileList)\n            __typename\n          }\n          __typename\n        }\n        dealClassifications @include(if: $allowTrivagoPriceIndex) {\n          type {\n            nsid {\n              id\n              ns\n              __typename\n            }\n            __typename\n          }\n          score\n          __typename\n        }\n        displayPrice\n        displayPricePerStay\n        price\n        pricePerStay\n        euroCentPrice\n        isDirectConnect\n        displayAttributes\n        clcklB {\n          group\n          enc4\n          __typename\n        }\n        valueForMoney {\n          type {\n            id\n            ns\n            __typename\n          }\n          score\n          __typename\n        }\n        promotion @include(if: $getFlashDeals) {\n          flashDeals {\n            concept {\n              nsid {\n                id\n                ns\n                __typename\n              }\n              __typename\n            }\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      worstPrice {\n        dealId\n        groupId @skip(if: $isMobileList)\n        partnerId\n        shouldRedirect(queryParams: $queryParams) @include(if: $shouldSkipRedirect)\n        name {\n          value\n          lang @skip(if: $isMobileList)\n          dir @skip(if: $isMobileList)\n          __typename\n        }\n        priceAttributes @skip(if: $isMobileList) {\n          nsid {\n            id\n            ns\n            __typename\n          }\n          name {\n            value\n            lang\n            dir\n            __typename\n          }\n          __typename\n        }\n        dealClassifications @include(if: $allowTrivagoPriceIndex) {\n          type {\n            nsid {\n              id\n              ns\n              __typename\n            }\n            __typename\n          }\n          score\n          __typename\n        }\n        displayPrice\n        displayPricePerStay @skip(if: $isMobileList)\n        price\n        pricePerStay @skip(if: $isMobileList)\n        euroCentPrice @skip(if: $isMobileList)\n        isDirectConnect @skip(if: $isMobileList)\n        displayAttributes @skip(if: $isMobileList)\n        clcklB @skip(if: $isMobileList) {\n          group\n          enc4\n          __typename\n        }\n        __typename\n      }\n      alternative {\n        ptr\n        dealId\n        groupId\n        partnerId\n        shouldRedirect(queryParams: $queryParams)\n        name {\n          value\n          lang @skip(if: $isMobileList)\n          dir @skip(if: $isMobileList)\n          __typename\n        }\n        priceAttributes @skip(if: $isMobileList) {\n          nsid {\n            id\n            ns\n            __typename\n          }\n          name {\n            value\n            lang\n            dir\n            __typename\n          }\n          __typename\n        }\n        dealClassifications @include(if: $allowTrivagoPriceIndex) {\n          type {\n            nsid {\n              id\n              ns\n              __typename\n            }\n            __typename\n          }\n          score\n          __typename\n        }\n        displayPrice\n        displayPricePerStay\n        price\n        pricePerStay\n        euroCentPrice\n        isDirectConnect\n        displayAttributes\n        clcklB {\n          group\n          enc4\n          __typename\n        }\n        __typename\n      }\n      minPrice {\n        ptr\n        dealId\n        groupId\n        partnerId\n        shouldRedirect(queryParams: $queryParams) @include(if: $shouldSkipRedirect)\n        name {\n          value\n          __typename\n        }\n        priceAttributes {\n          nsid {\n            id\n            ns\n            __typename\n          }\n          name {\n            value\n            lang @skip(if: $isMobileList)\n            dir @skip(if: $isMobileList)\n            __typename\n          }\n          __typename\n        }\n        displayAttributes @include(if: $isSponsoredListings)\n        clcklB {\n          group\n          enc4\n          __typename\n        }\n        dealClassifications @include(if: $allowTrivagoPriceIndex) {\n          type {\n            nsid {\n              id\n              ns\n              __typename\n            }\n            __typename\n          }\n          score\n          __typename\n        }\n        displayPrice\n        price\n        displayPricePerStay\n        pricePerStay\n        __typename\n      }\n      fairPrice @include(if: $allowTrivagoPriceIndex) {\n        displayPrice\n        price\n        __typename\n      }\n      __typename\n    }\n    ratingAspects {\n      id\n      ns\n      value\n      __typename\n    }\n    highlights {\n      mp {\n        score\n        rank\n        nsid {\n          id\n          ns\n          __typename\n        }\n        __typename\n      }\n      isBudgetHotel @include(if: $showBudgetHotels)\n      __typename\n    }\n    bpp {\n      perc20\n      perc40\n      median\n      __typename\n    }\n    entirePlaceInfo {\n      adultCapacity\n      childrenCapacity\n      size\n      sizeUnit\n      bedrooms\n      bathrooms\n      floorNumber\n      roomNumber\n      __typename\n    }\n    packageDealOTAId\n    pathId @include(if: $openItemsInNewTab)\n    accommodationDetails @include(if: $showExclusiveVRBORatings) {\n      isVRBOExclusive\n      __typename\n    }\n    isVRBOOLB @include(if: $isVRBOOLB)\n    bookingExclusiveRating @include(if: $showExclusiveBookingRatings) {\n      reviewCount\n      overallLiking\n      overallLikingIndex\n      formattedRating\n      advertiser {\n        logo {\n          urlTail\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    vrboExclusiveRating @include(if: $showExclusiveVRBORatings) {\n      reviewCount\n      overallLiking\n      overallLikingIndex\n      formattedRating\n      advertiser {\n        logo {\n          urlTail\n          localizedUrlTail\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  clcklA {\n    csd\n    enc3\n    enc6\n    rid\n    __typename\n  }\n  clcklBase\n  pollData\n  requestId\n  totalCount\n  topConcepts {\n    center {\n      nsid {\n        id\n        ns\n        __typename\n      }\n      name {\n        value\n        lang @skip(if: $isMobileList)\n        dir @skip(if: $isMobileList)\n        __typename\n      }\n      geocode {\n        lng\n        lat\n        __typename\n      }\n      __typename\n    }\n    concepts {\n      nsid {\n        id\n        ns\n        __typename\n      }\n      name {\n        value\n        lang @skip(if: $isMobileList)\n        dir @skip(if: $isMobileList)\n        __typename\n      }\n      geocode {\n        lng\n        lat\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n  uiv @skip(if: $isMobileList) {\n    nsid\n    value\n    __typename\n  }\n  userBookingIntent\n  __typename\n}\n"
    };
}

export function getTrivagoOptions(hotelOptions: string,
                                  dates: string,
                                  numberOfPeople: number,
                                  cityCode: string,
                                  pageNo = 0): RequestInit {
    return {
        "headers": {
            "accept": "*/*",
            "accept-language": "pl",
            "apollographql-client-name": "hs-web",
            "apollographql-client-version": "v93_01_4_ab_81d3d8bcfca",
            "content-type": "application/json",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-trv-app-id": "HS_WEB_APP",
            "x-trv-cst": "27291,32046,38217,40402,45749,46136,46164,46535,47225,47828,47908,48329,48405,48506,48508,48542,48681,49291,49382,49419,49696,49752,49777,49819,50165,50553,50567,50805,50910,50950,51032,51076,51195,51198,51246,51458,51530,51591,51619,51886,51913,52217,52219,52244,52345,52366,52551,52590,52830,52891,53005,53018,53172-1,53183,53192,53231,53274,53393,53508,53513,53593,53687,53763-1,53852,53894,54061,54098,54244,54273,54297-1,54333,54362,54596,54633-1,54792-6,54795,54827,54889,54999,55113,55145",
            "x-trv-platform": "pl",
            "x-trv-tid": "7bc774897565e168fb4a0d8d90"
        },
        "referrer": "https://www.trivago.pl/?aDateRange%5Barr%5D=2021-01-22&aDateRange%5Bdep%5D=2021-01-24&aPriceRange%5Bfrom%5D=0&aPriceRange%5Bto%5D=0&iRoomType=7&aRooms%5B0%5D%5Badults%5D=2&cpt2=31357%2F200&hasList=1&hasMap=1&bIsSeoPage=0&sortingId=1&slideoutsPageItemId=&iGeoDistanceLimit=20000&address=&addressGeoCode=&offset=0&ra=&overlayMode=",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": JSON.stringify(getTrivagoBody(hotelOptions, dates, numberOfPeople, cityCode, pageNo)),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    };
}

export function getTrivagoSuggestionsBody(term: string): any {
    return {
        "operationName": "getSearchSuggestions",
        "variables": {
            "input": {
                "query": term,
                "previousQueries": [],
                "spellingCorrection": true,
                "metadata": {"connectionId": "YAd32MYK4EhJweGl4xgoXgAAABk", "sequenceId": 24}
            }
        },
        "query": "query getSearchSuggestions($input: SearchSuggestionsInput!) {\n  getSearchSuggestions(input: $input) {\n    searchSuggestions {\n      nsid {\n        id\n        ns\n        __typename\n      }\n      translatedName {\n        value\n        __typename\n      }\n      ... on AccommodationDetails {\n        coordinates {\n          latitude\n          longitude\n          __typename\n        }\n        typeObject {\n          nsid {\n            id\n            __typename\n          }\n          __typename\n        }\n        locationLabel\n        locality {\n          nsid {\n            id\n            ns\n            __typename\n          }\n          isSmallCity\n          __typename\n        }\n        __typename\n      }\n      ... on PointOfInterest {\n        coordinates {\n          latitude\n          longitude\n          __typename\n        }\n        typeObject {\n          nsid {\n            id\n            __typename\n          }\n          __typename\n        }\n        locationLabel\n        locality {\n          nsid {\n            id\n            ns\n            __typename\n          }\n          isSmallCity\n          __typename\n        }\n        __typename\n      }\n      ... on Destination {\n        coordinates {\n          latitude\n          longitude\n          __typename\n        }\n        typeObject {\n          nsid {\n            id\n            __typename\n          }\n          __typename\n        }\n        isSmallCity\n        locationLabel\n        boundingBox {\n          southWest {\n            latitude\n            longitude\n            __typename\n          }\n          northEast {\n            latitude\n            longitude\n            __typename\n          }\n          __typename\n        }\n        parent {\n          nsid {\n            id\n            ns\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    alternativeSuggestions {\n      name {\n        value\n        __typename\n      }\n      types\n      id\n      __typename\n    }\n    spellingCorrectedQuery\n    __typename\n  }\n}\n"
    };
}

export function getTrivagoSuggestionsOptions(term: string): RequestInit {
    return {
        "headers": {
            "accept": "*/*",
            "accept-language": "pl",
            "apollographql-client-name": "hs-web",
            "apollographql-client-version": "v93_01_4_ai_79fb83a0f34",
            "content-type": "application/json",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-trv-app-id": "HS_WEB_APP",
            "x-trv-cst": "27291,32046,38217,40402,45749,46136,46164,46535,47225,47828,47908,48329,48405,48506,48508,48542,48681,49291,49382,49419,49696,49752,49777,49819,50165,50190,50553,50567,50805,50910,50950,51032,51076,51195,51198,51246,51458,51530,51591,51619,51886,51913,52217,52219,52244,52345,52366,52551,52590,52830,52891,53005,53018,53172-1,53183,53192,53231,53274,53393,53508,53513,53593,53687,53763-1,53852,53894,54061,54098,54244,54273,54297-1,54333,54362,54596,54633-1,54792-6,54795,54827,54889,54999,55113,55145,55353",
            "x-trv-platform": "pl",
            "x-trv-tid": "7bc774897565e168fb4a0d8d90"
        },
        "referrer": "https://www.trivago.pl/",
        "referrerPolicy": "no-referrer-when-downgrade",
        'body': JSON.stringify(getTrivagoSuggestionsBody(term)),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    };
}

// startDate format ex: 2021-01-21
export const getAgodaHotelBody = (cityId: number, startDate: string, numberOfDays: number, numberOfPeople: number) => ({
    "operationName": "citySearch",
    "variables": {
        "CitySearchRequest": {
            "cityId": cityId, "searchRequest": {
                "searchCriteria": {
                    "bookingDate": `${startDate}T21:56:09.728Z`,
                    "checkInDate": `${startDate}T23:00:00.000Z`,
                    "localCheckInDate": startDate,
                    "los": numberOfDays,
                    "rooms": 1,
                    "adults": numberOfPeople,
                    "children": 0,
                    "childAges": [],
                    "ratePlans": [],
                    "featureFlagRequest": {
                        "fetchNamesForTealium": true,
                        "fiveStarDealOfTheDay": true,
                        "isAllowBookOnRequest": false,
                        "showUnAvailable": true,
                        "showRemainingProperties": true,
                        "isMultiHotelSearch": false,
                        "flags": [{
                            "feature": "FamilyChildFriendlyPopularFilter",
                            "enable": true
                        }, {
                            "feature": "FamilyChildFriendlyPropertyTypeFilter",
                            "enable": true
                        }, {"feature": "FamilyMode", "enable": false}]
                    },
                    "isUserLoggedIn": false,
                    "currency": "PLN",
                    "travellerType": "Couple",
                    "isAPSPeek": false,
                    "enableOpaqueChannel": false,
                    "isEnabledPartnerChannelSelection": null,
                    "sorting": {"sortField": "Price", "sortOrder": "Asc", "sortParams": null},
                    "requiredBasis": "PRPN",
                    "requiredPrice": "AllInclusive",
                    "suggestionLimit": 0,
                    "synchronous": false,
                    "supplierPullMetadataRequest": null,
                    "isRoomSuggestionRequested": false,
                    "isAPORequest": false,
                    "hasAPOFilter": false,
                    "isAllowBookOnRequest": true
                },
                "searchContext": {
                    "userId": "a3d46da8-532a-41d6-a2a2-d42786317148",
                    "memberId": 0,
                    "locale": "en-us",
                    "cid": 1844104,
                    "origin": "PL",
                    "platform": 1,
                    "deviceTypeId": 1,
                    "experiments": {
                        "forceByVariant": null,
                        "forceByExperiment": [{"id": "FAM-366", "variant": "B"}, {
                            "id": "CP-4081",
                            "variant": "B"
                        }, {"id": "DRAGON-2308", "variant": "B"}, {
                            "id": "MIN-13903-2",
                            "variant": "B"
                        }, {"id": "MIN-14036", "variant": "B"}, {"id": "FAM-4293", "variant": "Z"}, {
                            "id": "PLECS-5778",
                            "variant": "Z"
                        }, {"id": "TEXT-9339", "variant": "Z"}, {"id": "UMRAH-B2B", "variant": "B"}, {
                            "id": "JGCW-204",
                            "variant": "B"
                        }, {"id": "JGCW-264", "variant": "B"}, {"id": "JGCW-299", "variant": "B"}, {
                            "id": "JGCW-159",
                            "variant": "B"
                        }]
                    },
                    "isRetry": false,
                    "showCMS": false,
                    "storeFrontId": 3,
                    "pageTypeId": 103,
                    "whiteLabelKey": null,
                    "ipAddress": "84.10.208.59",
                    "endpointSearchType": "CitySearch",
                    "trackSteps": null
                },
                "matrix": null,
                "matrixGroup": [{"matrixGroup": "AffordableCategory", "size": 100}, {
                    "matrixGroup": "HotelFacilities",
                    "size": 100
                }, {"matrixGroup": "BeachAccessTypeIds", "size": 100}, {
                    "matrixGroup": "StarRating",
                    "size": 20
                }, {"matrixGroup": "NumberOfBedrooms", "size": 100}, {
                    "matrixGroup": "LandmarkIds",
                    "size": 10
                }, {
                    "matrixGroup": "AllGuestReviewBreakdown",
                    "size": 100
                }, {"matrixGroup": "MetroSubwayStationLandmarkIds", "size": 20}, {
                    "matrixGroup": "ProductType",
                    "size": 100
                }, {"matrixGroup": "BusStationLandmarkIds", "size": 20}, {
                    "matrixGroup": "RoomBenefits",
                    "size": 100
                }, {"matrixGroup": "ReviewLocationScore", "size": 3}, {
                    "matrixGroup": "LandmarkSubTypeCategoryIds",
                    "size": 20
                }, {"matrixGroup": "ReviewScore", "size": 100}, {
                    "matrixGroup": "IsStaycation",
                    "size": 5
                }, {"matrixGroup": "AccommodationType", "size": 100}, {
                    "matrixGroup": "PaymentOptions",
                    "size": 100
                }, {"matrixGroup": "TrainStationLandmarkIds", "size": 20}, {
                    "matrixGroup": "HotelAreaId",
                    "size": 100
                }, {"matrixGroup": "HotelChainId", "size": 10}, {
                    "matrixGroup": "AtmosphereIds",
                    "size": 100
                }, {"matrixGroup": "RoomAmenities", "size": 100}, {"matrixGroup": "Deals", "size": 100}],
                "filterRequest": {
                    "idsFilters": [{
                        "filterKey": "AccommodationType",
                        "ids": [34, 29, 37, 120, 32, 28, 131, 122, 115]
                    }],
                    "rangeFilters": [{
                        "filterKey": "ReviewScore",
                        "ranges": [{"from": 7, "to": 10}]
                    }, {"filterKey": "ReviewLocationScore", "ranges": [{"from": 8, "to": 10}]}],
                    "textFilters": []
                },
                "page": {"pageSize": 45, "pageNumber": 1},
                "apoRequest": {"apoPageSize": 10},
                "searchHistory": null,
                "searchDetailRequest": {"priceHistogramBins": 50},
                "isTrimmedResponseRequested": false,
                "featuredAgodaHomesRequest": null,
                "featuredLuxuryHotelsRequest": null,
                "highlyRatedAgodaHomesRequest": {
                    "numberOfAgodaHomes": 30,
                    "minimumReviewScore": 7.5,
                    "minimumReviewCount": 3,
                    "accommodationTypes": [28, 29, 30, 102, 103, 106, 107, 108, 109, 110, 114, 115, 120, 131],
                    "sortVersion": 0
                },
                "extraAgodaHomesRequest": null,
                "extraHotels": {"extraHotelIds": [], "enableFiltersForExtraHotels": false},
                "packaging": null
            }
        }, "ContentSummaryRequest": {
            "context": {
                "rawUserId": "a3d46da8-532a-41d6-a2a2-d42786317148",
                "memberId": 0,
                "userOrigin": "PL",
                "locale": "en-us",
                "forceExperimentsByIdNew": [{"key": "FAM-366", "value": "B"}, {
                    "key": "CP-4081",
                    "value": "B"
                }, {"key": "DRAGON-2308", "value": "B"}, {"key": "MIN-13903-2", "value": "B"}, {
                    "key": "MIN-14036",
                    "value": "B"
                }, {"key": "FAM-4293", "value": "Z"}, {"key": "PLECS-5778", "value": "Z"}, {
                    "key": "TEXT-9339",
                    "value": "Z"
                }, {"key": "UMRAH-B2B", "value": "B"}, {"key": "JGCW-204", "value": "B"}, {
                    "key": "JGCW-264",
                    "value": "B"
                }, {"key": "JGCW-299", "value": "B"}, {"key": "JGCW-159", "value": "B"}],
                "apo": false,
                "searchCriteria": {"cityId": 15470},
                "platform": {"id": 1},
                "storeFrontId": 3,
                "cid": "1844104",
                "occupancy": {"numberOfAdults": 1, "numberOfChildren": 0, "travelerType": 0},
                "deviceTypeId": 1,
                "whiteLabelKey": "",
                "correlationId": ""
            },
            "summary": {"highlightedFeaturesOrderPriority": null, "description": false},
            "reviews": {
                "commentary": null,
                "demographics": {"providerIds": null, "filter": {"defaultProviderOnly": true}},
                "summaries": {"providerIds": null, "apo": true, "limit": 1, "travellerType": 3},
                "cumulative": {"providerIds": null},
                "filters": null
            },
            "images": {"page": null, "maxWidth": 0, "maxHeight": 0, "imageSizes": null, "indexOffset": null},
            "rooms": {
                "images": null,
                "featureLimit": 0,
                "filterCriteria": null,
                "includeMissing": false,
                "includeSoldOut": false,
                "includeDmcRoomId": false,
                "soldOutRoomCriteria": null
            },
            "nonHotelAccommodation": true,
            "engagement": true,
            "highlights": {
                "maxNumberOfItems": 0,
                "images": {"imageSizes": [{"key": "full", "size": {"width": 0, "height": 0}}]}
            },
            "personalizedInformation": false,
            "localInformation": {"images": null},
            "features": null,
            "synopsis": true
        }, "PricingSummaryRequest": {
            "cheapestOnly": false,
            "context": {
                "abTests": [{"testId": 9021, "abUser": "B"}, {"testId": 9023, "abUser": "B"}, {
                    "testId": 9024,
                    "abUser": "B"
                }, {"testId": 9025, "abUser": "B"}, {"testId": 9027, "abUser": "B"}, {"testId": 9029, "abUser": "B"}],
                "clientInfo": {
                    "cid": 1844104,
                    "languageId": 27,
                    "languageUse": 1,
                    "origin": "PL",
                    "platform": 1,
                    "searchId": "",
                    "storefront": 3,
                    "userId": "a3d46da8-532a-41d6-a2a2-d42786317148",
                    "ipAddress": "84.10.208.59"
                },
                "experiment": [{"name": "FAM-366", "variant": "B"}, {
                    "name": "CP-4081",
                    "variant": "B"
                }, {"name": "DRAGON-2308", "variant": "B"}, {
                    "name": "MIN-13903-2",
                    "variant": "B"
                }, {"name": "MIN-14036", "variant": "B"}, {"name": "FAM-4293", "variant": "Z"}, {
                    "name": "PLECS-5778",
                    "variant": "Z"
                }, {"name": "TEXT-9339", "variant": "Z"}, {"name": "UMRAH-B2B", "variant": "B"}, {
                    "name": "JGCW-204",
                    "variant": "B"
                }, {"name": "JGCW-264", "variant": "B"}, {"name": "JGCW-299", "variant": "B"}, {
                    "name": "JGCW-159",
                    "variant": "B"
                }],
                "isAllowBookOnRequest": true,
                "isDebug": false,
                "sessionInfo": {"isLogin": false, "memberId": 0, "sessionId": 1},
                "packaging": null
            },
            "isSSR": true,
            "pricing": {
                "bookingDate": "2021-01-20T18:41:48.783Z",
                "checkIn": "2021-01-21T23:00:00.000Z",
                "checkout": "2021-01-23T23:00:00.000Z",
                "localCheckInDate": "2021-01-22",
                "localCheckoutDate": "2021-01-24",
                "currency": "PLN",
                "details": {"cheapestPriceOnly": false, "itemBreakdown": false, "priceBreakdown": false},
                "featureFlag": ["ClientDiscount", "PriceHistory", "VipPlatinum", "CouponSellEx", "MixAndSave", "APSPeek", "StackChannelDiscount", "AutoApplyPromos"],
                "features": {
                    "crossOutRate": false,
                    "isAPSPeek": false,
                    "isAllOcc": false,
                    "isApsEnabled": false,
                    "isIncludeUsdAndLocalCurrency": false,
                    "isMSE": true,
                    "isRPM2Included": true,
                    "maxSuggestions": 0,
                    "newRateModel": false,
                    "overrideOccupancy": false,
                    "priusId": 0,
                    "synchronous": false,
                    "showCouponAmountInUserCurrency": false
                },
                "filters": {
                    "cheapestRoomFilters": [],
                    "filterAPO": false,
                    "ratePlans": [1],
                    "secretDealOnly": false,
                    "suppliers": [],
                    "nosOfBedrooms": []
                },
                "includedPriceInfo": false,
                "occupancy": {"adults": 1, "children": 0, "childAges": [], "rooms": 1, "childrenTypes": []},
                "supplierPullMetadata": {"requiredPrecheckAccuracyLevel": 0},
                "mseHotelIds": [],
                "ppLandingHotelIds": [],
                "searchedHotelIds": [],
                "paymentId": -1
            },
            "suggestedPrice": "AllInclusive"
        }
    },
    "query": "query citySearch($CitySearchRequest: CitySearchRequest!, $ContentSummaryRequest: ContentSummaryRequest!, $PricingSummaryRequest: PricingRequestParameters) {\n  citySearch(CitySearchRequest: $CitySearchRequest) {\n    searchResult {\n      sortMatrix {\n        result {\n          fieldId\n          sorting {\n            sortField\n            sortOrder\n            sortParams {\n              id\n            }\n          }\n          display {\n            name\n          }\n          childMatrix {\n            fieldId\n            sorting {\n              sortField\n              sortOrder\n              sortParams {\n                id\n              }\n            }\n            display {\n              name\n            }\n            childMatrix {\n              fieldId\n              sorting {\n                sortField\n                sortOrder\n                sortParams {\n                  id\n                }\n              }\n              display {\n                name\n              }\n            }\n          }\n        }\n      }\n      searchInfo {\n        hasSecretDeal\n        isComplete\n        totalFilteredHotels\n        searchStatus {\n          searchCriteria {\n            checkIn\n          }\n          searchStatus\n        }\n        objectInfo {\n          objectName\n          cityName\n          cityEnglishName\n          countryId\n          countryEnglishName\n          mapLatitude\n          mapLongitude\n          mapZoomLevel\n          wlPreferredCityName\n          wlPreferredCountryName\n        }\n      }\n      urgencyDetail {\n        urgencyScore\n      }\n      histogram {\n        bins {\n          numOfElements\n          upperBound {\n            perNightPerRoom\n            perPax\n          }\n        }\n      }\n    }\n    properties(ContentSummaryRequest: $ContentSummaryRequest, PricingSummaryRequest: $PricingSummaryRequest) {\n      propertyId\n      sponsoredDetail {\n        sponsoredType\n        trackingData\n        isShowSponsoredFlag\n      }\n      propertyResultType\n      content {\n        informationSummary {\n          propertyLinks {\n            propertyPage\n          }\n          atmospheres {\n            id\n            name\n          }\n          localeName\n          defaultName\n          displayName\n          accommodationType\n          awardYear\n          hasHostExperience\n          address {\n            country {\n              id\n              name\n            }\n            city {\n              id\n              name\n            }\n            area {\n              id\n              name\n            }\n          }\n          propertyType\n          rating\n          agodaGuaranteeProgram\n          remarks {\n            renovationInfo {\n              renovationType\n              year\n            }\n          }\n          spokenLanguages {\n            id\n          }\n          geoInfo {\n            latitude\n            longitude\n          }\n        }\n        propertyEngagement {\n          lastBooking\n          peopleLooking\n        }\n        nonHotelAccommodation {\n          masterRooms {\n            noOfBathrooms\n            noOfBedrooms\n            noOfBeds\n            roomSizeSqm\n            highlightedFacilities\n          }\n          hostLevel {\n            id\n            name\n          }\n          supportedLongStay\n        }\n        facilities {\n          id\n        }\n        images {\n          hotelImages {\n            id\n            caption\n            providerId\n            urls {\n              key\n              value\n            }\n          }\n        }\n        reviews {\n          contentReview {\n            isDefault\n            providerId\n            demographics {\n              groups {\n                id\n                grades {\n                  id\n                  score\n                }\n              }\n            }\n            summaries {\n              recommendationScores {\n                recommendationScore\n              }\n              snippets {\n                countryId\n                countryCode\n                countryName\n                date\n                demographicId\n                demographicName\n                reviewer\n                reviewRating\n                snippet\n              }\n            }\n            cumulative {\n              reviewCount\n              score\n            }\n          }\n          cumulative {\n            reviewCount\n            score\n          }\n        }\n        familyFeatures {\n          hasChildrenFreePolicy\n          isFamilyRoom\n          hasMoreThanOneBedroom\n          isInterConnectingRoom\n          isInfantCottageAvailable\n          hasKidsPool\n          hasKidsClub\n        }\n        personalizedInformation {\n          childrenFreePolicy {\n            fromAge\n            toAge\n          }\n        }\n        localInformation {\n          landmarks {\n            transportation {\n              landmarkName\n              distanceInM\n            }\n            topLandmark {\n              landmarkName\n              distanceInM\n            }\n          }\n          hasAirportTransfer\n        }\n        highlight {\n          cityCenter {\n            isInsideCityCenter\n            distanceFromCityCenter\n          }\n          favoriteFeatures {\n            features {\n              id\n              title\n              category\n            }\n          }\n          hasNearbyPublicTransportation\n        }\n      }\n      soldOut {\n        soldOutPrice {\n          averagePrice\n        }\n      }\n      pricing {\n        isAvailable\n        isReady\n        benefits\n        cheapestRoomOffer {\n          agodaCash {\n            showBadge\n            giftcardGuid\n            dayToEarn\n            earnId\n            percentage\n            expiryDay\n          }\n        }\n        isEasyCancel\n        isInsiderDeal\n        isMultiHotelEligible\n        suggestPriceType {\n          suggestPrice\n        }\n        roomBundle {\n          bundleId\n          bundleType\n          saveAmount {\n            perNight {\n              ...Fragf349e913bgi3i7030011\n            }\n          }\n        }\n        pointmax {\n          channelId\n          point\n        }\n        priceChange {\n          changePercentage\n          searchDate\n        }\n        payment {\n          cancellation {\n            cancellationType\n          }\n          payLater {\n            isEligible\n          }\n          payAtHotel {\n            isEligible\n          }\n          noCreditCard {\n            isEligible\n          }\n          taxReceipt {\n            isEligible\n          }\n        }\n        pricingMessages {\n          location\n          ids\n        }\n        suppliersSummaries {\n          id\n          supplierHotelId\n        }\n        supplierInfo {\n          id\n          name\n          isAgodaBand\n        }\n        offers {\n          roomOffers {\n            room {\n              availableRooms\n              isPromoEligible\n              promotions {\n                typeId\n                promotionDiscount {\n                  value\n                }\n              }\n              supplierId\n              corSummary {\n                hasCor\n                corType\n                isOriginal\n                hasOwnCOR\n                isBlacklistedCor\n              }\n              localVoucher {\n                currencyCode\n                amount\n              }\n              pricing {\n                currency\n                price {\n                  perNight {\n                    exclusive {\n                      display\n                      originalPrice\n                    }\n                    inclusive {\n                      display\n                      originalPrice\n                    }\n                  }\n                  perBook {\n                    exclusive {\n                      display\n                      rebatePrice\n                      originalPrice\n                      autoAppliedPromoDiscount\n                    }\n                    inclusive {\n                      display\n                      rebatePrice\n                      originalPrice\n                      autoAppliedPromoDiscount\n                    }\n                  }\n                  perRoomPerNight {\n                    exclusive {\n                      display\n                      crossedOutPrice\n                      rebatePrice\n                      pseudoCouponPrice\n                      originalPrice\n                    }\n                    inclusive {\n                      display\n                      crossedOutPrice\n                      rebatePrice\n                      pseudoCouponPrice\n                      originalPrice\n                    }\n                  }\n                  totalDiscount\n                  priceAfterAppliedAgodaCash {\n                    perBook {\n                      ...Frag2hd10j871jddg06ah770\n                    }\n                    perRoomPerNight {\n                      ...Frag2hd10j871jddg06ah770\n                    }\n                  }\n                }\n                apsPeek {\n                  perRoomPerNight {\n                    ...Fragf349e913bgi3i7030011\n                  }\n                }\n                promotionPricePeek {\n                  display {\n                    perBook {\n                      ...Fragf349e913bgi3i7030011\n                    }\n                    perRoomPerNight {\n                      ...Fragf349e913bgi3i7030011\n                    }\n                    perNight {\n                      ...Fragf349e913bgi3i7030011\n                    }\n                  }\n                  discountType\n                  promotionCode\n                  promoAppliedOnFinalPrice\n                  childPromotions {\n                    campaignId\n                  }\n                }\n                channelDiscountSummary {\n                  channelDiscountBreakdown {\n                    display\n                    discountPercent\n                    channelId\n                  }\n                }\n              }\n              uid\n              payment {\n                cancellation {\n                  cancellationType\n                }\n              }\n              discount {\n                deals\n                channelDiscount\n              }\n              saveUpTo {\n                perRoomPerNight\n              }\n              benefits {\n                id\n                targetType\n              }\n              channel {\n                id\n              }\n              mseRoomSummaries {\n                supplierId\n                subSupplierId\n                pricingSummaries {\n                  currency\n                  channelDiscountSummary {\n                    channelDiscountBreakdown {\n                      channelId\n                      discountPercent\n                      display\n                    }\n                  }\n                  price {\n                    perRoomPerNight {\n                      exclusive {\n                        display\n                      }\n                      inclusive {\n                        display\n                      }\n                    }\n                  }\n                }\n              }\n              agodaCash {\n                showBadge\n                giftcardGuid\n                dayToEarn\n                expiryDay\n                percentage\n              }\n              corInfo {\n                corBreakdown {\n                  taxExPN {\n                    ...Fragf5695j09eb1029fc5e6f\n                  }\n                  taxInPN {\n                    ...Fragf5695j09eb1029fc5e6f\n                  }\n                  taxExPRPN {\n                    ...Fragf5695j09eb1029fc5e6f\n                  }\n                  taxInPRPN {\n                    ...Fragf5695j09eb1029fc5e6f\n                  }\n                }\n                corInfo {\n                  corType\n                }\n              }\n              loyaltyDisplay {\n                items\n              }\n              capacity {\n                extraBedsAvailable\n              }\n              pricingMessages {\n                formatted {\n                  location\n                  texts {\n                    index\n                    text\n                  }\n                }\n              }\n              campaign {\n                selected {\n                  messages {\n                    campaignName\n                    title\n                    titleWithDiscount\n                    description\n                    linkOutText\n                    url\n                  }\n                }\n              }\n            }\n          }\n        }\n      }\n      enrichment {\n        topSellingPoint {\n          tspType\n          value\n        }\n        pricingBadges {\n          badges\n        }\n        uniqueSellingPoint {\n          rank\n          segment\n          uspType\n          uspPropertyType\n        }\n        bookingHistory {\n          bookingCount {\n            count\n            timeFrame\n          }\n        }\n        showReviewSnippet\n        isPopular\n      }\n      priceBreakerProperties {\n        propertyId\n        content {\n          informationSummary {\n            displayName\n            rating\n            propertyLinks {\n              propertyPage\n            }\n            address {\n              area {\n                name\n              }\n              city {\n                name\n              }\n            }\n          }\n          highlight {\n            cityCenter {\n              distanceFromCityCenter\n              isInsideCityCenter\n            }\n          }\n          reviews {\n            contentReview {\n              summaries {\n                snippets {\n                  countryId\n                  countryCode\n                  countryName\n                  date\n                  demographicId\n                  demographicName\n                  reviewer\n                  reviewRating\n                  snippet\n                }\n              }\n            }\n            cumulative {\n              score\n              reviewCount\n            }\n          }\n          images {\n            hotelImages {\n              id\n              caption\n              providerId\n              urls {\n                key\n                value\n              }\n            }\n          }\n        }\n        pricing {\n          isReady\n          isAvailable\n          offers {\n            roomOffers {\n              room {\n                pricing {\n                  currency\n                  price {\n                    perRoomPerNight {\n                      exclusive {\n                        crossedOutPrice\n                        display\n                      }\n                      inclusive {\n                        crossedOutPrice\n                        display\n                      }\n                    }\n                  }\n                }\n              }\n            }\n          }\n        }\n      }\n    }\n    searchEnrichment {\n      suppliersInformation {\n        supplierId\n        supplierName\n        isAgodaBand\n      }\n    }\n    aggregation {\n      matrixGroupResults {\n        matrixGroup\n        matrixItemResults {\n          id\n          name\n          count\n          filterKey\n          filterRequestType\n          extraDataResults {\n            text\n            matrixExtraDataType\n          }\n        }\n      }\n    }\n  }\n}\n\nfragment Frag2hd10j871jddg06ah770 on DisplayPrice {\n  exclusive\n  allInclusive\n}\n\nfragment Fragf349e913bgi3i7030011 on DFDisplayPrice {\n  exclusive\n  allInclusive\n}\n\nfragment Fragf5695j09eb1029fc5e6f on DFCorBreakdownItem {\n  price\n  id\n}\n"
});

export const getAgodaHotelOptions = (cityId: number, startDate: string, numberOfDays: number, numberOfPeople: number) => ({
    "headers": {
        "accept": "*/*",
        "accept-language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
        "access-control-max-age": "7200",
        "ag-debug-override-origin": "PL",
        "ag-language-locale": "pl-pl",
        "ag-page-type-id": "103",
        "ag-request-attempt": "1",
        "ag-request-id": "e00d4e88-049c-4459-80f0-25a2c5cf5daf",
        "ag-retry-attempt": "0",
        "content-type": "application/json",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin"
    },
    "referrer": "https://www.agoda.com/pl-pl/search?city=15470&locale=pl-pl&ckuid=a3d46da8-532a-41d6-a2a2-d42786317148&prid=0&currency=PLN&correlationId=420ff3d0-4f20-4a32-ad37-87a6ac39fa2f&pageTypeId=103&realLanguageId=27&languageId=27&origin=PL&cid=1844104&userId=a3d46da8-532a-41d6-a2a2-d42786317148&whitelabelid=1&loginLvl=0&storefrontId=3&currencyId=23&currencyCode=PLN&htmlLanguage=pl-pl&cultureInfoName=pl-pl&machineName=am-crweb-4004&trafficGroupId=1&sessionId=vwjqd0y4rxujhr5luhjmg0gs&trafficSubGroupId=84&aid=130589&useFullPageLogin=true&cttp=4&isRealUser=true&checkIn=2021-01-22&checkOut=2021-01-24&rooms=1&adults=1&children=0&priceCur=PLN&los=2&textToSearch=Pary%C5%BC&travellerType=0&familyMode=off&hotelReviewScore=7&hotelAccom=34,29,37,120,32,28,131,122,115&productType=-1",
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": JSON.stringify(getAgodaHotelBody(cityId, startDate, numberOfDays, numberOfPeople)),
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
});

export function getAgodaSuggestionsOptions(): RequestInit {
    return {
        "headers": {
            "accept": "application/json, text/javascript, */*; q=0.01",
            "accept-language": "pl-PL,pl;q=0.9,en-US;q=0.8,en;q=0.7",
            "ag-language-id": "27",
            "ag-language-locale": "pl-pl",
            "content-type": "application/json; charset=utf-8",
            "cr-currency-code": "PLN",
            "cr-currency-id": "23",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-origin",
            "x-requested-with": "XMLHttpRequest"
        },
        "referrer": "https://www.agoda.com/pl-pl/search?city=15470&locale=pl-pl&ckuid=a3d46da8-532a-41d6-a2a2-d42786317148&prid=0&gclid=Cj0KCQiA0fr_BRDaARIsAABw4Eurc1ej9agq29QbsqXAF1hr9JU5kAscWFPGWdM53mjlFUHElKIvyDAaAoJ-EALw_wcB&currency=PLN&correlationId=d139d68f-2bd0-4a4a-9f1e-143ed71b1bb7&pageTypeId=103&realLanguageId=27&languageId=27&origin=PL&cid=1844104&userId=a3d46da8-532a-41d6-a2a2-d42786317148&whitelabelid=1&loginLvl=0&storefrontId=3&currencyId=23&currencyCode=PLN&htmlLanguage=pl-pl&cultureInfoName=pl-pl&machineName=am-crweb-4005&trafficGroupId=1&sessionId=vwjqd0y4rxujhr5luhjmg0gs&trafficSubGroupId=84&aid=130589&useFullPageLogin=true&cttp=4&isRealUser=true&checkIn=2021-01-22&checkOut=2021-01-26&rooms=1&adults=1&children=0&priceCur=PLN&los=4&textToSearch=Pary%C5%BC&travellerType=0&familyMode=off&hotelReviewScore=7",
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    };
}

export const TRIVAGO_ALL_INCUSIVE = ',1322/105:1,9/132:1,658/300:1,86/300:1,254/300:1,1324/106:1';
export const TRIVAGO_5_STAR_BEACH = ',1322/105:1,9/132:1,1527/106:1';
export const TRIVAGO_5_STAR = ',1322/105:1,2555/106:1';
export const TRIVAGO_LOW_COST = ',2555/106,2007/106,1527/106,1324/106';

export const TRIVAGO_GRAPHQL_URL = 'https://www.trivago.pl/graphql';
export const AGODA_GRAPHQL_URL_SEARCH = 'https://www.agoda.com/graphql/search';
export const getAgodaSuggestionsUrl = encodedCityName => `https://www.agoda.com/api/cronos/search/GetUnifiedSuggestResult/3/27/27/0/en-us?searchText=${encodedCityName}&guid=5860c32c-1afd-48aa-88ae-a125437eaba3&origin=PL&cid=1844104&pageTypeId=103&logtime=Wed%20Jan%2013%202021%2023%3A11%3A35%20GMT%2B0100%20(czas%20%C5%9Brodkowoeuropejski%20standardowy)&logTypeId=1&isHotelLandSearch=true`;