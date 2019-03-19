var db_access = require('./db_access');
var config = require('../utils/config').config;

const dbName = config.database.name;
const usersCollection = config.database.collections.users;
const filesCollection = config.database.collections.files;

exports.createRoot = function(callback) {
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        newFile = {
            name: '',
            isDir: true,
            children: []
        };
        dbo.collection(filesCollection).insertOne(newFile, function(err, res) {
            db.close();
            if (err) {
                console.log('file_db_persistence', err);
                callback();
            } else {
                callback(insertedId);
            }
        });
    });
}

exports.createFile = function(username, storageId, path, isDir, callback) {
    findRoot(username, function(rootId) {
        if (!rootId) {
            callback(false);
            return;
        }
        createFileFromPath(rootId, storageId, path, isDir, [], success) {
            callback(success);
        }
    });
}

exports.deleteFile = function(username, path, callback) {
    findRoot(username, function(rootId) {
        if (!rootId) {
            callback(false);
            return;
        }
        findFile(rootId, path, function(parentId, fileId) {
            if (!parentId || !fileId) {
                callback(false);
                return;
            }
            deleteFileOrDirectory(parentId, fileId, function(success) {
                callback(success);
            });
        });
    });
}

exports.listFiles = function(username, path, callback) {
    findRoot(username, function(rootId) {
        if (!rootId) {
            callback(false);
            return;
        }
        findFile(rootId, path, function(parentId, fileId) {
            if (!fileId) {
                callback(false);
                return;
            }
            listFiles(fileId, function(files) {
                callback(files);
            });
        });
    });
}

exports.moveFile = function(username, srcPath, dstPath, callback) {
    findRoot(username, function(rootId) {
        if (!rootId) {
            callback(false);
            return;
        }
        findFile(rootId, srcPath, function(parentId, fileId) {
            if (!parentId || !fileId) {
                callback(false);
                return;
            }
            dbo.collection(filesCollection).findOne({ _id: fileId }, {}, function(err, res) {
                if (err) {
                    callback(false);
                    return;
                }
                isDir = res.isDir;
                storageId = res.storageId;
                children = res.children;
                deleteFileOrDirectory(parentId, fileId, function(success) {
                    if (!success) {
                        callback(false);
                        return;
                    }
                    createFileFromPath(rootId, storageId, dstPath, isDir, children, function(success) {
                        callback(success);
                    });
                });
            });
        });
    });
}

function listFiles(dirId, callback) {
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        dbo.collection(filesCollection).findOne({ _id: dirId }, function(err, res) {
            db.close();
            if (err) {
                console.log('file_db_persistence', err);
                callback();
            } else {
                fileList = [];
                for (var i = 0; i < res.children.length; ++i) {
                    fileList += res.children[i].name;
                }
                callback(fileList);
            }
        });
    });
}

function createFile(parentId, storageId, name, isDir, children, callback) {
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        newFile = {
            name: name,
            isDir: isDir
        };
        if (isDir) {
            newFile.children = children;
        } else {
            newFile.storageId = storageId;
        }
        dbo.collection(filesCollection).insertOne(newFile, function(err, res) {
            if (err) {
                console.log('file_db_persistence', err);
                callback(false);
            } else {
                var newChild = {
                    childId: res.insertedId,
                    name: name
                };
                dbo.collection(filesCollection).updateOne({ _id: parentId },
                    { $push: { newChild } }, {}, function(err, res) {
                        db.close();
                        if (err) {
                            console.log('file_db_persistence', err);
                            callback(false);
                        } else {
                            callback(true);
                        }
                    }
                );
            }
        });
    });
}

function createFileFromPath(rootId, storageId, path, isDir, children, callback) {
    var separator = path.lastIndexOf('/');
    if (separator === -1) {
        createFile(rootId, storageId, path, isDir, children, function(success) {
            callback(success);
        });
    } else {
        var dirName = path.substring(0, separator);
        var fileName = path.substring(separator + 1, path.length);
        findFile(rootId, dirName, function(parentId, dirId) {
            if (!dirId) {
                callback(false);
                return;
            }
            createFile(dirId, storageId, fileName, isDir, children, function(success) {
                callback(success);
            });
        });
    }
}

function deleteFileOrDirectory(parentId, id, callback) {
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        dbo.collection(filesCollection).findOne({ _id: id }, {}, function(err, res) {
            db.close();
            if (err) {
                console.log('file_db_persistence', err);
                callback(false);
            } else {
                if (res.isDir) {
                    emptyDirectory(id, function(success) {
                        if (!success) {
                            callback(false);
                        } else {
                            deleteFile(parentId, id, function(success) {
                                callback(success);
                            });
                        }
                    });
                } else {
                    deleteFile(parentId, id, function(success) {
                        callback(success);
                    });
                }
            }
        });
    });
}

function deleteFile(parentId, id, callback) {
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        dbo.collection(filesCollection).deleteOne({ _id: id }, {}, function(err, res) {
            if (err) {
                console.log('file_db_persistence', err);
                callback(false);
            } else {
                dbo.collection(filesCollection).findOne({ _id: id }, function(err, res) {
                    if (err) {
                        console.log('file_db_persistence', err);
                        callback(false);
                    } else {
                        dbo.collection(filesCollection).updateOne({ _id: parentId },
                            { $pull: { children: { childId: id } } }, {}, function(err, res) {
                                db.close(false);
                                if (err) {
                                    console.log('file_db_persistence', err);
                                    callback(false);
                                } else {
                                    callback(true);
                                }
                            }
                        );
                    }
                });
            }
        });
    });
}

function emptyDirectory(dirId, callback) {
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        dbo.collection(filesCollection).findOne({ _id: id }, {}, function(err, res) {
            db.close();
            if (err) {
                console.log('file_db_persistence', err);
                callback(false);
            } else {
                if (!res.isDir) {
                    callback(false);
                } else {
                    var it = function(i) {
                        if (i === res.children.length) {
                            callback(true);
                        } else {
                            deleteFileOrDirectory(dirId, res.children[i].childId, function(success) {
                                if (!success) {
                                    callback(false);
                                } else {
                                    it(i + 1);
                                }
                            });
                        }
                    }
                    it(0);
                }
            }
        });
    });
}

function findRoot(username, callback) {
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        dbo.collection(usersCollection).findOne({ username: username }, function(err, res) {
            db.close();
            if (err) {
                console.log('file_db_persistence', err);
                callback();
            } else {
                callback(res.rootId);
            }
        });
    });
}

function findFile(parentId, path, callback) {
    if (path[path.length - 1] === '/') {
        path = path.substring(0, path.length - 1);
    }
    if (path === '') {
        callback(undefined, parentId);
    }
    db_access.connect(function(db) {
        dbo = db.db(dbName);
        var separator = path.indexOf('/');
        var currentFile = separator === -1 ? path : path.substring(0, separator);
        path = separator === -1 ? '' : path.substring(separator + 1, path.length);
        dbo.collection(filesCollection).findOne({ _id: parentId }, function(err, res) {
            db.close();
            if (err) {
                console.log('file_db_persistence', err);
                callback();
            } else {
                if (!res.isDir) {
                    callback();
                    return;
                }
                for (var i = 0; i < res.children.length; ++i) {
                    if (res.children[i].name === currentFile) {
                        if (path === '') {
                            callback(parentId, res.children[i].childId);
                        } else {
                            findFile(parentId, path, callback);
                        }
                        return;
                    }
                }
                callback();
            }
        });
    });
}
