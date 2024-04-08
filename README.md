# SCSBRestClient

This is a light wrapper around SCSB's [RESTful interace](https://scsb.recaplib.org:9093/swagger-ui.html).

## Version
> 3.0.0

## Install

### With Github

```
"@nypl/scsb-rest-client": "https://github.com/NYPL/scsb-rest-client.git#BRANCH-OR-TAG-NAME"
```

### With NPM

```js
npm i @nypl/scsb-rest-client --save
```

## Usage

```javascript

const scsbClient = require('@nypl/scsb-rest-client')

scsbClient.config({
  url: "http://theurl.example.com:theports",
  apiKey: "anAPIKEY"
})

let myResponse = scsbClient.getItemsAvailabilityForBarcodes(this.barcodes)
.then((response) => {
  // do something with the response
})
.catch((error) => {
  // log this error and...
  return Promise.reject(error)
})
```

### Supported Endpoints

See [the SCSB swagger documentation](https://uat-recap.htcinc.com:9093/swagger-ui.html) for the authoritative documentation of each endpoint's params.

| Method     | Endpoint     |
| :------------- | :------------- |
| `getItemsAvailabilityForBarcodes(barcodes = [])`|[`/sharedCollection/itemAvailabilityStatus`](https://uat-recap.htcinc.com:9093/swagger-ui.html#!/shared-collection-rest-controller/itemAvailabilityStatus)|
| `requestItem(data = {})`                     |[`/requestItem/requestItem`](https://uat-recap.htcinc.com:9093/swagger-ui.html#!/request-item-rest-controller/requestItem)|
| `search(data = {})`                             |[`/searchService/search`](https://uat-recap.htcinc.com:9093/swagger-ui.html#!/search-records-rest-controller/search)|
| `searchByParam(queryParams = {})`               |`/searchService/searchByParam`(**deprecated**)|

## Contributing

 - Cut feature branch from `main`
 - After review, merge to `main`
 - Bump version in `package.json` & note changes in `CHANGELOG.md`
 - `git tag -a v[version]`
 - `npm publish`
