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
    }

    parse(str) {
        let obj = JSON.parse(str);
        this.name = obj["name"];
        this.height = obj["height"];
        this.translate = obj["translate"]
        this.score = obj["score"];
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
}

module.exports = Domain