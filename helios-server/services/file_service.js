var files = require('../persistence/file_persistence');
var users = require('../persistence/user_persistence');
var notification_sender = require('./notification_sender');
var notifications = require('../persistence/notification_persistence');
var ReadWriteLock = require('rwlock');

const Status = {
    SUCCESS: 0,
    FILE_ALREADY_EXISTS: 1,
    INVALID_PATH: 2,
    UNKNOWN_ERROR: 3,
    INVALID_TRANSFER_ID: 4,
    UNAUTHORIZED: 5,
    IO_ERROR: 6,
    INVALID_USER: 7,
    INVALID_NOTIFICATION_TYPE: 8,
    FILE_NO_LONGER_EXISTS: 9
};
Object.freeze(Status);
exports.Status = Status;

var transfers = {};

exports.mkdir = (username, path, callback) => {
    files.fileExists(username, path, (exists) => {
        if (exists) {
            callback(Status.FILE_ALREADY_EXISTS);
            return;
        }
        var cont = () => {
            files.createDirectory(username, path, (success) => {
                if (!success) {
                    callback(Status.UNKNOWN_ERROR);
                } else {
                    callback(Status.SUCCESS);
                }
            });
        };
        var split = splitPath(path);
        if (split.dir.length === 0) {
            cont();
            return;
        }
        files.fileExists(username, split.dir, (parentExists) => {
            if (!parentExists) {
                callback(Status.INVALID_PATH);
            } else {
                cont();
            }
        });
    });
};

exports.beginUpload = (username, path, callback) => {
    var cont = () => {
        files.open(username, path, false, (fd) => {
            if (!fd) {
                callback(Status.IO_ERROR);
                return;
            }
            var transferId = createTransferId();
            var transfer = {
                fd: fd,
                username: username,
                mode: 0,
                lock: new ReadWriteLock()
            }
            transfers[transferId] = transfer;
            callback(Status.SUCCESS, transferId);
        });
    };
    var split = splitPath(path);
    if (split.dir.length === 0) {
        cont();
        return;
    }
    files.fileExists(username, split.dir, (parentExists) => {
        if (!parentExists) {
            callback(Status.INVALID_PATH);
        } else {
            cont();
        }
    });
}

exports.beginDownload = (username, path, callback) => {
    files.fileExists(username, path, (exists) => {
        if (!exists) {
            callback(Status.INVALID_PATH);
            return;
        }
        files.open(username, path, true, (fd) => {
            if (!fd) {
                callback(Status.IO_ERROR);
                return;
            }
            transferId = createTransferId();
            var transfer = {
                fd: fd,
                username: username,
                mode: 1,
                lock: new ReadWriteLock()
            }
            transfers[transferId] = transfer;
            callback(Status.SUCCESS, transferId);
        });
    });
}

exports.upload = (username, transferId, buffer, offset, length, callback) => {
    transfer = transfers[transferId];
    if (!transfer || transfer.mode !== 0) {
        callback(Status.INVALID_TRANSFER_ID);
        return;
    }
    if (transfer.username !== username) {
        callback(Status.UNAUTHORIZED);
        return;
    }
    transfer.lock.writeLock((release) => {
        files.write(username, transfer.fd, buffer, offset, length, (written) => {
            release();
            if (written === -1) {
                callback(Status.UNKNOWN_ERROR);
            } else if (written < length) {
                callback(Status.IO_ERROR, written);
            } else {
                callback(Status.SUCCESS, written);
            }
        });
    });
};

exports.download = (username, transferId, buffer, offset, length, callback) => {
    transfer = transfers[transferId];
    if (!transfer || transfer.mode !== 1) {
        callback(Status.INVALID_TRANSFER_ID);
        return;
    }
    if (transfer.username !== username) {
        callback(Status.UNAUTHORIZED);
        return;
    }
    transfer.lock.readLock((release) => {
        files.read(username, transfer.fd, buffer, offset, length, (bytesRead) => {
            release();
            if (bytesRead === -1) {
                callback(Status.UNKNOWN_ERROR);
            } else {
                callback(Status.SUCCESS, bytesRead);
            }
        });
    });
};

exports.endTransfer = (username, transferId, callback) => {
    transfer = transfers[transferId];
    if (!transfer) {
        callback(Status.INVALID_TRANSFER_ID);
        return;
    }
    if (transfer.username !== username) {
        callback(Status.UNAUTHORIZED);
        return;
    }
    transfer.lock.writeLock((release) => {
        files.close(username, transfer.fd, (success) => {
            release();
            if (!success) {
                callback(Status.IO_ERROR);
            } else {
                delete transfers[transferId];
                callback(Status.SUCCESS);
            }
        });
    });
};

exports.size = (username, path, callback) => {
    files.fileExists(username, path, (exists) => {
        if (!exists) {
            callback(Status.INVALID_PATH);
            return;
        }
        files.getSize(username, path, (size) => {
            if (size === -2) {
                callback(Status.UNKNOWN_ERROR);
            } else if (size === -1) {
                callback(Status.IO_ERROR);
            } else {
                callback(Status.SUCCESS, size);
            }
        });
    });
};

exports.list = (username, path, callback) => {
    files.fileExists(username, path, (exists) => {
        if (!exists) {
            callback(Status.INVALID_PATH);
            return;
        }
        files.isDirectory(username, path, (dir) => {
            if (!dir) {
                callback(Status.INVALID_PATH);
                return;
            }
            files.list(username, path, (files) => {
                if (!files) {
                    callback(Status.UNKNOWN_ERROR);
                } else {
                    callback(Status.SUCCESS, files);
                }
            });
        });
    });
};

