const Domain = require("../domain")
var RedisClient = require("../redis-client");
var redisClient = new RedisClient().getInstance();
const utils = require("../utils");

const {NodeClient,WalletClient} = require('hs-client');
const config = require("../config")
const nodeClient = new NodeClient(config.hsClientOptions);
const walletClient = new WalletClient(config.hsWalletOptions);

const wallet = walletClient.wallet("primary",config.hsWalletOptions.token);
const DOLLORUNIT = 1000000;

async function tickAutoBid() {
    // console.log(new Date(),"tick auto bid ...");

    let balance = await wallet.getBalance("default")["confirmed"] / DOLLORUNIT;

    const clientinfo = await nodeClient.getInfo();
    let blockheight = clientinfo["chain"]["height"];

    let autoBidNames = utils.getAutoBidNames();

    redisClient.getAllDomains(async function(domains) {
        for(let domain of domains) {
            let name = domain.name;

            if(domain.bidded) {
                // console.log(`[bid not satisfied] ${domain.name} bidded`);
                continue;
            }

            if( blockheight != domain.bidEndHeight() - 1) {
                // console.log(`[bid not satisfied] targetHeight=${domain.bidEndHeight() - 1},currentHeight=${blockheight}`);
                continue;
            }

            let limitAmount = 0;
            if(domain.name in autoBidNames) {
                limitAmount = autoBidNames[name];
            } else {
                let estimateValue = getEstimateValue(domain);
                if(estimateValue == 0) {
                    // console.log(`[bid not satisfied] ${domain.name} estimate value == 0`);
                    continue;
                }
                limitAmount = estimateValue;
            }

            let currentBidMax = Math.max(...domain.getBidsInfo());

            // test
            // if(currentBidMax > limitAmount) {
            //     console.log(`${name},${domain.height}, ${currentBidMax}>${limitAmount}`);
            // }
            // return;

            if(currentBidMax > limitAmount) {
                console.log(`[bid not satisfied] name: ${domain.name} current max: ${currentBidMax}, limit:${limitAmount}`);
                return;
            }
            // extra 10%
            let bidAmount = Math.floor(currentBidMax * 1.2);

            if(balance < bidAmount) {
                console.log(`[bid not satisfied] balance unsufficient！ current: ${balance}, target:${bidAmount}`);
                continue;
            }
            
            console.log(`bid ${name} at ${bidAmount} !`);
            bid(name,bidAmount);
            domain.bidded = 1;
            redisClient.setDomain(domain);

            balance -= bidAmount;

            await new Promise(resolve => setTimeout(resolve, 0.1*1000));
        }
    });
}

function getEstimateValue(domain) {
    let name = domain.name;
    if(name.length <= 3) {
        return 3000;
    }else if(name.length <= 4) {
        return 800;
    }else if(name.length <= 6 || domain.getBidsInfo().length >= 4) {
        return 300;
    }else if(name.length <= 8) {
        return 50;
    }
    return 0;
}

async function getBalance() {
    /**
     * {
        account: 0,
        tx: 65,
        coin: 61,
        unconfirmed: 60098477600,
        confirmed: 60099610600,
        lockedUnconfirmed: 6937100000,
        lockedConfirmed: 2621100000
        }
     */
    const result = await wallet.getBalance("default");
    console.log(result);
}

function getNames() {
    (async () => {
        const result = await wallet.getNames();
        console.log(result);
    })();
}

function getAuctions() {
    (async () => {
        const result = await wallet.getAuctions();
        console.log(JSON.stringify(result,0,4));
    })();
}

function getAuctionByName(name) {
    (async () => {
        const result = await wallet.getAuctionByName(name);
        console.log(result);
    })();
}

function bid(name,amount) {
    // const options = {id:'primary',"name":name,passphrase:config.hsWalletOptions.passphrase,broadcast:true,sign:true,bid:amount,lockup:amount};
    // console.log(options);
    (async () => {
        const result = await walletClient.execute('sendbid', [ name, amount, amount ]);
        // console.log(`bid ${name} successful ! ${result["hash"]}`);
        console.log(`bid ${name} successful ! ${result}`);
        // console.log(JSON.stringify(result,0,4));
    })();
}

function reveal(name) {
    const options = {passphrase:config.hsWalletOptions.passphrase, name:name, broadcast:true, sign:true};
    (async () => {
        const result = await wallet.createReveal(options);
        console.log(result);
    })();
}

function revealAll() {
    const options = {passphrase:config.hsWalletOptions.passphrase, broadcast:true, sign:true};
    (async () => {
        try {
            const result = await wallet.createReveal(options);
            console.log(result);
        }catch(err) {
            console.log("no bids to reveal");
            // console.log(err);
        }
        
    })();
}

function redeem(name) {
    const options = {passphrase:config.hsWalletOptions.passphrase, name:name, broadcast:true, sign:true};
    (async () => {
        const result = await wallet.createRedeem(options);
        console.log(result);
    })();
}

function redeemAll() {
    const options = {passphrase:config.hsWalletOptions.passphrase, broadcast:true, sign:true};
    (async () => {
        try {
            const result = await wallet.createRedeem(options);
            console.log(result);
        }catch(err) {
            console.log("no reveals to redeem");
            // console.log(err);
        }
    })();
}

async function getMempool() {
    const result = await nodeClient.execute('getrawmempool', [ 1 ]);
    for(let key in result) {
        const txdata = await nodeClient.getTX(tx);
        console.log(txdata);
    }
    console.log(Object.keys(result).length);
}

async function run() {
    while(true) {
        tickAutoBid();
        await new Promise(resolve => setTimeout(resolve, 60*1000));
    }
}

async function runRevealAndRedeem() {
    while(true) {
        revealAll();
        redeemAll();
        await new Promise(resolve => setTimeout(resolve, 24*1000*60*60));
    }
}

console.log(`start tickAutoBid`);
run();
runRevealAndRedeem();

// checkAuctions();

// getBalance();
// bid("glaad",15);
// getNames();
// getAuctions();
// reveal("refactor");
// getAuctionByName("bursts");
// revealAll();
// redeem("g-spot");
// redeemAll();
// getMempool();

// (async () => {
//     const result = await wallet.getTX("fc29b864a96b1fdd92a8d096b46e53f2276b13038a355168c5a7610623c9922e");
//     console.log(result);
// })();

// (async () => {
//     const result = await walletClient.getWallets();
//     console.log(result);
// })();

// (async () => {
//     const result = await wallet.getAccounts();
//     console.log(result);
// })();