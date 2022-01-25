const request = require('request');
const SocksProxyAgent = require('socks-proxy-agent');

module.exports = function (id,config,res) {
	var invoice = {};
	var completeUrl = config.lnurl + 'v1/invoice/'+id;

	let options = {
	  url: completeUrl,
	  rejectUnauthorized: false,
	  json: true, 
	  headers: {
	    'Grpc-Metadata-macaroon': config.macaroon,
	  },
	}
	
	if(config.usetor){
		const proxy = config.torproxy;
		completeUrl = config.tor + "v1/invoice/"+id;
		const agent = new SocksProxyAgent(proxy);
		options.url=completeUrl;
		options.agent=agent;
	}
	
	try{
		request.get(options, function(error, response, body) {
			if(body != undefined && body.r_hash != undefined && body.payment_request != undefined && body.memo != undefined && body.value != undefined && body.settled != undefined && body.expiry != undefined && body.state != undefined){
				invoice.bolt11 = body.payment_request;
				invoice.memo = body.memo;
				invoice.value = body.value;
				invoice.settled = body.settled;
				invoice.expiry = body.expiry;
				invoice.state = body.state;
				res.setHeader('Content-Type', 'application/json');
				res.send(invoice);
			}
			else{
				res.status(500).json({ error: 'LND error' });
			}
		});
	}
	catch(err){
		console.error(err);
	}
}

