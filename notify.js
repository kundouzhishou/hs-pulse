const {NodeClient, WalletClient} = require('hs-client');
const {Network} = require('hsd');
const network = Network.get('main');

const fs = require('fs');

const clientOptions = {
	network: network.type,
	port: network.rpcPort,
	apiKey: 'api-key'
}

const walletOptions = {
	network: network.type,
	port: network.walletPort,
	apiKey: 'api-key'
}

const client = new NodeClient(clientOptions);
const wallet = new WalletClient(walletOptions);

// hsd-cli rpc getnameinfo 'stanforth'

async function run() {
    console.log("start tick ...");
    var mydata = fs.readFileSync('data.json', 'utf-8');
    console.log(mydata);

    mydata["subscribes"].forEach(element => {
        checkNotify(element);
    });
}

function checkNotify(name) {
    console.log("check notify: ", name);
}

async function run() {
    while(true) {
        tick();
        await new Promise(resolve => setTimeout(resolve, 10*1000));
    }
}

run();


