const request = require('request');
const SocksProxyAgent = require('socks-proxy-agent');
const mysql = require('mysql');
const crypto = require("crypto");
const logger = require('./logger');

module.exports = function (satValue,expiry,memo, account,config,res) {
	if(isNaN(satValue) || satValue < 0 || satValue > 100000000 || isNaN(expiry) || expiry < 0 || expiry > 43200 || memo.length > 256 ||  account.length > 256){
		logger.error("BAd invoice input");
		res.setHeader('Content-Type', 'application/json');
		res.send("{'status':'inputerror'}");
	}
	else{
		var completeUrl = config.lnurl + 'v1/invoices';
	
		memo = sanitize(memo);
		account = sanitize(account);
		let requestBody = { 
		    value: satValue,
		    expiry: expiry,
			memo: memo
		}
	
		var invoice = {};
	
		let options = {
		  url: completeUrl,
		  rejectUnauthorized: false,
		  json: true, 
		  headers: {
		    'Grpc-Metadata-macaroon': config.macaroon,
		  },
		  form: JSON.stringify(requestBody)
		}
		if(config.usetor){
			const proxy = config.torproxy;
			completeUrl = config.tor + "v1/invoices";
			const agent = new SocksProxyAgent(proxy);
			options.url=completeUrl;
			options.agent=agent;
		}
		logger.info("CREATE INVOICE " + completeUrl + " // " +JSON.stringify(requestBody) + " // " + JSON.stringify(options));
		try{
			request.post(options, function(error, response, body) {
				if(body != undefined && body.r_hash != undefined && body.payment_request != undefined ){
					invoice.r_hash = Buffer.from(body.r_hash, 'base64').toString('hex');
					invoice.bolt11 = body.payment_request;
					res.setHeader('Content-Type', 'application/json');
					res.send(invoice);
					if(config.usedb){
						persistInvoice(requestBody,account,invoice.r_hash,config);
					}
				}
				else{
					logger.error("LND POST ERROR - " + JSON.stringify(body));
					res.status(500).json({ error: 'LND error' });
				}		
			});
		}
		catch(err){
			
			logger.error("Error in lnd post: " + err);
		}
	}
}

function persistInvoice(invoice,account,r_hash, config){
	var conn = mysql.createConnection({
	  	host: config.dbhost,
	 	user: config.dbuser,
		port: config.dbport,
	  	password: config.dbpassword,
		database: config.dbname
	});
	conn.connect(function(err) {
	  if (err) throw err;
	  var sql = "INSERT INTO spark_invoices (id, datecreated,value,expiry,memo,account,r_hash) VALUES (?,NOW(),?,?,?,?,?)";
	  const id = crypto.randomBytes(16).toString("hex");
	  conn.query(sql,[id,invoice.value,invoice.expiry,invoice.memo,account,r_hash], function(err, result) {
	     if (err)
	       logger.log('DB INSERT ERROR');
	   });
	   conn.end();
   });
}

function sanitize(string) {
  const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      "/": '&#x2F;',
  };
  const reg = /[&<>"'/]/ig;
  return string.replace(reg, (match)=>(map[match]));
}
