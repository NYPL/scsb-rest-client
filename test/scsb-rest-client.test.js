/* eslint-env mocha */

// const nock = require('nock')
const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
const rewire = require('rewire')
chai.should()
chai.use(chaiAsPromised)

function delay (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

describe('SCSBRestClient', function () {
  let client
  const scsbBaseUrl = 'https://example.com'

  beforeEach(() => {
    delete require.cache[require.resolve('../scsb-rest-client')]
    client = rewire('../scsb-rest-client')
  })

  describe('_checkConfig', async () => {
    it('should throw an exception if not configured', async function () {
      await expect(client.scsbQuery('/path', { param1: 'value' })).to.be.rejectedWith(Error, 'SCSBRestClient must be configured with a url and apiKey')
    })

    it('should throw an exception if configured without an API Key', async function () {
      client.config({ url: 'https://example.com' })

      await expect(client.scsbQuery('/path', { param1: 'value' })).to.be.rejectedWith(Error, 'SCSBRestClient must be configured with a url and apiKey')
    })

    it('should throw an exception if configured without a URL', async function () {
      client.config({ apiKey: 'abc123' })

      await expect(client.scsbQuery('/path', { param1: 'value' })).to.be.rejectedWith(Error, 'SCSBRestClient must be configured with a url and apiKey')
    })
  })

  describe('scsbQuery', () => {
    beforeEach(() => {
      client.config({ apiKey: 'abc123', url: scsbBaseUrl })
    })

    it('should reject if the path parameter is invalid', () => {
      const call = client.scsbQuery()
      return call.should.be.rejectedWith('SCSB API path missing or invalid')
    })

    it('should reject if the data parameter is NULL', () => {
      const call = client.scsbQuery('/path', null)
      return call.should.be.rejectedWith('SCSB API query is empty; could not initialize POST request')
    })

    it('should reject if the data parameter is UNDEFINED', () => {
      const call = client.scsbQuery('/path', undefined)
      return call.should.be.rejectedWith('SCSB API query is empty; could not initialize POST request')
    })

    it('should reject if the data parameter is an EMPTY Object', () => {
      const call = client.scsbQuery('/path', {})
      return call.should.be.rejectedWith('SCSB API query is empty; could not initialize POST request')
    })

    it('should send auth header to SCSB API', () => {
      client.__set__('fetch', (path, params) => {
        if (path === scsbBaseUrl + '/path' && params.headers.api_key === 'abc123') {
          return { status: 200, json: () => { return { someKey: 'value' } } }
        }
      })

      return client.scsbQuery('/path', { param1: 'value' })
        .then((resp) => {
          expect(resp.someKey).to.eq('value')
        })
    })
  })

  describe('concurrency', () => {
    beforeEach(() => {
      client.config({ apiKey: 'abc123', url: scsbBaseUrl })
    })

    it('should enforce configured concurrency', async () => {
      const numberOfCalls = 20
      const concurrency = 3

      client.config({ concurrency })

      let activeCalls = 0

      client.__set__('fetch', async (path, params) => {
        if (path === scsbBaseUrl + '/searchService/search') {
          activeCalls += 1
          await delay(100)
          return { status: 200, json: () => { return { responseFor: JSON.parse(params.body) } } }
        }
      })

      const numberRange = [...Array(numberOfCalls).keys()]
      await Promise.all(
        numberRange.map(async (num) => {
          const resp = await client.search({ queryNumber: num })

          // Expect response to agree with request:
          expect(resp).to.deep.equal({ responseFor: { queryNumber: num } })

          // Response received so decrement calls:
          activeCalls -= 1
          // Throughout the batch, activeCalls should never rise above
          // configured concurrency:
          expect(activeCalls).is.lessThan(concurrency + 1)
        })
      )
    })
  })

  describe('requestItem', () => {
    const scsbRequestItemSuccess = {
      patronBarcode: '01234567891011',
      itemBarcodes: [
        '33433001932379'
      ],
      requestType: 'RETRIEVAL',
      deliveryLocation: 'NH',
      requestingInstitution: 'NYPL',
      bibliographicId: null,
      expirationDate: null,
      screenMessage: 'Message received, your request will be processed',
      success: true,
      emailAddress: '',
      titleIdentifier: null
    }

    const scsbRequestItemFailure = Object.assign(
      {},
      scsbRequestItemSuccess,
      { success: false, screenMessage: 'Item not available for request.' }
    )

    beforeEach(() => {
      client.config({ apiKey: 'abc123', url: scsbBaseUrl })
    })

    it('should handle a success', () => {
      client.__set__('fetch', (path, params) => {
        if (path === scsbBaseUrl + '/requestItem/requestItem') {
          return { status: 200, json: () => { return scsbRequestItemSuccess } }
        }
      })

      const dummyObject = {
        patronBarcode: '234567890987654',
        itemBarcodes: ['32101058075084'],
        requestType: 'RETRIEVAL',
        deliveryLocation: 'NH'
      }
      const requestItemPromise = client.requestItem(dummyObject)

      return requestItemPromise.should.be.fulfilled.and.should.eventually.include({
        success: true,
        requestType: 'RETRIEVAL',
        screenMessage: 'Message received, your request will be processed'
      })
    })

    it('should handle a failure', () => {
      client.__set__('fetch', (path, params) => {
        if (path === scsbBaseUrl + '/requestItem/requestItem') {
          return { status: 200, json: () => { return scsbRequestItemFailure } }
        }
      })

      const dummyObject = {
        patronBarcode: '234567890987654',
        itemBarcodes: ['32101058075084'],
        requestType: 'RETRIEVAL',
        deliveryLocation: 'NH'
      }
      const requestItemPromise = client.requestItem(dummyObject)

      return requestItemPromise.should.be.fulfilled.and.should.eventually.include({
        success: false,
        requestType: 'RETRIEVAL',
        screenMessage: 'Item not available for request.'
      })
    })
  })

  describe('getItemsAvailabilityForBarcodes', () => {
    const scsbItemAvailabilityResponseSuccess = [
      {
        itemBarcode: '33433118106339',
        itemAvailabilityStatus: 'Available',
        errorMessage: null
      }
    ]
    const scsbItemAvailabilityResponseFailure = [
      {
        itemBarcode: '33433118106339',
        itemAvailabilityStatus: 'Item Barcode doesn\'t exist in SCSB database.',
        errorMessage: null
      }
    ]

    beforeEach(() => {
      client.config({ apiKey: 'abc123', url: scsbBaseUrl })
    })

    it('should handle a success', () => {
      client.__set__('fetch', (path, params) => {
        const body = JSON.parse(params.body)
        if (path === scsbBaseUrl + '/sharedCollection/itemAvailabilityStatus' && body.barcodes[0] === '33433118106339') {
          return { status: 200, json: () => { return scsbItemAvailabilityResponseSuccess } }
        }
      })

      const itemAvailability = client.getItemsAvailabilityForBarcodes(['33433118106339'])

      return itemAvailability.should.be.fulfilled
    })

    it('should handle a faied lookup', () => {
      client.__set__('fetch', (path, params) => {
        const body = JSON.parse(params.body)
        if (path === scsbBaseUrl + '/sharedCollection/itemAvailabilityStatus' && body.barcodes[0] === '33433118106339') {
          return { status: 200, json: () => { return scsbItemAvailabilityResponseFailure } }
        }
      })

      const itemAvailability = client.getItemsAvailabilityForBarcodes(['33433118106339'])

      return itemAvailability.should.be.fulfilled
    })
  })
})
