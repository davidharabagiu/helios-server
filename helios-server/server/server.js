var app = require('express')();
var bodyParser = require('body-parser');
var urls = require('./urls');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/', (request, response) => {
    response.send('Welcome to Helios!');
});

urls.register(app);

var server = app.listen(8000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log(`Listening on ${host}:${port}...`);
});
