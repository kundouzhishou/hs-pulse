/**
 * OPENING
 * 
 */

rules = {}
rules.types = {
    NONE: 0,
    CLAIM: 1,
    OPEN: 2,
    BID: 3,
    REVEAL: 4,
    REDEEM: 5,
    REGISTER: 6,
    UPDATE: 7,
    RENEW: 8,
    TRANSFER: 9,
    FINALIZE: 10,
    REVOKE: 11
  };
  
  const types = rules.types;
  
  /**
   * Covenant types by value.
   * @const {Object}
   */
  
  rules.typesByVal = {
    [types.NONE]: 'NONE',
    [types.CLAIM]: 'CLAIM',
    [types.OPEN]: 'OPEN',
    [types.BID]: 'BID',
    [types.REVEAL]: 'REVEAL',
    [types.REDEEM]: 'REDEEM',
    [types.REGISTER]: 'REGISTER',
    [types.UPDATE]: 'UPDATE',
    [types.RENEW]: 'RENEW',
    [types.TRANSFER]: 'TRANSFER',
    [types.FINALIZE]: 'FINALIZE',
    [types.REVOKE]: 'REVOKE'
  };

class Domain {
    constructor(name="", height=0,translate="",score="") {
        this.name = name;
        this.height = height;
        this.translate = translate;
        this.score = score;
        this.bidded = 0;
        // [{height,value,address,hash}]
        this.bidsInfo = [];
        // height,address
        this.openInfo = {};
    }

    parse(str) {
        let obj = JSON.parse(str);
        this.name = obj["name"];
        this.height = obj["height"];
        this.translate = obj["translate"]
        this.score = obj["score"];
        if("bidded" in obj) {
            this.bidded = obj["bidded"];
        }
        if("bidsInfo" in obj) {
            this.bidsInfo = obj["bidsInfo"];
        }
        if("openInfo" in obj) {
            this.openInfo = obj["openInfo"];
        }

        // bidinfo pushed not in order
        this.bidsInfo.sort(function(a,b) {
            return a["height"] - b["height"];
        })

        return this;
    }

    toString() {
        return JSON.stringify(this);
    }

    bidStartHeight() {
        return this.height;
    }

    bidEndHeight() {
        return this.bidStartHeight() + 5*6*24 + 36;
    }

    bidHashExist(hash) {
        for(let bidInfo of this.bidsInfo) {
            if(bidInfo["hash"] == hash) {
                return true;
            }
        }
        return false;
    }

    getBidsInfo() {
        let result = [];
        // console.log(this.bidsInfo);
        for(let bid of this.bidsInfo) {
            result.push(Math.floor(bid["value"] / 1000000));
        }

        return result;
    }
}

class Block {
    constructor(height=0,txData={}) {
        this.height = height;
        this.txData = txData;
        // 0,1,2,4,8 1=open,bid
        this.scaned = 0;
    }

    parse(str) {
        let obj = JSON.parse(str);
        this.height = obj["height"];
        this.txData = obj["txData"];
        if("scaned" in obj) {
            this.scaned = obj["scaned"];
        }
        return this;
    }

    toString() {
        return JSON.stringify(this);
    }
}

module.exports = {Domain,Block}