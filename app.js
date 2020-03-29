const {NodeClient, WalletClient} = require('hs-client');
const {Network} = require('hsd');
const network = Network.get('main');

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

(async () => {
    const clientinfo = await client.getInfo();
    console.log(clientinfo);
})();