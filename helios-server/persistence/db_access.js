var mongodb = require('mongodb');

module.exports = {
    connect: connect
};

var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/';

function connect(callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            throw err;
        }
        callback(db);
    });
}
