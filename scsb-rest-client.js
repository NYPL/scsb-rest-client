/**
 *  @typedef {object} ClientOptions
 *  @property {string} url - The SCSB API base URL
 *  @property {string} apiKey - The SCSB API API key
 *  @property {number} concurrency - The number of concurrent SCSB API queries to allow. Default 10
 */
let options = {
  url: null,
  apiKey: null,
  concurrency: 10
}

/*
 *
 *  Apply configuration options to client
 *
 *  @param {Options} options - Object containing one or more options to apply
 */
function config (_options) {
  options = Object.assign(options, _options)
}

/**
 *  Perform a search against the SCSB API
 *
 *  @param {object} query - An object containing, for example `"fieldName": "Barcode", "fieldValue": "some-barcode"`
 */
function search (query) {
  return scsbQuery('/searchService/search', query)
}

/**
 *  Get an item availability report for the specified barcodes
 *  See https://uat-recap.htcinc.com:9093/swagger-ui.html#/shared-collection-rest-controller/itemAvailabilityStatus
 *
 *  @param {array<string>} barcodes - An array of barcodes
 */
function getItemsAvailabilityForBarcodes (barcodes) {
  return scsbQuery('/sharedCollection/itemAvailabilityStatus', { barcodes })
}

/**
 *  Request an item through the SCSB API
 *  See https://uat-recap.htcinc.com:9093/swagger-ui.html#/request-item-rest-controller/requestItem
 *
 *  @param {object} data - An object containing patronBarcode, itemBarcodes, etc.
 */
function requestItem (data) {
  return scsbQuery('/requestItem/requestItem', data)
}

/**
 *  Perform arbitrary SCSB API query
 *
 *  @param {string} path - Root relative request path (e.g. /searchService/search)
 *  @param {object} query - Object with endpoint-specific properties to POST to SCSB API
 */
async function scsbQuery (path, query) {
  if (!path || typeof path !== 'string') return Promise.reject(new Error('SCSB API path missing or invalid'))
  if (!query || typeof query !== 'object' || !Object.keys(query).length) {
    return Promise.reject(new Error('SCSB API query is empty; could not initialize POST request'))
  }
  _checkConfig()

  const params = {
    method: 'post',
    body: JSON.stringify(query),
    headers: _headers()
  }

  try {
    const response = await fetch(options.url + path, params)
    if (response.status !== 200) {
      throw new Error(`Received status ${response.status} requesting ${path} ${params}`)
    }
    const json = await response.json()
    return json
  } catch (e) {
    throw new Error(`Error hitting SCSB API ${e}`)
  }
}

/**
 * Check that necessary config has been set (i.e. through client.config({ ... })
 */
function _checkConfig () {
  if (!options.url || !options.apiKey) {
    throw new Error('SCSBRestClient must be configured with a url and apiKey')
  }
}

/**
 * Get headers to send in every request
 */
function _headers () {
  return {
    Accept: 'application/json',
    api_key: options.apiKey,
    'Content-Type': 'application/json'
  }
}

module.exports = {
  config,
  search,
  getItemsAvailabilityForBarcodes,
  requestItem,
  scsbQuery,
  _checkConfig,
  _headers
}
