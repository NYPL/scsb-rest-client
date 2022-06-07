/**
 *  Usage:
 *
 *  Assumes you have a .env with the following exported vars:
 *   SCSB_API_URL=https://[fqdn]:PORT
 *   SCSB_API_KEY=[secret]
 *
 *  source .env; node ./test-with-env-creds
 */
const client = require('@nypl/scsb-rest-client')
client.config({
  apiKey: process.env.SCSB_API_KEY,
  url: process.env.SCSB_API_URL
})

const run = async () => {
  try {
    const availability = await client.getItemsAvailabilityForBarcodes(['123'])
    console.log('Got item availability:', availability)
  } catch (e) {
    console.log(e.message)
  }
}

run()
