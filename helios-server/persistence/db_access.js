var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
const url = 'mongodb://localhost:27017/';

exports.connect = function(callback) {
    MongoClient.connect(url, { useNewUrlParser: true }, function (err, db) {
        if (err) {
            throw err;
        }
        callback(db);
    });
}
