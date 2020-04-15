const Domain = require("./domain")
var RedisClient = require("./redis-client");
var redisClient = new RedisClient().getInstance();
const utils = require("./utils");

const {NodeClient,WalletClient} = require('hs-client');
const config = require("./config")
const nodeClient = new NodeClient(config.hsClientOptions);
const walletClient = new WalletClient(config.hsWalletOptions);

const wallet = walletClient.wallet("primary",config.hsWalletOptions.token);

async function setUnbidded(name) {
    redisClient.getDomain(name,function(domain){
        domain.bidded = 0;
        redisClient.setDomain(domain);
    });
}

async function checkAuctions() {
    const auctions = await wallet.getAuctions();
    let revealsAmount = 0;
    let bidAmount = 0;
    let bidList = [];
    let revealList = [];
    for(let auction of auctions) {
        let name = auction["name"];

        let isRevealed = false;
        for(let reveal of auction["reveals"]) {
            if(reveal["own"]) {
                let value = reveal["value"];
                // console.log(`${name} : ${value/1000000} revealed`);
                revealList.push(name.padStart(10) + " : " + value/1000000);
                revealsAmount += value;
                isRevealed = true;
                break;
            }
        }

        if(isRevealed) 
            continue;

        for(let bid of auction["bids"]) {
            if(bid["own"]) {
                let value = bid["lockup"];
                console.log(`${name} : ${value/1000000} bidded`);
                bidAmount += value;
                bidList.push(name.padStart(10) + " : " + value/1000000);
            }
        }
    }
    console.log("[ bid list ]");
    console.log(bidList.join("\n"));
    console.log("[reveal list]");
    console.log(revealList.join("\n"));
    const balance = await wallet.getBalance("default");
    console.log(`\nlockedConfirmed = ${balance["lockedConfirmed"]/1000000},bids = ${bidAmount/1000000}, reveals = ${revealsAmount/1000000}`)
}

async function clearPendingTxs() {
    const result = await wallet.getPending();
    console.log(`pendding amout: ${result.length}`);
    for(let tx of result) {
        console.log(`remove tx ${tx["hash"]}`);
        try {
            const result = await walletClient.execute('abandontransaction', [tx["hash"]]);
            console.log(result);
        }catch(err) {
            console.log(err);
        }
    }
}

async function getMempool() {
    const result = await nodeClient.execute('getrawmempool', [ 1 ]);
    for(let key in result) {
        const txdata = await nodeClient.getTX(key);
        console.log(txdata);
    }
    console.log(Object.keys(result).length);
}

async function getPending() {
    const result = await wallet.getPending();
    // console.log(JSON.stringify(result,0,4));
    console.log(result.length);
}

// setUnbidded("smartdevice");
// clearPendingTxs();
getPending();
checkAuctions();
// getMempool();
// setUnbidded("smartdevice");
