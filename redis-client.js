const redis = require("redis");
const client = redis.createClient();
const Domain = require("./domain")

client.on("error", function(error) {
    console.error(error);
});

const KEY_DOMAINS = "key_domains";

class RedisClient {
    constructor() {
        new Domain();
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
    set(domain) {
        client.hset(KEY_DOMAINS,domain.name,domain.toString(),function(err,res) {
            console.log("[set]", domain.name, domain.toString());
            return res;
        });
    }

    exists(domain,callback) {
        client.hexists(KEY_DOMAINS,domain,function(err,res) {
            // console.log("[exist]",domain,":",res);
            callback(res);
        });
    }

    get(name,callback) {
        client.hget(KEY_DOMAINS,name,function(err,res) {
            // console.log("[ge] ",name,":",res);
            callback(res);
        });
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