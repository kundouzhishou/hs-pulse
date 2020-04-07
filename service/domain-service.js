var assert = require('assert');

const numeral = require('numeral');
const util = require("util")
const request = require("sync-request")

const {google} = require('googleapis');
const customsearch = google.customsearch('v1');

const {Domain,Block} = require("../domain")
var RedisClient = require("../redis-client");
var redisClient = new RedisClient().getInstance();

const {NodeClient,} = require('hs-client');
const config = require("../config")
const nodeClient = new NodeClient(config.hsClientOptions);

async function tickTranslateAndGoogle() {
    const clientinfo = await nodeClient.getInfo();
    let blockheight = clientinfo["chain"]["height"];
    // console.log("current height:",blockheight);
    redisClient.getAllDomains(async function(res) {
        let targetDomain = null;
        for(let domain of res) {
            if(domain.bidEndHeight() <= blockheight) {
                continue;
            }

            if(domain.translate != "" || (domain.score != 0 && domain.score != "")) {
                continue;
            }

            if(targetDomain == null || targetDomain.height > domain.height) {
                targetDomain = domain;
            }
        }

        if(targetDomain) {
            // console.log("target domain:",JSON.stringify(targetDomain));

            // google search name
            const res = await customsearch.cse.list({
                cx: config.googleOptions.cx,
                q: targetDomain.name,
                auth: config.googleOptions.auth,
            });
            let totalResults = res.data.searchInformation.totalResults;
            let formatedResult = numeral(totalResults).format('0,0');
            // console.log("google search:",targetDomain.name,formatedResult);
            targetDomain.score = formatedResult;

            // translate name
            targetDomain.translate = googleTranslate(targetDomain.name);
            console.log("update domain",JSON.stringify(targetDomain));
            redisClient.setDomain(targetDomain);
        }
    });
}

async function tickBlockScan() {
    const clientinfo = await nodeClient.getInfo();
    let blockheight = clientinfo["chain"]["height"];

    redisClient.getBlocks(async function(res) {
        for(let i = 1; i <= blockheight; i++) {
            let isExist = false;
            for(let block of res) {
                if(block.height == i) {
                    isExist = true;
                    break;
                }
            }
            if(!isExist) {
                const result = await nodeClient.execute('getblockbyheight', [ i, 1, 0 ]);
                let txData = {};
                for(let txId of result["tx"]) {
                    const result = await nodeClient.getTX(txId);
                    // console.log(JSON.stringify(result,0,4));
                    txData[txId] = result;
                }
                let block = new Block(i,txData);
                redisClient.setBlock(block);

                updateDomainsFromBlock(block);

                await new Promise(resolve => setTimeout(resolve, 0.1*1000));
            }
        }
    });
}

async function updateDomainsFromBlock(block) {
    for(let txId in block.txData) {
        let txData = block.txData[txId];
        let outputs = txData["outputs"];
        for(let i = 0; i < outputs.length; i++) {
            let output = outputs[i];
            let covenant = output["covenant"];
            let txType = covenant["type"];
            let items = covenant["items"];
            let value = output["value"];
            let address = output["address"];
            if(txType == 2) {
                // name hash, zero height, and name
                let name = await nodeClient.execute('getnamebyhash', [items[0]]);
                // console.log("name is :",name,block.height);
                // console.log(JSON.stringify(outputs,0,4));
                redisClient.existsDomain(name, function(res) {
                    if(!res) {
                        // console.log("set name",name,block.height);
                        let domain = new Domain(name,block.height);
                        domain.openInfo = {"height":block.height,"address":address};
                        redisClient.setDomain(domain);
                    }else {
                        // console.log(`domain exists: ${name}`);
                        redisClient.getDomain(name,function(domain){
                            // if open info not exist then update
                            if(Object.keys(domain.openInfo).length == 0) {
                                domain.openInfo = {"height":block.height,"address":address};
                                console.log("update open info:",openInfo);
                                redisClient.setDomain(domain);
                            }
                        });
                    }
                });
            }else if(txType == 3) {
                // name hash, name, height, and hash
                let name = await nodeClient.execute('getnamebyhash', [items[0]]);
                redisClient.getDomain(name,function(domain){
                    assert(domain != "undefined", "domain not exist");

                    let hash = items[3];
                    if(!domain.bidHashExist(hash)) {
                        let bidInfo = {"address":address,"value":value,"height":block.height,"hash":hash};
                        domain.bidsInfo.push(bidInfo);
                        console.log("update bid info:",bidInfo);
                        redisClient.setDomain(domain);
                    }
                });
            }
        }
    }
}

async function googleTranslate(name) {
    const url = "https://translation.googleapis.com/language/translate/v2/?q=%s&source=en&target=zh&key=%s";
    var reqRes = request('GET',util.format(url,name,config.googleOptions.auth));
    let translateName = name;
    if(!reqRes.isError() && reqRes.statusCode == 200) {
        obj = JSON.parse(reqRes.getBody());
        try {
            // console.log(JSON.stringify(obj,0,4));
            translateName = obj["data"]["translations"][0]["translatedText"];
            // console.log("translate successful",name,translateName);
        }catch(err) {
            console.log(err);
            // console.log("translate failed-1",reqRes.getBody());
        }
    }else {
        console.log("translate failed-2",reqRes.getBody());
    }
    return translateName;
}

async function runTranslateAndGoogle() {
    while(true) {
        tickTranslateAndGoogle();
        await new Promise(resolve => setTimeout(resolve, 2*1000));
    }
}

async function runBlockScan() {
    while(true) {
        tickBlockScan();
        await new Promise(resolve => setTimeout(resolve, 2*1000*60));
    }
}

async function test() {
    for(let i = 2220; i < 2250; i++) {
        redisClient.getBlockByHeight(i,function(res) {
            // console.log(JSON.stringify(res,0,4));
            let block = res;
            updateDomainsFromBlock(block);
        });
    }

    console.log("test over ...");
}

async function fillBidAndOpenInfo() {
    redisClient.getBlocks(async function(res) {
        for(let block of res) {
            updateDomainsFromBlock(block);
            await new Promise(resolve => setTimeout(resolve, 5));
        }
    });
}

console.log(new Date(),"start domain service ...");

// tickBlockScan();
// tickTranslateAndGoogle();

runBlockScan();
runTranslateAndGoogle();

// fillBidAndOpenInfo();