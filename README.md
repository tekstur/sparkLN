    sparkLN

    An ultralight lightning network integration for minimal invoice handling.

	Nodejs API to connect to LND service on TOR. Can create and view invoices, and subscribe to changes using websockets.

	Use sparkln to have a separate endpoint connecting to your umbrel node (on Tor) for issuing in-app invoices.

	Persists created invoices in db (mysql) for easier auditing

	
	Config
	Set up configuration in config.json.

	If "usetor=false", "lnurl" is used instead of Tor. Using Tor requires...Tor already running. Torproxy can vary (the port part).

	Using letsencrypt TLS:

		"sslcert":"/etc/letsencrypt/live/domainname/cert.pem"

		"sslkey":"/etc/letsencrypt/live/domainname/privkey.pem"

	

	"Apikey" should be hard to guess - and only really relevant if the service is not used from public javascript.

	If not using db persistence ("usedb=false"), ignore the db credentials.

	Currently configured as a standalone service with a vhost answering on the given port for both https and secure websocket.
	

	
	From Umbrel
	SSH to your umbrel ssh umbrel@umbrel.local

	Find your Tor LND REST hostname at: /umbrel/tor/data/lnd-rest/hostname 

	Create your macaroon (Permissions should be restricted): 

	/umbrel/bin/lncli bakemacaroon address:read address:write info:read info:write invoices:read invoices:write message:read message:write offchain:read offchain:write onchain:read onchain:write peers:read peers:write signer:generate signer:read


	Deploy
	Using pm2 process manager, run "pm2 start index.js". Sparkln is now accessible on the specified port

	
	Behind Apache
	Running the service behind apache2 as proxy is fairly simple - although upgrading to secure WS seems...illusive. So, use as standalone or use this for inspiration:

	
		&#60;VirtualHost *:80&#62;

	        ServerName [name]

	        DocumentRoot [path]

	        &#60;Directory /&#62;

	        &nbsp;&nbsp;&nbsp;Options -Indexes +FollowSymLinks

	        &nbsp;&nbsp;&nbsp;AllowOverride None

	        &nbsp;&nbsp;&nbsp;Require all granted

	        &#60;/Directory&#62;

			ProxyRequests Off

			ProxyPreserveHost On

			ProxyVia Full

			ProxyPass /v1/subscribeinvoice/ ws://localhost:21213/v1/subscribeinvoice/

			ProxyPassReverse /v1/subscribeinvoice/ ws://localhost:21213/v1/subscribeinvoice/

	        ProxyPass / http://localhost:21213/

	      	ProxyPassReverse / http://localhost:21213/

	&#60;/VirtualHost&#62;

	------

	Replace 21213 with port specified in config.json. Secure WS throws 404.

	

	
	
	API

	
	Create invoice

	<b>POST v1/invoice/</b>

	Takes "value", "expiry", "memo", "account" in request and creates invoice. "Account" is used for db persistence to easily differentiate different apps.

	Returns JSON invoice consisting of:

		invoice.bolt11

		invoice.r_hash (hex). Use r_hash to get or subscribe to invoice

	
	Get invoice

	<b>GET v1/invoice/r_hash</b>

	Returns JSON invoice:

	invoice.bolt11

	invoice.memo

	invoice.value

	invoice.settled

	invoice.expiry

	invoice.state

	

	
	Subscribe to invoice updates

	<b>WS v1/subscribeinvoice/?id=[r_hash]</b>

	Open a websocket connection to subscribe to updates on the invoice. Returns:

		STATE: OPEN

		STATE: SETTLED

		STATE: CANCELED

	Closes ws connection when invoice is either SETTLED or CANCELED
	

	
	Test

	In "test/" a simple html test page shows the entire functionality. An online version may sometimes be found at: https://utils.tekstur.dk/sparklnclient
