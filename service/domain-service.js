const numeral = require('numeral');
const util = require("util")
const request = require("sync-request")

const {google} = require('googleapis');
const customsearch = google.customsearch('v1');

const Domain = require("../domain")
var RedisClient = require("../redis-client");
var redisClient = new RedisClient().getInstance();

const {NodeClient,} = require('hs-client');
const config = require("../config")
const nodeClient = new NodeClient(config.hsClientOptions);

async function tick() {
    // console.log("domain service tick ...");
    const result = await nodeClient.execute('getnames');
    // console.log(result.length);

    for(let element of result) {
        await new Promise(resolve => setTimeout(resolve, 10));
        // console.log(element);
        redisClient.exists(element["name"], function(res) {
            if(!res) {
                redisClient.set(new Domain(element["name"],element["height"]));
            }
        });
    }
}

async function tickTranslateAndGoogle() {
    const clientinfo = await nodeClient.getInfo();
    let blockheight = clientinfo["chain"]["height"];
    console.log("current height:",blockheight);
    redisClient.getAllDomains(async function(res) {
        let targetDomain = null;
        for(let domain of res) {
            if(domain.bidStartHeight() <= blockheight) {
                continue;
            }

            if(domain.translate != "" || domain.score != 0) {
                continue;
            }

            if(targetDomain == null || targetDomain.height > domain.height) {
                targetDomain = domain;
            }
        }
        if(targetDomain) {
            console.log("target domain:",JSON.stringify(targetDomain));

            // google search name
            const res = await customsearch.cse.list({
                cx: config.googleOptions.cx,
                q: targetDomain.name,
                auth: config.googleOptions.auth,
            });
            let totalResults = res.data.searchInformation.totalResults;
            let formatedResult = numeral(totalResults).format('0,0');
            console.log("google search:",targetDomain.name,formatedResult);
            targetDomain.score = formatedResult;

            // translate name
            
            const url = "https://translation.googleapis.com/language/translate/v2/?q=%s&source=en&target=zh&key=%s";
            var reqRes = request('GET',util.format(url,targetDomain.name,config.googleOptions.auth));
            let translateName = targetDomain.name;
            if(!reqRes.isError() && reqRes.statusCode == 200) {
                obj = JSON.parse(reqRes.getBody());
                try {
                    translateName = obj["data"]["translations"][0]["translatedText"];
                    console.log("translate successful",targetDomain.name,translateName);
                }catch(err) {
                    console.log("translate failed",reqRes.getBody());
                }
            }else {
                console.log("translate failed",reqRes.getBody());
            }

            targetDomain.translate = translateName;
            console.log("update domain",JSON.stringify(targetDomain,0,4));
            redisClient.set(targetDomain);
        }
    });
}

async function run() {
    while(true) {
        tick();
        await new Promise(resolve => setTimeout(resolve, 5*1000));
    }
}

async function runTranslateAndGoogle() {
    while(true) {
        tickTranslateAndGoogle();
        await new Promise(resolve => setTimeout(resolve, 2*1000));
    }
}

console.log(new Date(),"start domain service ...");
// tickTranslateAndGoogle();
// tick();
run();
runTranslateAndGoogle();