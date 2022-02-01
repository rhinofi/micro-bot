const makeCoingeckoPriceFeed = require('./makeCoingeckoPriceFeed');
const { startMarketMaker } = require('./marketMaker');

// Starts maket-making following Coingecko price
startMarketMaker(makeCoingeckoPriceFeed('anchorust'))
