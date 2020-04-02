const {Network} = require('hsd');
const network = Network.get('main');

config = exports;

config.hsClientOptions = {
	network: network.type,
	port: network.rpcPort,
	apiKey: '5cb157195e99d5378f3aad21c1ac4717a35381b35ca25b40ec2ead915b85b73a'
}

config.googleOptions = {
    cx: "004539971733259815619:it74y74gt18",
    auth: "AIzaSyCAzJjzp3DO7Gc3V23qV1hGuLv2BKI_Tf4"
}