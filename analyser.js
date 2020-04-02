const {NodeClient,} = require('hs-client');
const config = require("./config")
const client = new NodeClient(config.hsClientOptions);

function getBlockTxsByHeight(blockheight) {
    let blockhash, details, verbose;

    verbose=1;
    details=0;

    (async () => {
        const result = await client.execute('getblockbyheight', [ blockheight, verbose, details ]);
        txs = result["tx"];
        // console.log(txs);

        for(let txId of txs) {
            (async () => {
                // console.log("block=",blockheight, "tx=",txId);
                const result = await client.getTX(txId);
                // console.log(JSON.stringify(result,0,4));
                let outputs = result["outputs"];
                // console.log(JSON.stringify(outputs,0,4));
                for(let output of outputs) {
                    let covenant = output["covenant"];
                    let txType = covenant["type"];
                    let action = covenant["action"];
                    if(txType != 0) {
                        console.log(txType,action);
                        console.log("block=",blockheight, "tx=",txId);
                        console.log(JSON.stringify(outputs,0,4));
                    }
                    
                    // console.log(JSON.stringify(result,0,4));
                }
                
            })().catch((err) => {
                console.error(err.stack);
            });
        }
    })();
}

(async () => {
    const clientinfo = await client.getInfo();
    let blockheight = clientinfo["chain"]["height"];
    console.log("current block height",blockheight);
    for(i =1; i <= blockheight; ++i) {
        getBlockTxsByHeight(i);
        await new Promise(resolve => setTimeout(resolve,10));
    }
})();