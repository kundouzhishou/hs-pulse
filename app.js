const fs = require('fs');
const util = require("util")
const translate = require("./youdao")

const config = require("./config")
const {NodeClient,} = require('hs-client');
const client = new NodeClient(config.hsClientOptions);

const DATA_FILE = "data.json";

// hsd-cli rpc getnameinfo 'stanforth'

async function run() {
    console.log("start run ...");
    var mydata = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    const result = await client.execute('getnames');
    const checkPointBlock = mydata["checkPointBlock"];
    
    let targetnames = [];
    result.forEach(element => {
        if(element["state"] == "BIDDING" && element["stats"]["bidPeriodEnd"] > checkPointBlock) {
            targetnames.push({"name":element["name"],"blockleft":element["stats"]["blocksUntilReveal"],"bidEndBlock":element["stats"]["bidPeriodEnd"]})
        }
    });
    targetnames.sort(function(a,b) {
        return a["blockleft"] - b["blockleft"];
    })

    // make sure outputs have entire block data and more than MIN_COUNT
    let lastBlock = 0;
    let count = 1;
    const MIN_COUNT = 30;
    // console.log(targetnames.length);
    targetnames.every(element => {
        if (element["bidEndBlock"] > lastBlock && count > MIN_COUNT) {
            return false;
        }
        // translateWord = translate(element["name"]);
        translateWord = "";
        console.log(util.format("%s. %s %s %s %s",count.toString().padStart(3), element["name"].padStart(30), element["blockleft"].toString().padStart(3),element["bidEndBlock"].toString().padStart(8),translateWord));
        count ++;
        lastBlock = element["bidEndBlock"];
        return true;
    });
    // write block info back to data.json
    mydata["checkPointBlock"] = lastBlock;
    fs.writeFileSync(DATA_FILE,JSON.stringify(mydata,null,4));

    console.log("run end ...");
}

run();


