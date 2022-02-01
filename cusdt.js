const splitSymbol = require('dvf-utils/lib/splitSymbol');
const request = require('request-promise')

const { startMarketMaker } = require('./marketMaker');

// Starts maket-making with 1:1
startMarketMaker(getCoingeckoPrice)

// Forces known mainnet addresses
// Useful when running on dev and stg
const envContractAddressesOverride = {
  CUSDT: '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9'
}

let config, quote, base
async function getCoingeckoPrice (dvf, pair) {
  [quote, base] = splitSymbol(pair)
  let tokenContractAddress = envContractAddressesOverride[quote]
  
  if (!tokenContractAddress) {
    if (!config) {
      config = await dvf.getConfig()
    }
  
    tokenContractAddress = config.tokenRegistry[quote].tokenAddress
  }

  const apiResponse = await request.get({
       url: `https://api.compound.finance/api/v2/ctoken?addresses[]=${tokenContractAddress}`,
       json: true
  })

  return parseFloat(apiResponse.cToken[0].exchange_rate.value).toPrecision(4)
}
