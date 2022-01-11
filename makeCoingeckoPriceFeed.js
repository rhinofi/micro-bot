const request = require('request-promise')

module.exports = coingeckoTokenId => async () => {
  const apiResponse = await request.get({
       url: `https://api.coingecko.com/api/v3/coins/${coingeckoTokenId}`,
       json: true
  })

  return parseFloat(apiResponse.market_data.current_price.usd).toPrecision(4)
}
