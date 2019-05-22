var config = require('../utils/config').config;
var metadata = require('./file_metadata_persistence');
var fs = require('fs');

var openedFiles = {};

exports.open = (username, path, readonly, callback) => {
    var cont = (location) => {
        realPath = config.storage.path + '/' + location;
        fs.open(realPath, readonly ? 'r' : 'w+', (err, fd) => {
            if (err) {
                console.log('file_persistence', err);
                callback();
                return;
            }
            openedFiles[fd] = {
                location: location,
                readonly: readonly,
                username: username
            };
            callback(fd);
        });
    };
    metadata.getLocation(username, path, (location) => {
        if (!location) {
            if (readonly) {
                console.log('file_persistence',
                    `cannot find file ${username}:/${path}`);
                callback();
                return;
            }
            location = createFileId();
            metadata.createFile(username, location, path, false, (success) => {
                if (!success) {
                    console.log('file_persistence',
                        `cannot create file ${username}:/${path}`);
                    callback();
                    return;
                }
                cont(location);
            });
        } else {
            cont(location);
        }
    });
};

exports.close = (username, fd, callback) => {
    var file = openedFiles[fd];
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
    metadata.deleteFile(username, path, (locations) => {
        if (!locations) {
            console.log('file_persistence', `cannot delete ${username}:/${path}`);
            callback(false);
            return;
        }
        var it = (i) => {
            if (i === locations.length) {
                callback(true);
                return;
            }
            realPath = config.storage.path + '/' + locations[i];
            fs.unlink(realPath, (err) => {
                if (err) {
                    console.log('file_persistence', err);
                    callback(false);
                    return;
                }
                it(i + 1);
            });
        };
        it(0);
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
            callback(['INVALID_PATH']);
            return;
        }
        var filesWithSizeInfo = [];
        var it = (idx) => {
            if (idx === files.length) {
                callback(filesWithSizeInfo);
                return;
            }
            if (files[idx].isDir) {
                filesWithSizeInfo.push(files[idx]);
                it(idx + 1);
            } else {
                exports.getSize(username, (path === '') ? (files[idx].name) : (
                    path +
                    '/' + files[idx].name), (size) => {
                    if (size < 0) {
                        callback([]);
                    } else {
                        filesWithSizeInfo.push({
                            name: files[idx].name,
                            isDir: files[idx].isDir,
                            size: String(size)
                        });
                        it(idx + 1);
                    }
                });
            }
        };
        it(0);
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
    metadata.fileExists(username, path, callback);
};

exports.getFileId = (username, path, callback) => {
    metadata.getFileId(username, path, (id) => {
        callback(id);
    });
};

exports.getSize = (username, path, callback) => {
    metadata.getLocation(username, path, (location) => {
        if (!location) {
            console.log('file_persistence', `cannot find file ${username}:/${path}`);
            callback(-2);
            return;
        }
        realPath = config.storage.path + '/' + location;
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

exports.isDirectory = (username, path, callback) => {
    metadata.isDirectory(username, path, (dir) => {
        callback(dir);
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
