var np = require('../persistence/notification_persistence');

const Status = {
    SUCCESS: 0,
    UNAUTHORIZED: 1,
    UNKNOWN_ERROR: 2
};
Object.freeze(Status);
exports.Status = Status;

exports.getNotifications = (username, callback) => {
    np.getNotifications(username, (notifications) => {
        var result = [];
        if (!notifications) {
            callback(Status.UNKNOWN_ERROR);
            return;
        }
        for (var i = 0; i < notifications.length; ++i) {
            var r = {
                'id': notifications[i]._id,
                'text': notifications[i].text
            };
            result.push(r);
        }
        callback(Status.SUCCESS, result);
    });
};

exports.dismissNotification = (username, id, callback) => {
    np.getNotification(id, (notification) => {
        if (!notification) {
            callback(Status.UNKNOWN_ERROR);
            return;
        }
        if (notification.userId.toHexString() !== id) {
            callback(Status.UNAUTHORIZED);
            return;
        }
        np.removeNotification(id, (success) => {
            callback(success ? Status.SUCCESS : Status.UNKNOWN_ERROR);
        });
    });
};

exports.dismissAllNotifications = (username, callback) => {
    np.removeAllNotifications(username, (success) => {
        callback(success ? Status.SUCCESS : Status.UNKNOWN_ERROR);
    });
};
