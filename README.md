# Micro-Bot: An event driven market-making bot

A tiny Node.js event-driven bot for [DeversiFi](deversifi.com). This bot aims to simply keep orders at the best bid and best ask on any specified market, in order to profit from the spread.

This bot allows high speed-trading on a completely non-custodial exchange.

### Steps to use:

1. Create a new Ethereum account and fund with ETH
2. `git clone https://github.com/DeversiFi/micro-bot.git`
2. Copy `config.example.js` => `config.js`
3. Get an Infura or Alchemy URL and enter use it to populate the config file: [here](https://github.com/DeversiFi/micro-bot/blob/main/config.example.js#L6)
4. Enter your Ethereum private key here (prefixed with 0x): [here](https://github.com/DeversiFi/micro-bot/blob/main/config.example.js#L3)
5. Choose the market pair you want to trade and update it [here](https://github.com/DeversiFi/micro-bot/blob/main/config.example.js#L5)

Once the above setup is complete, you can use the following instructions:

`npm install`

`node setup` - registers and deposits your ETH to the exchange

`node index` - starts the bot!


### Other information:

This bot relies on order-book update events from the Bitfinex websocket, and triggers trades each time the midprice on a market changes.

Please fork and use!
