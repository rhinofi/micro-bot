const BFX = require('bitfinex-api-node')
const dvfClient = require('./dvfClient')
const _ = require('lodash')
const { dvfToBfxSymbol, splitSymbol, prepareAmount, BN } = require('dvf-utils')
const { BFX_WS, PAIR, PRIVATE_KEY } = require('./config')

let dvf

const bfx = new BFX({
  ws: {
    autoReconnect: true,
    seqAudit: false,
    packetWDDelay: 10 * 1000,
    manageOrderBooks: true,
    transform: true,
    url: BFX_WS
  }
})

const marketPair = dvfToBfxSymbol(PAIR)

const ws = bfx.ws()

ws.on('error', (err) => console.log(err))
ws.on('open', () => {
  console.log('open')
  ws.subscribeOrderBook(marketPair)
})

let lastOrderRefresh = Date.now()
let lastBidPrice = -1
let lastAskPrice = -1
let lastMidPrice = -1

ws.onOrderBook({ symbol: marketPair }, (ob) => {
  if (Date.now() < lastOrderRefresh + 60000) return

  const midPrice = ob.midPrice()
  if (midPrice !== lastMidPrice) {
    lastOrderRefresh = Date.now()
    lastMidPrice = midPrice
    lastBidPrice = ob.bids[0][0]
    lastAskPrice = ob.asks[0][0]
    replaceOrders()
  }
})

onStartUp()

async function onStartUp () {
  dvf = await dvfClient()
  await cancelOpenOrders()
  await syncBalances()
console.log('Starting balances: ', balanceA, balanceB)
}

ws.open()

// Trading Functions

let balanceA
let balanceB

async function cancelOpenOrders () {
  const orders = await dvf.getOrders()
  orders.forEach(o => {
    dvf.cancelOrder(o._id)
  })
}

async function syncBalances () {
  const balances = _.chain(await dvf.getBalance())
    .keyBy('token')
    .mapValues('available')
    .value()
  const [quote, base] = splitSymbol(PAIR)
  balanceA = dvf.token.fromQuantizedAmount(quote, balances[quote])
  balanceB = dvf.token.fromQuantizedAmount(base, balances[base])
}

async function replaceOrders () {
  console.log(`buy at ${lastBidPrice}`, `sell at ${lastAskPrice}`)
  cancelOpenOrders()
  syncBalances()
  placeOrder(-balanceA / 10, )
  placeOrder(balanceB / (lastMidPrice * 10) )
}

async function placeOrder (amount) {
  amount = prepareAmount(amount, 3)

  if (amount === '0') return
  const price = amount > 0 ? lastBidPrice : lastAskPrice
  if (!price) return

  try {
    await dvf.submitOrder({
      symbol: PAIR,
      amount,
      price,
      starkPrivateKey: PRIVATE_KEY.substring(2)
    })
  } catch (e) {
    const error = (e.error && e.error.details && e.error.details.error) || {}
    console.warn(`Trade not completed: ${error.error}`)
  }
}
