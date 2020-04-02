var request = require('request');

function translate(word,callback) {
    url = 'http://fanyi.youdao.com/translate?smartresult=dict&smartresult=rule&smartresult=ugc&sessionFrom=null'
    key = {
        'type': "AUTO",
        'i': word,
        "doctype": "json",
        "version": "2.1",
        "keyfrom": "fanyi.web",
        "ue": "UTF-8",
        "action": "FY_BY_CLICKBUTTON",
        "typoResult": "true"
    }

    var proxiedRequest = request.defaults({'proxy': null});
    proxiedRequest.post(url,{form:key}, function(error,response,body) {
        if (!error && response.statusCode == 200) {
            result = JSON.parse(body)['translateResult'][0][0]['tgt'];
            console.log(`translate successful:${word}=${result}`);
            callback(result);
        }else {
            console.log("translate error:",body);
            callback(word);
        }
    });
}

module.exports = translate
// console.log(translate("forged"));