exports.delete = (username, path, callback) => {
    files.fileExists(username, path, (exists) => {
        if (!exists) {
            callback(Status.INVALID_PATH);
            return;
        }
        files.delete(username, path, (success) => {
            callback(success ? Status.SUCCESS : Status.UNKNOWN_ERROR);
        });
    });
};

exports.move = (username, src, dst, callback) => {
    files.fileExists(username, src, (srcExists) => {
        if (!srcExists) {
            callback(Status.INVALID_PATH);
            return;
        }
        files.fileExists(username, dst, (dstExists) => {
            if (dstExists) {
                callback(Status.FILE_ALREADY_EXISTS);
                return;
            }
            files.move(username, src, dst, (success) => {
                callback(success ? Status.SUCCESS : Status
                    .UNKNOWN_ERROR);
            });
        });
    });
};

exports.isDir = (username, path, callback) => {
    files.isDirectory(username, path, (dir) => {
        if (dir === undefined) {
            callback(Status.UNKNOWN_ERROR);
        } else if (!dir) {
            callback(Status.SUCCESS, false);
        } else {
            callback(Status.SUCCESS, dir);
        }
    });
};

exports.shareFile = (username, usernameTo, path, callback) => {
    files.fileExists(username, path, (exists) => {
        if (!exists) {
            callback(Status.INVALID_PATH);
            return;
        }
        files.isDirectory(username, path, (dir) => {
            if (dir) {
                callback(Status.INVALID_PATH);
                return;
            }
            users.findUser(usernameTo, (userTo) => {
                if (!userTo) {
                    callback(Status.INVALID_USER);
                    return;
                }
                var separator = path.lastIndexOf('/');
                var fileName = '';
                if (separator === -1) {
                    fileName = path;
                } else {
                    fileName = path.substring(separator + 1, path.length);
                }
                notification_sender.sendFileShareNotification(username, usernameTo,
                    fileName, path, (success) => {
                        callback(success ? Status.SUCCESS : Status
                            .UNKNOWN_ERROR);
                    });
            });
        });
    });
};

exports.shareKey = (username, usernameTo, keyName, keyLength, keyContent, callback) => {
    users.findUser(usernameTo, (userTo) => {
        if (!userTo) {
            callback(Status.INVALID_USER);
            return;
        }
        notification_sender.sendKeyShareNotification(username, usernameTo,
            keyName, keyLength, keyContent, (success) => {
                callback(success ? Status.SUCCESS : Status
                    .UNKNOWN_ERROR);
            });
    });
};

exports.getSharedKey = (username, notificationId, callback) => {
    users.findUser(username, (user) => {
        if (!user) {
            callback(Status.UNKNOWN_ERROR);
            return;
        }
        notifications.getNotification(notificationId, (notification) => {
            if (notification.userId.toHexString() !== user._id.toHexString()) {
                callback(Status.UNAUTHORIZED);
            } else if (!notification.data.keyName) {
                callback(Status.INVALID_NOTIFICATION_TYPE);
            } else {
                callback(Status.SUCCESS, {
                    name: notification.data.keyName,
                    length: Number(notification.data.keyLength),
                    content: notification.data.keyContent
                });
            }
        });
    });
};

exports.acceptSharedFile = (username, notificationId, path, callback) => {
    var cont = (usernameFrom, pathFrom, usernameTo, pathTo) => {
        files.createLink(usernameFrom, pathFrom, usernameTo, pathTo, (success) => {
            if (success) {
                callback(Status.SUCCESS);
            } else {
                callback(Status.UNKNOWN_ERROR);
            }
        });
    };
    users.findUser(username, (user) => {
        if (!user) {
            callback(Status.UNKNOWN_ERROR);
            return;
        }
        notifications.getNotification(notificationId, (notification) => {
            if (notification.userId.toHexString() !== user._id.toHexString()) {
                callback(Status.UNAUTHORIZED);
            } else if (!notification.data.path) {
                callback(Status.INVALID_NOTIFICATION_TYPE);
            } else {
                users.findUser(notification.data.from, (usernameFrom) => {
                    if (!usernameFrom) {
                        callback(Status.INVALID_USER);
                        return;
                    }
                    files.fileExists(notification.data.from, notification.data.path, (exists) => {
                        if (!exists) {
                            callback(Status.FILE_NO_LONGER_EXISTS);
                            return;
                        }
                        files.fileExists(username, path, (exists) => {
                            if (exists) {
                                callback(Status.FILE_ALREADY_EXISTS);
                                return;
                            }
                            var separator = path.lastIndexOf('/');
                            if (separator === -1) {
                                cont(notification.data.from, notification.data.path, username, path);
                            } else {
                                files.isDirectory(username, path.substring(0, separator), (toIsDir) => {
                                    if (!toIsDir) {
                                        callback(Status.INVALID_PATH);
                                        return;
                                    }
                                    cont(notification.data.from, notification.data.path, username,
                                        path);
                                });
                            }
                        });
                    });
                });
            }
        });
    });
};

function createTransferId(path) {
    var transferId;
    do {
        transferId = Math.floor(Math.random() * 1000000000);
    } while (transfers[transferId] !== undefined);
    return transferId;
}

function splitPath(path) {
    if (path[path.length - 1] === '/') {
        path = path.substring(0, path.length - 1);
    }
    var separator = path.lastIndexOf('/');
    var result = {
        dir: (separator === -1) ? '' : path.substring(0, separator),
        file: (separator === -1) ? path : path.substring(separator + 1, path.length)
    };
    return result;
}
