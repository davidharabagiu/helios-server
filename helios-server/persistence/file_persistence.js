var config = require('../utils/config').config;
var metadata = require('./file_metadata_persistence');
var fs = require('fs');

var openedFiles = {};

exports.open = (username, path, readonly, callback) => {
    var cont = (id) => {
        realPath = config.storage.path + '/' + id;
        fs.open(realPath, readonly ? 'r' : 'a+', (err, fd) => {
            if (err) {
                console.log('file_persistence', err);
                callback();
                return;
            }
            openedFiles[fd] = {
                id: id,
                readonly: readonly,
                username: username
            };
            callback(fd);
        });
    };
    metadata.getStorageId(username, path, (id) => {
        if (!id) {
            if (readonly) {
                console.log('file_persistence',
                    `cannot find file ${username}:/${path}`);
                callback();
                return;
            }
            id = createFileId();
            metadata.createFile(username, id, path, false, (success) => {
                if (!success) {
                    console.log('file_persistence',
                        `cannot create file ${username}:/${path}`);
                    callback();
                    return;
                }
                cont(id);
            });
        }
        cont(id);
    });
};

exports.close = (username, fd, callback) => {
    file = openedFiles[fd];
    if (!file) {
        console.log('file_persistence', `invalid file descriptor ${fd}`);
        callback(false);
        return;
    }
    if (file.username !== username) {
        console.log('file_persistence', `${username} not allowed to access ${fd}`);
        callback(false);
        return;
    }
    fs.close(fd, (err) => {
        if (err) {
            console.log('file_persistence', err);
            callback(false);
            return;
        }
        delete openedFiles[fd];
        callback(true);
    });
};

exports.write = (username, fd, buffer, offset, length, callback) => {
    file = openedFiles[fd];
    if (!file) {
        console.log('file_persistence', `invalid file descriptor ${fd}`);
        callback(-1);
        return;
    }
    if (file.username !== username) {
        console.log('file_persistence', `${username} not allowed to access ${fd}`);
        callback(-1);
        return;
    }
    if (file.readonly) {
        console.log('file_persistence', `file descriptor ${fd} is readonly`);
        callback(-1);
        return;
    }
    fs.write(fd, buffer, 0, length, offset, (err, bytesWritten, buffer) => {
        if (err) {
            console.log('file_persistence', err);
            callback(0);
            return;
        }
        if (length !== bytesWritten) {
            console.log('file_persistence',
                `only ${bytesWritten} bytes out of ${length} were written`);
        }
        callback(bytesWritten);
    });
};

exports.read = (username, fd, buffer, offset, length, callback) => {
    file = openedFiles[fd];
    if (!file) {
        console.log('file_persistence', `invalid file descriptor ${fd}`);
        callback(-1);
        return;
    }
    if (file.username !== username) {
        console.log('file_persistence', `${username} not allowed to access ${fd}`);
        callback(-1);
        return;
    }
    fs.read(fd, buffer, 0, length, offset, (err, bytesRead, buffer) => {
        if (err) {
            console.log('file_persistence', err);
            callback(0);
            return;
        }
        if (length !== bytesRead) {
            console.log('file_persistence',
                `only ${bytesRead} bytes out of ${length} were read`);
        }
        callback(bytesRead);
    });
};

exports.delete = (username, path, callback) => {
    metadata.deleteFile(username, path, (ids) => {
        if (!ids) {
            console.log('file_persistence', `cannot delete ${username}:/${path}`);
            callback(false);
            return;
        }
        var it = (i) => {
            if (i === ids.length) {
                callback(true);
                return;
            }
            realPath = config.storage.path + '/' + ids[i];
            fd.unlink(realPath, (err) => {
                if (err) {
                    console.log('file_persistence', err);
                    callback(false);
                    return;
                }
                it(i + 1);
            });
        };
    });
};

exports.move = (username, srcPath, dstPath, callback) => {
    metadata.moveFile(username, srcPath, dstPath, (success) => {
        if (!success) {
            console.log('file_persistence',
                `cannot move ${username}:/${srcPath} to ${username}:/${dstPath}`);
        }
        callback(success);
    });
};

exports.list = (username, path, callback) => {
    metadata.listFiles(username, path, (files) => {
        if (!files && files !== []) {
            console.log('file_persistence',
                `cannot list files in ${username}:/${path}`);
        }
        callback(files);
    });
};

exports.createDirectory = (username, path, callback) => {
    metadata.createFile(username, undefined, path, true, (success) => {
        if (!success) {
            console.log('file_persistence',
                `cannot create directory ${username}:/${path}`);
        }
        callback(success);
    });
};

exports.fileExists = (username, path, callback) => {
    metadata.getStorageId(username, path, (id) => {
        callback(id ? true : false);
    });
};

exports.getSize = (username, path, callback) => {
    metadata.getStorageId(username, path, (id) => {
        if (!id) {
            console.log('file_persistence', `cannot find file ${username}:/${path}`);
            callback(-2);
            return;
        }
        if (id === 'dir') {
            console.log('file_persistence', `${username}:/${path} is a directory`);
            callback(-2);
            return;
        }
        realPath = config.storage.path + '/' + id;
        fs.stat(realPath, {
            bigint: true
        }, (err, stats) => {
            if (err) {
                console.log('file_persistence', err);
                callback(-1);
            } else {
                callback(stats.size);
            }
        });
    });
};

function createFileId() {
    const fileIdLength = config.storage.fileIdLength;
    abc = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('');
    var id = '';
    for (i = 0; i < fileIdLength; i++) {
        id += abc[Math.floor(Math.random() * abc.length)];
    }
    return id;
}

fs.access(config.storage.path, fs.constants.F_OK, (err) => {
    if (err) {
        console.log('file_persistence', 'creating file storage directory');
        fs.mkdir(config.storage.path, {
            recursive: true
        }, (err) => {
            if (err) {
                console.log('file_persistence', err);
            }
        });
    }
});
