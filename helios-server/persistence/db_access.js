var mongodb = require('mongodb');
var config = require('../utils/config').config;

var MongoClient = mongodb.MongoClient;
const url = config.database.url;

exports.connect = function(callback) {
    MongoClient.connect(url, {
        useNewUrlParser: true
    }, function(err, db) {
        if (err) {
            throw err;
        }
        callback(db);
    });
}
