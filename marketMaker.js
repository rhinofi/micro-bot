const DVF = require('./dvf')
const _ = require('lodash')
const { splitSymbol, prepareAmount, preparePrice } = require('dvf-utils')

const configFileName = process.env.CONFIG || './config'

const { PAIR, STARK_KEY, ALCHEMY_URL } = require(configFileName)

let dvf

let lastMidPrice

let tokenQuote
let tokenBase

let pair, routeBuy, routeSell, buySide, sellSide, midPrice
async function marketMake (priceFeed) {
  periodicReplace(priceFeed)
  setInterval(() => periodicReplace(priceFeed), 600000)
}

async function periodicReplace(priceFeed) {
  try {
    midPrice = await priceFeed(dvf, PAIR)
    console.log(midPrice)
  } catch (e) {
    console.error('Price fetch error, using previous price', e)
  }
  const haveOpenOrders = await checkIfOpenOrders()
  if (midPrice !== lastMidPrice || !haveOpenOrders) {
    lastMidPrice = midPrice
    replaceOrders()
  }
}

async function startMarketMaker (priceFeed) {
  dvf = await DVF()
  await syncBalances()
  console.log('Starting balances: ', balanceA, balanceB)
  marketMake(priceFeed)
}

// Trading Functions

let balanceA
let balanceB

async function cancelOpenOrders () {
  const orders = await dvf.getOrders()
  orders.forEach(o => {
    if (o.symbol != PAIR) return
    dvf.cancelOrder(o._id)
  })
}

async function checkIfOpenOrders () {
  const orders = await dvf.getOrders()
  return orders.length > 0
}

async function syncBalances () {
  const apiReturnedBalances = await dvf.getBalance()
  const balances = _.chain(apiReturnedBalances)
    .keyBy('token')
    .mapValues('available')
    .value()
  const [quote, base] = splitSymbol(PAIR)
  console.log('balances', balances)
  balanceA = dvf.token.fromQuantizedAmount(quote, balances[quote])
  balanceB = dvf.token.fromQuantizedAmount(base, balances[base])
  balanceA = balanceA === 'NaN' ? 0 : balanceA
  balanceB = balanceB === 'NaN' ? 0 : balanceB
}

async function replaceOrders () {
  cancelOpenOrders()
  await syncBalances()
  const balanceToSell = Math.min(0.9 * balanceA, 75000 / lastMidPrice)
  placeOrder(-1 * balanceToSell)
  const balanceToBuy = Math.min(0.9 * balanceB, 100000) / lastMidPrice
  placeOrder(balanceToBuy)
}

async function placeOrder (amount) {
  amount = 100 * Math.trunc(prepareAmount(amount, 0) / 100)
  if (amount == 0) return

  const [quote, base] = splitSymbol(PAIR)
  let price
  if (amount > 0) {
    price = preparePrice(lastMidPrice * 0.999)
    console.log('Place buy at:', price)
  } else {
    price = preparePrice(lastMidPrice * 1.001)
    console.log('Place sell at:', price)
  }
  if (!price) return

  console.log(amount, price)

  try {
    await dvf.submitOrder({
      symbol: PAIR,
      amount,
      price,
      starkPrivateKey: STARK_KEY
    })
  } catch (e) {
    // console.log('error e', e)
    const error = (e.error && e.error.details && e.error.details.error) || {}
    console.warn(`Trade not completed: ${error.error}`)
  }
}

module.exports = {
  startMarketMaker
}
