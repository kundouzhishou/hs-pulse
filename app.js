const fs = require('fs');
const util = require("util")

const config = require("./config")
const {NodeClient} = require('hs-client');
const nodeClient = new NodeClient(config.hsClientOptions);

var RedisClient = require("./redis-client");
var redisClient = new RedisClient().getInstance();

const DATA_FILE = "data.json";

// hsd-cli rpc getnameinfo 'stanforth'

async function run() {
    console.log("start run ...");
    var mydata = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const checkPointBlock = mydata["checkPointBlock"];
    
    const clientinfo = await nodeClient.getInfo();
    let blockheight = clientinfo["chain"]["height"];

    let targetnames = [];
    redisClient.getAllDomains(function(res) {
        for(domain of res) {
            // domain is bidding state
            if(domain.bidEndHeight() > blockheight && domain.bidStartHeight() < blockheight) {
                if(domain.bidEndHeight() > checkPointBlock) {
                    targetnames.push(domain);
                }
            } 
        }

        // make sure outputs have entire block data and more than MIN_COUNT
        let lastBlock = 0;
        let count = 1;
        const MIN_COUNT = 30;
        // console.log(targetnames.length);
        targetnames.every(domain => {
            if (domain.bidEndHeight() > lastBlock && count > MIN_COUNT) {
                // break =>every
                return false;
            }
            let leftBlockStr = (domain.bidEndHeight() - blockheight).toString().padStart(3);
            let endBlockStr = domain.bidEndHeight().toString().padStart(8);
            let leftTime = getTimeInfo(domain.bidEndHeight() - blockheight).toString().padStart(10);
            let scoreStr = domain.score.toString().padStart(12);
            let translateStr = domain.translate;
            console.log(util.format("%s. %s   %s %s   %s     %s",count.toString().padStart(3), domain.name.padStart(30), leftBlockStr ,leftTime,scoreStr,translateStr));
            count ++;
            lastBlock = domain.bidEndHeight();
            return true;
        });
        // write block info back to data.json
        mydata["checkPointBlock"] = lastBlock;
        fs.writeFileSync(DATA_FILE,JSON.stringify(mydata,null,4));

        redisClient.quit();
        console.log("run end ...");
    });
}

function getTimeInfo(block) {
    let totalMinutes = block * 10;
    let minutes = totalMinutes % 60;
    let totalHours = Math.floor(totalMinutes / 60);
    let hours = totalHours % 24;
    let totalDays = Math.floor(totalHours / 24);
    if (totalHours == 0) {
        return `${totalMinutes}分`;
    }else if(totalDays == 0) {
        return `${hours}时${minutes}分`;
    }else {
        return `${totalDays}天${hours}时${minutes}分`;
    }
    return "--";
}

run();

