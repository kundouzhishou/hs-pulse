const Domain = require("../domain")
var RedisClient = require("../redis-client");
var redisClient = new RedisClient().getInstance();

const {NodeClient,WalletClient} = require('hs-client');
const config = require("../config")
const nodeClient = new NodeClient(config.hsClientOptions);
const walletClient = new WalletClient(config.hsWalletOptions);

const wallet = walletClient.wallet("primary",config.hsWalletOptions.token);
const DOLLORUNIT = 1000000;

async function tickAutoBid() {
    const clientinfo = await nodeClient.getInfo();
    let blockheight = clientinfo["chain"]["height"];
    const RANGE_BLOCK_LEFT = 6;
    // console.log("current height:",blockheight);
    redisClient.getAllDomains(async function(res) {
        let targetDomains = [];
        for(let domain of res) {
            if(domain.bidEndHeight() - blockheight >= 0 && domain.bidEndHeight() - blockheight < RANGE_BLOCK_LEFT) {
                targetDomains.push(domain);
            }
        }

        for(let targetDomain of targetDomains) {
            if(targetDomain.name == "w_w") {
                console.log(targetDomain);
            }
        }
    });
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
    if(amount < DOLLORUNIT) {
        amount = amount * DOLLORUNIT;
    }
    const options = {id:'primary',"name":name,passphrase:config.hsWalletOptions.passphrase,broadcast:true,sign:true,bid:amount,lockup:amount};
    (async () => {
        const result = await wallet.createBid(options);
        console.log(result);
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
            console.log(err);
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
            console.log(err);
        }
    })();
}

function run() {
    // bid("zfb",0.01*1000000);
    // getNames();
    getAuctions();
    // reveal("g-spot");
    // getAuctionByName("labs");
    // revealAll();
    // redeem("g-spot");
    // redeemAll();

    // while(true) {
    //     tickAutoBid();
    //     await new Promise(resolve => setTimeout(resolve, 10*1000));
    // }

    redisClient.quit();
}


console.log(new Date(),"start auction service ...");
// tickAutoBid();
run();