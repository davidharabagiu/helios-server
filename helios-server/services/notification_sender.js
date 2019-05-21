var np = require('../notification_persistence');

exports.sendFileShareNotification = (usernameFrom, usernameTo, fileName, fileId, callback) => {
    np.createNotification(usernameTo, `${usernameFrom} sent you ${fileName}`, {
        'from': usernameFrom,
        'fileId': fileId
    }, callback);
};

exports.sendKeyShareNotification = (usernameFrom, usernameTo, keyName, keyContent, callback) => {
    np.createNotification(usernameTo, `${usernameFrom} sent you a key`, {
        'from': usernameFrom,
        'keyName': keyName,
        'keyContent': keyContent
    }, callback);
};
