const {Domain,Block} = require("./domain")
var RedisClient = require("./redis-client");
var redisClient = new RedisClient().getInstance();

const {NodeClient,WalletClient} = require('hs-client');
const config = require("./config")
const nodeClient = new NodeClient(config.hsClientOptions);


async function runOpenAndBid() {
    redisClient.getAllDomains(async function(res) {

        // {"1":{"open":1,"bid":2,"names":[]}}
        let result = {};

        for(let domain of res) {
            if(Object.keys(domain.openInfo).length != 0) {
                if(!(domain["openInfo"]["height"] in result))
                    result[domain["openInfo"]["height"]] = {"open":0,"bid":0,"names":[]};

                result[domain["openInfo"]["height"]]["open"] ++;

                // result[domain["openInfo"]["height"]]["names"].push(domain.name);
            }

            for(let bidInfo of domain.bidsInfo) {
                if(!(bidInfo["height"] in result)) {
                    result[bidInfo["height"]] = {"open":0,"bid":0,"names":[]};
                }

                result[bidInfo["height"]]["bid"] ++;
            }
        }

        // console.log(result);

        for(let height in result) {
            if(result[height]["open"] > 50 || result[height]["bid"] > 100) {
                console.log(height,result[height]);
            }
        }
    });
    

    redisClient.quit();
}

async function test() {
    
    redisClient.quit();
}

function runDomain() {
    redisClient.getDomain("zfb",function(res){
        console.log(res.bidsInfo);
    });

    redisClient.quit();
}

// run();
// runDomain();
runOpenAndBid();


