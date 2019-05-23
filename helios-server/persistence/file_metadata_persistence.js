var db_access = require('./db_access');
var config = require('../utils/config').config;
var ObjectID = require('mongodb').ObjectID;

const dbName = config.database.name;
const usersCollection = config.database.collections.users;
const filesCollection = config.database.collections.files;
const storagesCollection = config.database.collections.storages;

exports.createRoot = (callback) => {
    db_access.connect((db) => {
        dbo = db.db(dbName);
        newFile = {
            name: '',
            isDir: true,
            children: []
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

exports.createFile = (username, location, path, isDir, callback) => {
    findRoot(username, (rootId) => {
        if (!rootId) {
            console.log('file_metadata_persistence',
                `cannot find root folder for user ${username}`);
            callback(false);
            return;
        }
        createFileFromPath(rootId, location, path, isDir, [], undefined, (success) => {
            if (!success) {
                console.log('file_metadata_persistence', `cannot create file ${username}:/${path}`);
            }
            callback(success);
        });
    });
};

exports.createLink = (username, path, username2, path2, callback) => {
    findRoot(username, (rootId) => {
        if (!rootId) {
            callback(false);
            return;
        }
        findFile(rootId, path, (parentId, fileId) => {
            if (!fileId) {
                callback(false);
                return;
            }
            db_access.connect((db) => {
                dbo = db.db(dbName);
                dbo.collection(filesCollection).findOne({
                    _id: fileId
                }, (err, res) => {
                    if (err || !res) {
                        callback(false);
                        return;
                    }
                    var storageId = res.storageId;
                    findRoot(username2, (rootId2) => {
                        if (!rootId2) {
                            callback(false);
                            return;
                        }
                        createFileFromPath(rootId2, undefined, path2, false, [], storageId, (success) => {
                            if (!success) {
                                callback(false);
                                return;
                            }
                            dbo.collection(storagesCollection).updateOne({
                                _id: storageId
                            }, {
                                $inc: {
                                    refcount: 1
                                }
                            }, (err, res) => {
                                db.close();
                                callback(err ? false : true);
                            });
                        });
                    });
                });
            });
        });
    });
};

exports.deleteFile = (username, path, callback) => {
    findRoot(username, (rootId) => {
        if (!rootId) {
            console.log('file_metadata_persistence', `cannot find root folder for user ${username}`);
            callback();
            return;
        }
        findFile(rootId, path, (parentId, fileId) => {
            if (!fileId) {
                console.log('file_metadata_persistence', `cannot find file ${username}:/${path}`);
                callback();
                return;
            }
            deleteFileOrDirectory(parentId, fileId, (locations) => {
                callback(locations);
            });
        });
    });
};

exports.listFiles = (username, path, callback) => {
    findRoot(username, (rootId) => {
        if (!rootId) {
            console.log('file_metadata_persistence', `cannot find root folder for user ${username}`);
            callback();
            return;
        }
        findFile(rootId, path, (parentId, fileId) => {
            if (!fileId) {
                console.log('file_metadata_persistence', `cannot find file ${username}:/${path}`);
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
            console.log('file_metadata_persistence', `cannot find root folder for user ${username}`);
            callback(false);
            return;
        }
        findFile(rootId, srcPath, (parentId, fileId) => {
            if (!fileId) {
                console.log('file_metadata_persistence', `cannot find file ${username}:/${path}`);
                callback(false);
                return;
            }
            if (!parentId) {
                console.log('file_metadata_persistence', `cannot move ${username}:/${srcPath}`);
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
                        console.log('file_metadata_persistence', err);
                        callback(false);
                        return;
                    }
                    isDir = res.isDir;
                    storageId = res.storageId;
                    children = res.children;
                    deleteFile(parentId, fileId, true, () => {
                        createFileFromPath(rootId, undefined, dstPath, isDir, children, storageId, (
                            success) => {
                            if (!success) {
                                console.log('file_metadata_persistence',
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

exports.getLocation = (username, path, callback) => {
    findRoot(username, (rootId) => {
        if (!rootId) {
            console.log('file_metadata_persistence', `cannot find root folder for user ${username}`);
            callback();
            return;
        }
        findFile(rootId, path, (parentId, childId) => {
            db_access.connect((db) => {
                dbo = db.db(dbName);
                dbo.collection(filesCollection).findOne({
                    _id: childId
                }, (err, res) => {
                    if (err) {
                        console.log('file_metadata_persistence', err);
                        callback();
                        return;
                    }
                    if (!res) {
                        callback();
                        return;
                    }
                    dbo.collection(storagesCollection).findOne({
                        _id: res.storageId
                    }, (err, res) => {
                        db.close();
                        if (err) {
                            console.log('file_metadata_persistence', err);
                            callback();
                            return;
                        }
                        if (!res) {
                            callback();
                            return;
                        }
                        callback(res.location);
                    });
                });
            });
        });
    });
};

exports.getFileId = (username, path, callback) => {
    findRoot(username, (rootId) => {
        if (!rootId) {
            console.log('file_metadata_persistence', `cannot find root folder for user ${username}`);
            callback();
            return;
        }
        findFile(rootId, path, (parentId, childId) => {
            db_access.connect((db) => {
                if (!childId) {
                    console.log('file_metadata_persistence', `cannot find file ${username}:${path}`);
                    callback();
                    return;
                }
                callback(childId);
            });
        });
    });
};

exports.fileExists = (username, path, callback) => {
    findRoot(username, (rootId) => {
        if (!rootId) {
            console.log('file_metadata_persistence', `cannot find root folder for user ${username}`);
            callback(false);
            return;
        }
        findFile(rootId, path, (parentId, childId) => {
            db_access.connect((db) => {
                if (!childId) {
                    callback(false);
                } else {
                    callback(true);
                }
            });
        });
    });
};

exports.isDirectory = (username, path, callback) => {
    findRoot(username, (rootId) => {
        if (!rootId) {
            console.log('file_metadata_persistence', `cannot find root folder for user ${username}`);
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
                        console.log('file_metadata_persistence', err);
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
                console.log('file_metadata_persistence', `${dirId} is not a directory`);
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

function createFile(parentId, location, name, isDir, children, storageId, callback) {
    db_access.connect((db) => {
        dbo = db.db(dbName);
        var newFile = {
            name: name,
            isDir: isDir
        };
        var cont = () => {
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
        };
        if (isDir) {
            newFile.children = children;
            cont();
        } else if (storageId) {
            newFile.storageId = storageId;
            cont();
        } else {
            dbo.collection(storagesCollection).insertOne({
                location: location,
                refcount: 1
            }, (err, res) => {
                if (err) {
                    console.log('file_metadata_persistence', err);
                    callback(false);
                    return;
                }
                newFile.storageId = res.insertedId;
                cont();
            });
        }
    });
}

function createFileFromPath(rootId, location, path, isDir, children, storageId, callback) {
    var separator = path.lastIndexOf('/');
    if (separator === -1) {
        createFile(rootId, location, path, isDir, children, storageId, (success) => {
            if (!success) {
                console.log('file_metadata_persistence', `cannot create file ${rootId}:/${path}`);
            }
            callback(success);
        });
    } else {
        var dirName = path.substring(0, separator);
        var fileName = path.substring(separator + 1, path.length);
        findFile(rootId, dirName, function(parentId, dirId) {
            if (!dirId) {
                console.log('file_metadata_persistence', `cannot find file ${rootId}:/${path}`);
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
                        console.log('file_metadata_persistence', `${rootId}:/${dirId} is not a directory`);
                        callback(false);
                        return;
                    }
                    createFile(dirId, location, fileName, isDir, children, storageId,
                        function(success) {
                            if (!success) {
                                console.log('file_metadata_persistence', `cannot create file ${rootId}:/${path}`);
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
                    emptyDirectory(id, (locations) => {
                        if (!locations && locations !== []) {
                            console.log('file_metadata_persistence', `cannot empty directory ${id}`);
                            callback();
                            return;
                        }
                        if (res.name !== '') {
                            deleteFile(parentId, id, false, (location) => {
                                callback(locations);
                            });
                        } else {
                            console.log('file_metadata_persistence', `cannot delete root ${id}`);
                            callback(locations);
                        }
                    });
                } else {
                    deleteFile(parentId, id, false, (location) => {
                        callback(location ? [location] : []);
                    });
                }
            }
        });
    });
}

function deleteFile(parentId, id, skipStorageModifications, callback) {
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
            var storageId = res.isDir ? undefined : res.storageId;
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
                        console.log('file_metadata_persistence', err);
                        callback();
                        return;
                    }
                    if (!res) {
                        console.log('file_metadata_persistence', `cannot find file ${parentId}`);
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
                        if (err) {
                            console.log('file_metadata_persistence', err);
                            callback();
                            return;
                        }
                        if (!storageId || skipStorageModifications) {
                            db.close();
                            callback();
                            return;
                        }
                        dbo.collection(storagesCollection).findOne({
                            _id: storageId
                        }, (err, res) => {
                            if (err) {
                                db.close();
                                console.log('file_metadata_persistence', err);
                                callback();
                                return;
                            }
                            if (!res) {
                                db.close();
                                console.log('file_metadata_persistence',
                                    `could not find storage with id ${storageId}`);
                                callback();
                                return;
                            }
                            var location = res.location;
                            if (res.refcount > 1) {
                                dbo.collection(storagesCollection).updateOne({
                                    _id: storageId
                                }, {
                                    $inc: {
                                        refcount: -1
                                    }
                                }, (err, res) => {
                                    db.close();
                                    if (err) {
                                        console.log('file_metadata_persistence',
                                            `could not update storage with id ${storageId}`
                                        );
                                    }
                                    callback();
                                });
                            } else {
                                dbo.collection(storagesCollection).deleteOne({
                                    _id: storageId
                                }, (err, res) => {
                                    if (err) {
                                        console.log('file_metadata_persistence',
                                            `could not remove storage with id ${storageId}`
                                        );
                                    }
                                    callback(location);
                                });
                            }
                        });
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
                console.log('file_metadata_persistence', `${dirId} is not a directory`);
                callback();
                return;
            }
            var storageLocations = [];
            var it = (i) => {
                if (i === res.children.length) {
                    callback(storageLocations);
                    return;
                }
                deleteFileOrDirectory(dirId, res.children[i].childId, (locations) => {
                    storageLocations = storageLocations.concat(locations);
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
                console.log('file_metadata_persistence', `cannot find user ${user}`);
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
                console.log('file_metadata_persistence', `cannot find file ${parentId}:/${path}`);
                callback();
                return;
            }
            if (!res.isDir) {
                console.log('file_metadata_persistence', `${parentId}:/${path} is not a directory`);
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
