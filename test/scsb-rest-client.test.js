/* eslint-env mocha */

const nock = require('nock')
const chai = require('chai')
const expect = chai.expect
const chaiAsPromised = require('chai-as-promised')
chai.should()
chai.use(chaiAsPromised)

describe('SCSBRestClient', function () {
  let client
  const scsbBaseUrl = 'https://example.com'

  beforeEach(() => {
    delete require.cache[require.resolve('../scsb-rest-client')]
    client = require('../scsb-rest-client')
  })

  describe('_checkConfig', () => {
    it('should throw an exception if not configured', function () {
      expect(() => client.scsbQuery('/path', { param1: 'value' })).to.throw(Error, 'SCSBRestClient must be configured with a url and apiKey')
    })

    it('should throw an exception if configured without an API Key', function () {
      client.config({ url: 'https://example.com' })

      expect(() => client.scsbQuery('/path', { param1: 'value' })).to.throw(Error, 'SCSBRestClient must be configured with a url and apiKey')
    })

    it('should throw an exception if configured without a URL', function () {
      client.config({ apiKey: 'abc123' })

      expect(() => client.scsbQuery('/path', { param1: 'value' })).to.throw(Error, 'SCSBRestClient must be configured with a url and apiKey')
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
      const scope = nock(scsbBaseUrl, {
        reqheaders: {
          api_key: 'abc123'
        }
      })
        .post('/path')
        .reply(200, { someKey: 'value' })

      return client.scsbQuery('/path', { param1: 'value' })
        .then((resp) => {
          expect(resp.someKey).to.eq('value')

          scope.done()
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
      const nockScope = nock(scsbBaseUrl)
        .post('/searchService/search')
        .delay(100)
        .times(numberOfCalls)
        .reply(200, (uri, requestBody) => {
          // Call received, so increment activeCalls
          activeCalls += 1
          return { responseFor: requestBody }
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
          expect(activeCalls).is.lessThan(concurrency)
        })
      )

      nockScope.done()
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
      nock(scsbBaseUrl)
        .post('/requestItem/requestItem')
        .reply(200, scsbRequestItemSuccess)

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
      // Emulate receiving an error response from SCSB:
      nock(scsbBaseUrl)
        .post('/requestItem/requestItem')
        .reply(200, scsbRequestItemFailure)

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
      nock(scsbBaseUrl)
        .post('/sharedCollection/itemAvailabilityStatus', { barcodes: ['33433118106339'] })
        .reply(200, scsbItemAvailabilityResponseSuccess)

      const itemAvailability = client.getItemsAvailabilityForBarcodes(['33433118106339'])

      return itemAvailability.should.be.fulfilled
    })

    it('should handle a faied lookup', () => {
      nock(scsbBaseUrl)
        .post('/sharedCollection/itemAvailabilityStatus', { barcodes: ['33433118106339'] })
        .reply(200, scsbItemAvailabilityResponseFailure)

      const itemAvailability = client.getItemsAvailabilityForBarcodes(['33433118106339'])

      return itemAvailability.should.be.fulfilled
    })
  })
})
