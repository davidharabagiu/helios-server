var db_access = require('./db_access');

const db_name = 'helios';
const collection_users = 'users';

exports.user_exists = function(username, callback) {
    db_access.connect(function(db) {
        dbo = db.db(db_name);
        dbo.collection(collection_users).countDocuments({username: username}, {}, function(err, res) {
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

exports.create_user = function(username, password, callback) {
    db_access.connect(function(db) {
        dbo = db.db(db_name);
        var user = {
            username: username,
            password: password
        };
        dbo.collection(collection_users).insertOne(user, function(err, res) {
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

exports.user_password_match = function(username, password, callback) {
    db_access.connect(function(db) {
        dbo = db.db(db_name);
        var user = {
            username: username,
            password: password
        }
        dbo.collection(collection_users).countDocuments(user, {}, function(err, res) {
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
