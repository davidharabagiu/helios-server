var db_access = require('./db_access');
var config = require('../utils/config').config;
var ObjectID = require('mongodb').ObjectID;

const dbName = config.database.name;
const usersCollection = config.database.collections.users;
const filesCollection = config.database.collections.files;

exports.createRoot = (callback) => {
    db_access.connect((db) => {
        dbo = db.db(dbName);
        newFile = {
            name: '',
            isDir: true,
            children: [],
            storageId: 'dir'
        };
        dbo.collection(filesCollection).insertOne(newFile, (err, res) => {
            db.close();
            if (err) {
                console.log('file_metadata_persistence', err);
                callback();
                return;
            }
            callback(res.insertedId);
        });
    });
};

exports.createFile = (username, storageId, path, isDir, callback) => {
    findRoot(username, (rootId) => {
        if (!rootId) {
            console.log('file_metadata_persistence',
                `cannot find root folder for user ${username}`);
            callback(false);
            return;
        }
        createFileFromPath(rootId, storageId, path, isDir, [], (success) => {
            if (!success) {
                console.log('file_metadata_persistence',
                    `cannot create file ${username}:/${path}`);
            }
            callback(success);
        });
    });
};

exports.deleteFile = (username, path, callback) => {
    findRoot(username, (rootId) => {
        if (!rootId) {
            console.log('file_metadata_persistence',
                `cannot find root folder for user ${username}`);
            callback();
            return;
        }
        findFile(rootId, path, (parentId, fileId) => {
            if (!fileId) {
                console.log('file_metadata_persistence',
                    `cannot find file ${username}:/${path}`);
                callback();
                return;
            }
            deleteFileOrDirectory(parentId, fileId, (storageIds) => {
                callback(storageIds);
            });
        });
    });
};

exports.listFiles = (username, path, callback) => {
    findRoot(username, (rootId) => {
        if (!rootId) {
            console.log('file_metadata_persistence',
                `cannot find root folder for user ${username}`);
            callback();
            return;
        }
        findFile(rootId, path, (parentId, fileId) => {
            if (!fileId) {
                console.log('file_metadata_persistence',
                    `cannot find file ${username}:/${path}`);
                callback();
                return;
            }
            listFiles(fileId, (files) => {
                callback(files);
            });
        });
    });
};

exports.moveFile = (username, srcPath, dstPath, callback) => {
    findRoot(username, (rootId) => {
        if (!rootId) {
            console.log('file_metadata_persistence',
                `cannot find root folder for user ${username}`);
            callback(false);
            return;
        }
        findFile(rootId, srcPath, (parentId, fileId) => {
            if (!fileId) {
                console.log('file_metadata_persistence',
                    `cannot find file ${username}:/${path}`);
                callback(false);
                return;
            }
            if (!parentId) {
                console.log('file_metadata_persistence',
                    `cannot move ${username}:/${srcPath}`);
                callback(false);
                return;
            }
            db_access.connect((db) => {
                dbo = db.db(dbName);
                dbo.collection(filesCollection).findOne({
                    _id: fileId
                }, {}, (err, res) => {
                    db.close();
                    if (err) {
                        console.log('file_metadata_persistence',
                            err);
                        callback(false);
                        return;
                    }
                    isDir = res.isDir;
                    storageId = res.storageId;
                    children = res.children;
                    deleteFile(parentId, fileId, (success) => {
                        if (!success) {
                            console.log(
                                'file_metadata_persistence',
                                `cannot delete ${username}:/${srcPath}`
                            );
                            callback(false);
                            return;
                        }
                        createFileFromPath(rootId,
                            storageId, dstPath,
                            isDir, children, (
                                success) => {
                                if (!success) {
                                    console.log(
                                        'file_metadata_persistence',
                                        `cannot create file ${username}:/${dstPath}`
                                    );
                                }
                                callback(success);
                            });
                    });
                });
            });
        });
    });
};

exports.getStorageId = (username, path, callback) => {
    findRoot(username, (rootId) => {
        if (!rootId) {
            console.log('file_metadata_persistence',
                `cannot find root folder for user ${username}`);
            callback();
            return;
        }
        findFile(rootId, path, (parentId, childId) => {
            db_access.connect((db) => {
                dbo = db.db(dbName);
                dbo.collection(filesCollection).findOne({
                    _id: childId
                }, (err, res) => {
                    db.close();
                    if (err) {
                        console.log('file_metadata_persistence',
                            err);
                        callback();
                        return;
                    }
                    if (!res) {
                        callback();
                        return;
                    }
                    callback(res.storageId);
                });
            });
        });
    });
};

