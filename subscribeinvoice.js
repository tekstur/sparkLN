const request = require('request');
const SocksProxyAgent = require('socks-proxy-agent');
const mysql = require('mysql');

module.exports = function (ws,id,config) {
	var id64 = Buffer.from(id, 'hex').toString("base64");
	
	//replace + with -, / with _, an
	id64 = id64.replace(/\+/g, '-');
	id64 = id64.replace(/\//g, '_');
	
	var completeUrl = config.tor + "v2/invoices/subscribe/"+id64;
	//console.log("LN URL: " +completeUrl);
	const proxy = config.torproxy;
	const agent = new SocksProxyAgent(proxy);
	
	
	let options = {
	  url: completeUrl,
	  // Work-around for self-signed certificates.
	  rejectUnauthorized: false,
		agent: agent,
	  json: true, 
	  headers: {
	    'Grpc-Metadata-macaroon': config.macaroon,
	  },
	}
	
	request.get(options, function(error, response, body) {
		
		if(body != undefined){
			var jsonBody = [body];	
			if(typeof body !='object'){
				//crazy. lnd returns stream with _two_ json objects, not in an array -> enforce arr
				body = body.replace(/}}}/g, '}}},');
				body = body.substring(0,(body.length-2));
				var jsonString = "["+body+"]";
				jsonBody = JSON.parse(jsonString);	
			}
		
			if(jsonBody[(jsonBody.length-1)].result != undefined){
				var currentState = jsonBody[(jsonBody.length-1)].result.state
				ws.send("STATE: "+currentState);
			}
			else{
				ws.send("{'status':'LND error - no invoice found'}");
			}
		}
		
		
		
	});
}
