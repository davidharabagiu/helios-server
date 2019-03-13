var db_access = require('./db_access');

const dbName = 'helios';
const usersCollection = 'users';

exports.userExists = function(username, callback) {
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        dbo.collection(usersCollection).countDocuments({username: username}, {}, function(err, res) {
            db.close();
            if (err) {
                console.log('db_access', err);
                callback(undefined);
            } else {
                callback(res > 0);
            }
        });
    });
}

exports.createUser = function(username, password, callback) {
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        var user = {
            username: username,
            password: password
        };
        dbo.collection(usersCollection).insertOne(user, function(err, res) {
            db.close();
            if (err) {
                console.log('db_access', err);
                callback(false);
            } else {
                callback(true);
            }
        });
    });
}

exports.userPasswordMatch = function(username, password, callback) {
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        var user = {
            username: username,
            password: password
        }
        dbo.collection(usersCollection).countDocuments(user, {}, function(err, res) {
            db.close();
            if (err) {
                console.log('db_access', err);
                callback(undefined);
            } else {
                callback(res > 0);
            }
        });
    });
}
