const fs = require('fs');
const path = require('path'),    

utils = exports;

utils.getSubscribeNames = function() {
    try {
        var mydata = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf-8'));
        return mydata["subscribes"];
    }catch (e) {
        console.log("data file is not readable now ...");
        console.log(e);
        return [];
    }
}

utils.getAutoBidNames = function() {
    try {
        var mydata = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf-8'));
        return mydata["autoBid"];
    }catch (e) {
        console.log("data file is not readable now ...");
        console.log(e);
        return [];
    }
}