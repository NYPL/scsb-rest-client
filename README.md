# SCSBRestClient

This is a light wrapper around SCSB's [RESTful interace](https://uat-recap.htcinc.com:9093/swagger-ui.html).

## Version
> 1.0.2

## Install

### With Github

```
"@nypl/scsb-rest-client": "git@github.com:NYPL/scsb-rest-client.git#BRANCH-OR-TAG-NAME"
```

### With NPM

```js
npm i @nypl/scsb-rest-client --save
```

## Usage

```javascript

const SCSBRestClient = require('@nypl/scsb-rest-client')

let scsbClient = new SCSBRestClient({ url: "http://theurl.example.com:theports", apiKey: "anAPIKEY" })

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
| `searchByParam(queryParams = {})`|[`/searchService/searchByParam`](https://uat-recap.htcinc.com:9093/swagger-ui.html#!/search-records-rest-controller/search)|
| `addRequestItem(data = {})`|[`/requestItem/requestItem`](https://uat-recap.htcinc.com:9093/swagger-ui.html#!/request-item-rest-controller/requestItem)|

## Git Workflow

When you _file_ a PR - it should include a version bump.  
When you _accept_ a PR - you should push a tag named "vTHEVERSION" (e.g. "v1.0.1")

## Changelog

### v1.0.2
#### Added
- Added new function `addRequestItem` to SCSBClient.
- Added unit tests via chai-as-promised to test new function `addRequestItem`.

#### Updated
- Updated ReadMe to reflect new version and added documentation for addRequestItem function.
