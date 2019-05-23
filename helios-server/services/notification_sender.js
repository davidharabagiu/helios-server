var np = require('../persistence/notification_persistence');

exports.sendFileShareNotification = (usernameFrom, usernameTo, fileName, path, callback) => {
    np.createNotification(usernameTo, `${usernameFrom} sent you ${fileName}`, {
        'from': usernameFrom,
        'path': path
    }, callback);
};

exports.sendKeyShareNotification = (usernameFrom, usernameTo, keyName, keyLength, keyContent, callback) => {
    np.createNotification(usernameTo, `${usernameFrom} sent you a key`, {
        'from': usernameFrom,
        'keyName': keyName,
        'keyLength': keyLength,
        'keyContent': keyContent
    }, callback);
};
