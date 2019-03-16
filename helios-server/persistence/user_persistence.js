var db_access = require('./db_access');
var config = require('../utils/config').config;

const dbName = config.database.name;
const usersCollection = config.database.collections.users;

exports.createUser = function(username, password, salt, callback) {
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        var user = {
            username: username,
            password: password,
            salt: salt
        };
        dbo.collection(usersCollection).insertOne(user, function(err, res) {
            db.close();
            if (err) {
                console.log('user_persistence', err);
                callback(false);
            } else {
                callback(true);
            }
        });
    });
}

exports.findUser = function(username, callback) {
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        dbo.collection(usersCollection).findOne({ username: username }, function(err, res) {
            if (err) {
                console.log('user_persistence', err);
                callback(undefined);
            } else {
                callback(res);
            }
        });
    });
}
