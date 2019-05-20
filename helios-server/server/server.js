var app = require('express')();
var urls = require('./urls');
var fs = require('fs');
var https = require('https');

var privateKey = fs.readFileSync('../../localhost.key', 'utf8');
var certificate = fs.readFileSync('../../localhost.crt', 'utf8');
var credentials = {
    key: privateKey,
    cert: certificate
};

app.get('/', (request, response) => {
    response.send('Welcome to Helios!');
});

urls.register(app);

var httpsServer = https.createServer(credentials, app);

httpsServer.listen(8443, function() {
    var host = httpsServer.address().address;
    var port = httpsServer.address().port;
    console.log(`Listening on ${host}:${port}...`);
});
