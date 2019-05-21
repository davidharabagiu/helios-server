var np = require('../notification_persistence');

const Status = {
    SUCCESS: 0,
    UNAUTHORIZED: 1
    UNKNOWN_ERROR: 2,
};
Object.freeze(Status);
exports.Status = Status;

exports.getNotifications = (username, callback) => {
    np.getNotifications(username, (success) => {
        callback(success ? Status.SUCCESS : Status.UNKNOWN_ERROR);
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
