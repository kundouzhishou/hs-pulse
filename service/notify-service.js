var request = require('request');

const fs = require('fs');

const config = require("../config")
const client = new NodeClient(config.hsClientOptions);

const BLOCK_LEFT = 2;

const NOTIFY_URL = 'http://miaotixing.com/trigger';
// t9arTWL test: tufnPS0
const ID_DOMAINM = "t9arTWL";

// curl -d "id=tufnPS0" http://miaotixing.com/trigger

// avoid duplicate nofity
var notifiedMap = {}

async function tick() {
    // console.log(new Date(),"start tick ...");
    try {
        var mydata = JSON.parse(fs.readFileSync('../data.json', 'utf-8'));
    }catch (e) {
        console.log("data file is not readable now ...");
        return;
    }

    let notifyNames = [];
    
    for(element of mydata["subscribes"]) {
        if(!(element in notifiedMap)) {
            const result = await checkNotify(element);
            if(result) {
                // console.log("got one:",element)
                notifyNames.push(element);
            }
        }
    }

    if(notifyNames.length) {
        doNotify(notifyNames.join(','));
        notifyNames.forEach(element => {
            notifiedMap[element] = true;
        })
    } 
}

function doNotify(str) {
    console.log(new Date(),"notify : ", str);
    request.post(NOTIFY_URL,{ json: {id: ID_DOMAINM,text: str} }, function(error,response,body) {
        if (!error && response.statusCode == 200) {
            console.log(new Date(),body);
        }
    });
}

async function checkNotify(name) {
    // hsd-cli rpc getnameinfo 'stanforth'
    const result = await client.execute('getnameinfo', [name]);
    if(result["info"]["state"] == "BIDDING") {
        if(result["info"]["stats"]["blocksUntilReveal"] <= BLOCK_LEFT) {
            return true;
        }
    }
    return false;
}

async function run() {
    while(true) {
        tick();
        await new Promise(resolve => setTimeout(resolve, 5*1000));
    }
}

console.log(new Date(),"start notify service ...");
run();