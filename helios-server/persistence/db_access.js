var mongodb = require('mongodb');

module.exports = {
    connect: connect
};

var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/';

/**
 * Creates a connection to the database.
 * @param {function} callback - callback with a connection parameter
 */
function connect(callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            throw err;
        }
        callback(db);
    });
}