exports.isDirectory = (username, path, callback) => {
    findRoot(username, (rootId) => {
        if (!rootId) {
            console.log('file_metadata_persistence',
                `cannot find root folder for user ${username}`);
            callback();
            return;
        }
        findFile(rootId, path, (parentId, childId) => {
            db_access.connect((db) => {
                dbo = db.db(dbName);
                dbo.collection(filesCollection).findOne({
                    _id: childId
                }, (err, res) => {
                    db.close();
                    if (err) {
                        console.log('file_metadata_persistence',
                            err);
                        callback();
                        return;
                    }
                    if (!res) {
                        callback(false);
                        return;
                    }
                    callback(res.isDir);
                });
            });
        });
    });
};

function listFiles(dirId, callback) {
    db_access.connect((db) => {
        dbo = db.db(dbName);
        dbo.collection(filesCollection).findOne({
            _id: dirId
        }, (err, res) => {
            db.close();
            if (err) {
                console.log('file_metadata_persistence', err);
                callback();
                return;
            }
            if (!res.isDir) {
                console.log('file_metadata_persistence',
                    `${dirId} is not a directory`);
                callback();
                return;
            }
            var fileList = [];
            for (var i = 0; i < res.children.length; ++i) {
                fileList.push({
                    name: res.children[i].name,
                    isDir: res.children[i].isDir
                });
            }
            callback(fileList);
        });
    });
}

function createFile(parentId, storageId, name, isDir, children, callback) {
    db_access.connect((db) => {
        dbo = db.db(dbName);
        newFile = {
            name: name,
            isDir: isDir
        };
        if (isDir) {
            newFile.children = children;
            newFile.storageId = 'dir';
        } else {
            newFile.storageId = storageId;
        }
        dbo.collection(filesCollection).insertOne(newFile, (err, res) => {
            if (err) {
                console.log('file_metadata_persistence', err);
                callback(false);
                return;
            }
            var newChild = {
                childId: res.insertedId,
                name: name,
                isDir: isDir
            };
            dbo.collection(filesCollection).updateOne({
                _id: ObjectID(parentId)
            }, {
                $push: {
                    children: newChild
                }
            }, {}, (err, res) => {
                db.close();
                if (err) {
                    console.log('file_metadata_persistence', err);
                    callback(false);
                    return;
                }
                callback(true);
            });
        });
    });
}

function createFileFromPath(rootId, storageId, path, isDir, children, callback) {
    var separator = path.lastIndexOf('/');
    if (separator === -1) {
        createFile(rootId, storageId, path, isDir, children, (success) => {
            if (!success) {
                console.log('file_metadata_persistence',
                    `cannot create file ${rootId}:/${path}`);
            }
            callback(success);
        });
    } else {
        var dirName = path.substring(0, separator);
        var fileName = path.substring(separator + 1, path.length);
        findFile(rootId, dirName, function(parentId, dirId) {
            if (!dirId) {
                console.log('file_metadata_persistence',
                    `cannot find file ${rootId}:/${path}`);
                callback(false);
                return;
            }
            db_access.connect(function(db) {
                dbo = db.db(dbName);
                dbo.collection(filesCollection).findOne({
                    _id: dirId
                }, {}, (err, res) => {
                    db.close();
                    if (!res.isDir) {
                        console.log('file_metadata_persistence',
                            `${rootId}:/${dirId} is not a directory`);
                        callback(false);
                        return;
                    }
                    createFile(dirId, storageId, fileName, isDir, children,
                        function(success) {
                            if (!success) {
                                console.log('file_metadata_persistence',
                                    `cannot create file ${rootId}:/${path}`
                                );
                            }
                            callback(success);
                        });
                })
            });
        });
    }
}

function deleteFileOrDirectory(parentId, id, callback) {
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        dbo.collection(filesCollection).findOne({
            _id: id
        }, {}, (err, res) => {
            db.close();
            if (err) {
                console.log('file_metadata_persistence', err);
                callback();
                return;
            } else {
                if (res.isDir) {
                    emptyDirectory(id, (storageIds) => {
                        if (!storageIds && storageIds !== []) {
                            console.log('file_metadata_persistence',
                                `cannot empty directory ${id}`);
                            callback();
                            return;
                        }
                        if (res.name !== '') {
                            deleteFile(parentId, id, (storageId) => {
                                if (!storageId) {
                                    console.log(
                                        'file_metadata_persistence',
                                        `cannot delete file ${id}`
                                    );
                                    callback();
                                    return;
                                }
                                callback(storageIds);
                            });
                        } else {
                            console.log('file_metadata_persistence',
                                `cannot delete root ${id}`);
                            callback(storageIds);
                        }
                    });
                } else {
                    deleteFile(parentId, id, (storageId) => {
                        if (!storageId) {
                            console.log('file_metadata_persistence',
                                `cannot delete file ${id}`);
                            callback();
                            return;
                        }
                        callback(storageId === 'dir' ? [] : [storageId]);
                    });
                }
            }
        });
    });
}

