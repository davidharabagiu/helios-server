var app = require('express')();
var bodyParser = require('body-parser');
var user_routes = require('./routes/user_routes');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(request, response) {
    response.send('Welcome to Helios!');
});

app.post('/register', user_routes.register);

var server = app.listen(8000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log(`Listening on {host}:{port}...`);
});
