# SCSBRestClient

This is a light wrapper around SCSB's [RESTful interace](https://uat-recap.htcinc.com:9093/swagger-ui.html).

## Install

### With Github

```
"@nypl/scsb-rest-client": "git@github.com:NYPL/scsb-rest-client.git#BRANCH-OR-TAG-NAME"
```

### With NPM

```
"@nypl/scsb-rest-client": "VERSION"
```

## Usage

```javascript

const SCSBRestClient = require('@nypl/scsb-rest-client')

let myResponse = SCSBRestClient.getItemsAvailabilityForBarcodes(this.barcodes)
.then((itemsStatus) => {
  // do something with the response
})
.catch((error) => {
  // log this error and...
  return Promise.reject(error)
})
```
