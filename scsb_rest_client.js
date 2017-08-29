const request = require('request')

// myClient = new SCSBRestClient({url: "foo", apiKey: "bar"})
class SCSBRestClient {
  constructor ({url = null, apiKey = null}) {
    this.url = url
    this.apiKey = apiKey

    if (this.url === null || this.apiKey === null) {
      throw new Error('SCSBRestClient must be instaniated with a url and apiKey')
    }
  }

  // searchOptions is a simple object.
  // It's keys and values map to the params in /searchService/search
  search (searchOptions = {}) {
    return new Promise((resolve, reject) => {
      const options = {
        url: `${this.url}/searchService/search`,
        body: JSON.stringify(searchOptions),
        headers: this._headers()
      }

      request.post(options, (error, response, body) => {
        if (error) {
          console.log(error)
          reject(error)
        } else if (response && response.statusCode === 200) {
          resolve(JSON.parse(body))
        } else {
          reject(new Error(`Error hitting SCSB API ${response.statusCode}: ${response.body}`))
        }
      })
    })
  }

  // queryParams is a simple object.
  // It's keys and values map to the params in /searchService/searchByParam
  searchByParam (queryParams = {}) {
    console.log('searchByParam has been deprecated. Use \'search\'.')
    return new Promise((resolve, reject) => {
      const options = {
        url: `${this.url}/searchService/searchByParam`,
        qs: queryParams,
        headers: this._headers()
      }

      request.get(options, (error, response, body) => {
        if (error) {
          reject(error)
        } else if (response && response.statusCode === 200) {
          resolve(JSON.parse(body))
        } else {
          reject(new Error(`Error hitting SCSB API ${response.statusCode}: ${response.body}`))
        }
      })
    })
  }

  // barcodes is an Array of barcodes
  getItemsAvailabilityForBarcodes (barcodes = []) {
    return new Promise((resolve, reject) => {
      var bodyToSend = {}
      bodyToSend = {barcodes: barcodes}
      var options = {
        url: this.url + '/sharedCollection/itemAvailabilityStatus',
        headers: this._headers(),
        body: JSON.stringify(bodyToSend)
      }
      request.post(options, (error, response, body) => {
        if (error) {
          reject(error)
        } else if (response && response.statusCode === 200) {
          resolve(JSON.parse(body))
        } else {
          reject(new Error(`Error hitting SCSB API ${response.statusCode}: ${response.body}`))
        }
      })
    })
  }

  addRequestItem (data) {
    if (!data || !Object.keys(data).length) {
      return Promise.reject(
        new Error('the data parameter is empty or undefined; could not initialize POST request')
      )
    }

    return new Promise((resolve, reject) => {
      const options = {
        url: `${this.url}/requestItem/requestItem`,
        headers: this._headers(),
        body: JSON.stringify(data)
      }

      request.post(options, (error, response, body) => {
        if (error) {
          reject(error)
        }

        if (response) {
          if (response.statusCode === 200) {
            resolve(JSON.parse(body))
          } else {
            const errorResponse = {
              errorMessage: 'An error occurred while sending the POST request to the SCSB API'
            }

            if (response.statusCode) {
              errorResponse.statusCode = response.statusCode
            }

            if (response.body) {
              errorResponse.debugInfo = response.body
            }

            reject(errorResponse)
          }
        }
      })
    })
  }

  _headers () {
    return {
      'Accept': 'application/json',
      'api_key': this.apiKey,
      'Content-Type': 'application/json'
    }
  }
}

module.exports = SCSBRestClient
