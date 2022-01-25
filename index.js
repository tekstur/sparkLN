//config file
const config = require('./config.json');

const express = require('express');
const https = require('https');
const fs = require('fs');
var vhost = require('vhost');

var tls_credentials = {
  key: fs.readFileSync(config.sslkey),
  cert: fs.readFileSync(config.sslcert)
};
const app = express();
var server = https.createServer(tls_credentials, app);
//var server = http.createServer(app);



const WebSocketServer = require("ws").Server;


const bodyParser = require('body-parser')
const url = require('url');


//internal modules
const createInvoice = require('./createinvoice');
const getInvoice = require('./getinvoice');
const subscribeInvoice = require('./subscribeinvoice');

//init
const PORT = config.port;

//routes
app.use('/', express.static('public'));
app.use('/test', express.static('test'));

app.use(function(req, res, next) {
   res.header("Access-Control-Allow-Origin", "*");
   res.header("Access-Control-Allow-Methods", "*");
   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
   if ('OPTIONS' == req.method) {
      res.sendStatus(200);
    }
    else {
      next();
    }});

app.use(function(req, res, next) {
  if (!req.headers.authorization || req.headers.authorization != ("apikey " + config.apikey)) {
    return res.status(403).json({ error: 'Bad or no apikey' });
  }
  next();
});

app.use(bodyParser.json());
app.get('/v1/invoice/:rhash', function (req, res) {
	getInvoice(req.params.rhash,config,res);
})
app.post('/v1/invoice', function (req, res) {
	createInvoice(req.body.value, req.body.expiry, req.body.memo,req.body.account,config,res);
})
//virtual host on domainname
var superApp = module.exports = express();
superApp.use(vhost(config.domainname, app));

server.listen(PORT, () => console.log("SparkLN server listening on port: "+PORT));
if(config.usetor){
	console.log("USING TOR");
}
//websocket



var wss = new WebSocketServer({server: server, rejectUnauthorized: false, path: "/v1/subscribeinvoice/"});
console.log("SparkLN server listening WSS");

wss.on("connection", function(ws,req){
	var id = (url.parse(req.url, true).query).id;
	subscribeInvoice(ws,id,config);
	
});