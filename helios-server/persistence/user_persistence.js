var db_access = require('./db_access');
var config = require('../utils/config').config;
var file_metadata_persistence = require('./file_metadata_persistence');

const dbName = config.database.name;
const usersCollection = config.database.collections.users;

exports.createUser = function(username, password, salt, callback) {
    file_metadata_persistence.createRoot(function(rootId) {
        if (!rootId) {
            callback(false);
        } else {
            db_access.connect(function(db) {
                dbo = db.db(dbName);
                var user = {
                    username: username,
                    password: password,
                    salt: salt,
                    files: rootId
                };
                dbo.collection(usersCollection).insertOne(user, function(err,
                    res) {
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
    });
}

exports.findUser = function(username, callback) {
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        dbo.collection(usersCollection).findOne({
            username: username
        }, function(err, res) {
            db.close();
            if (err) {
                console.log('user_persistence', err);
                callback(undefined);
            } else {
                callback(res);
            }
        });
    });
}
