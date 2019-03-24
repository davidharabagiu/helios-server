var files = require('../persistence/file_persistence');
var rwlock = require('rwlock');

const Status = {
    SUCCESS = 0,
    FILE_ALREADY_EXISTS = 1,
    INVALID_PATH = 2,
    UNKNOWN_ERROR = 3,
    INVALID_TRANSFER_ID = 4,
    UNAUTHORIZED = 5,
    IO_ERROR = 6
};

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
        exports.read(username, transfer.fd, buffer, offset, length, (bytesRead) => {
            release();
            if (bytesRead === -1) {
                callback(Status.UNKNOWN_ERROR);
            } else if (bytesRead < length) {
                callback(Status.IO_ERROR, bytesRead);
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
        files.close(username, fd, (success) => {
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
    files.fileExists(username, split.dir, (exists) => {
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
