const {Network} = require('hsd');
const network = Network.get('main');

config = exports;

config.hsClientOptions = {
	network: network.type,
	port: network.rpcPort,
	apiKey: ''
}

config.googleOptions = {
    cx: "",
    auth: ""
}