const {Domain,Block} = require("./domain")
var RedisClient = require("./redis-client");
var redisClient = new RedisClient().getInstance();

const {NodeClient,WalletClient} = require('hs-client');
const config = require("./config")
const nodeClient = new NodeClient(config.hsClientOptions);


async function run() {
    redisClient.getBlocks(async function(res) {
        let type0Amount = 0;
        // let blockList = res.slice(1000,1020);
        let blockList = res;
        for(let block of blockList) {
            // console.log(`block ${block.height}`);
            for(let txId in block.txData) {
                let txData = block.txData[txId];
                let intputs = txData["inputs"];

                let outputs = txData["outputs"];
                for(let i = 0; i < outputs.length; i++) {
                    let output = outputs[i];
                    let input = intputs[i];
                    let covenant = output["covenant"];
                    let txType = covenant["type"];
                    let items = covenant["items"];
                    if(txType == 0) {
                        if(input && input["prevout"]["hash"] == "0000000000000000000000000000000000000000000000000000000000000000") {
                            let outputValue = output["value"] / 1000000;
                            type0Amount += outputValue;
                        }
                    }else if(txType == 3) {
                        // name hash, name, height, and hash
                        // console.log(txType,action);
                        // console.log(JSON.stringify(outputs,0,4));
                    }else if(txType == 2) {
                        // name hash, zero height, and name
                        const name = await nodeClient.execute('getnamebyhash', [items[0]]);
                        console.log("name is :",name,"height:",block.height);

                        redisClient.getDomain(name,function(res){
                            // if(res != )
                            console.log(res.toString());
                        });
                        return;
                        // console.log(JSON.stringify(outputs,0,4));
                        // await new Promise(resolve => setTimeout(resolve, 3*1000));
                    }
                    
                    // console.log(JSON.stringify(output,0,4));
                }
            }
        }

        console.log(`type0Amount = ${type0Amount}`);
    });

    redisClient.quit();
}

run();