function deleteFile(parentId, id, callback) {
    db_access.connect((db) => {
        dbo = db.db(dbName);
        dbo.collection(filesCollection).findOne({
            _id: id
        }, (err, res) => {
            if (err) {
                console.log('file_metadata_persistence', err);
                callback();
                return;
            }
            if (!res) {
                console.log('file_metadata_persistence', `cannot find file ${id}`);
                callback();
                return;
            }
            var storageId = res.isDir ? 'dir' : res.storageId;
            dbo.collection(filesCollection).deleteOne({
                _id: id
            }, {}, (err, res) => {
                if (err) {
                    console.log('file_metadata_persistence', err);
                    callback();
                    return;
                }
                dbo.collection(filesCollection).findOne({
                    _id: parentId
                }, (err, res) => {
                    if (err) {
                        console.log('file_metadata_persistence',
                            err);
                        callback();
                        return;
                    }
                    if (!res) {
                        console.log('file_metadata_persistence',
                            `cannot find file ${parentId}`);
                        callback();
                        return;
                    }
                    dbo.collection(filesCollection).updateOne({
                        _id: parentId
                    }, {
                        $pull: {
                            children: {
                                childId: id
                            }
                        }
                    }, {}, (err, res) => {
                        db.close();
                        if (err) {
                            console.log(
                                'file_metadata_persistence',
                                err);
                            callback();
                            return;
                        }
                        callback(storageId);
                    });
                });
            });
        });
    });
}

function emptyDirectory(dirId, callback) {
    db_access.connect((db) => {
        dbo = db.db(dbName);
        dbo.collection(filesCollection).findOne({
            _id: dirId
        }, {}, (err, res) => {
            db.close();
            if (err) {
                console.log('file_metadata_persistence', err);
                callback();
                return;
            }
            if (!res.isDir) {
                console.log('file_metadata_persistence',
                    `${dirId} is not a directory`);
                callback();
                return;
            }
            var storageIds = [];
            var it = (i) => {
                if (i === res.children.length) {
                    callback(storageIds);
                    return;
                }
                deleteFileOrDirectory(dirId, res.children[i].childId, (ids) => {
                    if (!ids) {
                        console.log('file_metadata_persistence',
                            `cannot delete file ${res.children[i].childId}`
                        );
                        callback();
                        return;
                    }
                    if (ids !== 'dir') {
                        storageIds = storageIds.concat(ids);
                    }
                    it(i + 1);
                });
            }
            it(0);
        });
    });
}

function findRoot(username, callback) {
    db_access.connect((db) => {
        dbo = db.db(dbName);
        dbo.collection(usersCollection).findOne({
            username: username
        }, (err, res) => {
            db.close();
            if (err) {
                console.log('file_metadata_persistence', err);
                callback();
                return;
            }
            if (!res) {
                console.log('file_metadata_persistence',
                    `cannot find user ${user}`);
                callback();
                return;
            }
            callback(res.files);
        });
    });
}

function findFile(parentId, path, callback) {
    if (path[path.length - 1] === '/') {
        path = path.substring(0, path.length - 1);
    }
    if (path === '') {
        callback(undefined, parentId);
        return;
    }
    db_access.connect((db) => {
        dbo = db.db(dbName);
        var separator = path.indexOf('/');
        var currentFile = separator === -1 ? path : path.substring(0, separator);
        path = separator === -1 ? '' : path.substring(separator + 1, path.length);
        dbo.collection(filesCollection).findOne({
            _id: ObjectID(parentId)
        }, (err, res) => {
            db.close();
            if (err) {
                console.log('file_metadata_persistence', err);
                callback();
                return;
            }
            if (!res) {
                console.log('file_metadata_persistence',
                    `cannot find file ${parentId}:/${path}`);
                callback();
                return;
            }
            if (!res.isDir) {
                console.log('file_metadata_persistence',
                    `${parentId}:/${path} is not a directory`);
                callback();
                return;
            }
            for (var i = 0; i < res.children.length; ++i) {
                if (res.children[i].name === currentFile) {
                    if (path === '') {
                        callback(parentId, res.children[i].childId);
                    } else {
                        findFile(res.children[i].childId, path, callback);
                    }
                    return;
                }
            }
            callback();
        });
    });
}
