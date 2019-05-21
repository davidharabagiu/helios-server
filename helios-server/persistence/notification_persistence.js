var db_access = require('./db_access');
var config = require('../utils/config').config;
var ObjectID = require('mongodb').ObjectID;

const dbName = config.database.name;
const notificationsCollection = config.database.collections.notifications;
const usersCollection = config.database.collections.users;

exports.createNotification = (username, text, data, callback) => {
    db_access.connect((db) => {
        dbo = db.db(dbName);
        dbo.collection(usersCollection).findOne({
            username: username
        }, (err, res) => {
            if (err) {
                console.log('notification_persistence', err);
                callback(false);
                return;
            }
            var userId = res._id;
            dbo.collection(notificationsCollection).insertOne({
                userId: userId,
                text: text,
                data: data
            }, (err, res) => {
                db.close();
                if (err) {
                    console.log('notification_persistence', err);
                    callback(false);
                    return;
                }
                callback(true);
            });
        });
    });
};

exports.getNotifications = (username, callback) => {
    db_access.connect((db) => {
        dbo = db.db(dbName);
        dbo.collection(usersCollection).findOne({
            username: username
        }, (err, res) => {
            if (err) {
                console.log('notification_persistence', err);
                callback();
                return;
            }
            var userId = res._id;
            var cursor = dbo.collection(notificationsCollection).find({
                userId: {
                    $eq: userId
                }
            }).toArray((err, res) => {
                db.close();
                if (err) {
                    console.log('notification_persistence', err);
                }
                callback(res);
            });
        });
    });
};

exports.getNotification = (id, callback) => {
    db_access.connect((db) => {
        dbo = db.db(dbName);
        dbo.collection(notificationsCollection).findOne({
            _id: ObjectID(id)
        }, (err, res) => {
            db.close();
            if (err) {
                console.log('notification_persistence', err);
                callback();
            } else {
                callback(res);
            }
        });
    });
};

exports.removeNotification = (id, callback) => {
    db_access.connect((db) => {
        dbo = db.db(dbName);
        dbo.collection(notificationsCollection).deleteOne({
            _id: ObjectID(id)
        }, (err, res) => {
            db.close();
            if (err) {
                console.log('notification_persistence', err);
                callback(false);
            } else {
                callback(true);
            }
        });
    });
};

exports.removeAllNotifications = (username, callback) => {
    db_access.connect((db) => {
        dbo = db.db(dbName);
        dbo.collection(usersCollection).findOne({
            username: username
        }, (err, res) => {
            if (err) {
                console.log('notification_persistence', err);
                callback(false);
                return;
            }
            var userId = res._id;
            dbo.collection(notificationsCollection).deleteMany({}, (err,
                res) => {
                db.close();
                if (err) {
                    console.log('notification_persistence', err);
                    callback(false);
                } else {
                    callback(true);
                }
            });
        });
    });
};
