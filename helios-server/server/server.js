var app = require('express')();
var urls = require('./urls');
var fs = require('fs');
var https = require('https');
var config = require('../utils/config').config;

var privateKey = fs.readFileSync(config.server.privateKey, 'utf8');
var certificate = fs.readFileSync(config.server.certificate, 'utf8');
var credentials = {
    key: privateKey,
    cert: certificate
};

app.get('/', (request, response) => {
    response.send('Welcome to Helios!');
});

urls.register(app);

var httpsServer = https.createServer(credentials, app);

httpsServer.listen(config.server.port, function() {
    var host = httpsServer.address().address;
    var port = httpsServer.address().port;
    console.log(`Listening on ${host}:${port}...`);
});
