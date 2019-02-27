/**
 * @module persistence/db_access
 */

var mongodb = require('mongodb');

var MongoClient = mongodb.MongoClient;
var url = 'mongodb://localhost:27017/';

/**
 * Creates a connection to the database.
 * @param {function} callback - callback with a connection parameter
 */
exports.connect = function(callback) {
    MongoClient.connect(url, function(err, db) {
        if (err) {
            throw err;
        }
        callback(db);
    });
}
