const redis = require("redis");
const client = redis.createClient();
const {Domain,Block} = require("./domain")

client.on("error", function(error) {
    console.error(error);
});

const KEY_DOMAINS = "key_domains";
const KEY_BLOCK = "key_block";

class RedisClient {
    constructor() {
        
    }

    getAllDomains(callback) {
        client.hgetall(KEY_DOMAINS,function(err,res) {
            let result = []
            for (let [key,value] of Object.entries(res)) {
                let domain = new Domain().parse(value);
                result.push(domain);
            }

            result.sort(function(a,b) {
                return a["height"] - b["height"];
            })
            // console.log("getBiddingDomains ",result.length);
            callback(result);
        });
    }

    // set domain, do override
    setDomain(domain) {
        client.hset(KEY_DOMAINS,domain.name,domain.toString(),function(err,res) {
            console.log("[set domain]", domain.name, domain.toString());
            return res;
        });
    }

    existsDomain(domain,callback) {
        client.hexists(KEY_DOMAINS,domain,function(err,res) {
            // console.log("[exist]",domain,":",res);
            callback(res);
        });
    }

    getDomain(name,callback) {
        client.hget(KEY_DOMAINS,name,function(err,res) {
            // console.log("[get domain] ",name,":",res);
            if(res) {
                let domain = new Domain().parse(res);
                callback(domain);
            }else {
                console.log("[get domain] not exist:",name);
            }
        });
    }

    existBlock(height,callback) {
        client.hexists(KEY_BLOCK,height,function(err,res) {
            // console.log("[exist]",block,":",res);
            callback(res);
        });
    }
    
    setBlock(block) {
        client.hset(KEY_BLOCK,block.height,block.toString(),function(err,res) {
            console.log("[set block]", block.height);
        });
    }

    getBlockByHeight(height,callback) {
        client.hget(KEY_BLOCK,height,function(err,res) {
            let block = new Block().parse(res);
            callback(block);
        });
    }

    getBlocks(callback) {
        client.hgetall(KEY_BLOCK,function(err,res) {
            let result = []
            for (let [key,value] of Object.entries(res)) {
                let block = new Block().parse(value);
                result.push(block);
            }

            result.sort(function(a,b) {
                return a["height"] - b["height"];
            })
            // console.log("getBlocks ",result.length);
            callback(result);
        });
    }

    quit() {
        client.quit();
    }
}

class Singleton {
  constructor() {
      if (!Singleton.instance) {
          Singleton.instance = new RedisClient();
      }
  }

  getInstance() {
      return Singleton.instance;
  }
}

module.exports = Singleton;