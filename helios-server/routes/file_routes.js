var file_service = require('../services/file_service');
var user_service = require('../services/user_service');
var http_status = require('../utils/http_status');

exports.mkdir = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return;
    }
    var path = request.body.path;
    if (!path) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    file_service.mkdir(username, path, (status) => {
        if (status === file_service.Status.SUCCESS) {
            response.sendStatus(http_status.OK);
        } else if (status === file_service.Status.FILE_ALREADY_EXISTS) {
            response.status(http_status.BAD_REQUEST);
            response.send('Directory already exists');
        } else if (status === file_service.Status.INVALID_PATH) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid path');
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.beginUpload = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return;
    }
    var path = request.body.path;
    if (!path) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    file_service.beginUpload(username, path, (status, transferId) => {
        if (status === file_service.Status.SUCCESS) {
            response.status(http_status.OK);
            response.send(String(transferId));
        } else if (status === file_service.Status.INVALID_PATH) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid path');
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.beginDownload = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return;
    }
    var path = request.body.path;
    if (!path) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    file_service.size(username, path, (status, size) => {
        if (status === file_service.Status.SUCCESS) {
            file_service.beginDownload(username, path, (status, transferId) => {
                if (status === file_service.Status.SUCCESS) {
                    response.status(http_status.OK);
                    response.send(String(transferId) + '\n' + String(size));
                } else if (status === file_service.Status.INVALID_PATH) {
                    response.status(http_status.BAD_REQUEST);
                    response.send('Invalid path');
                } else {
                    response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
                }
            });
        } else if (status === file_service.Status.INVALID_PATH) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid path');
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    })
};

exports.endTransfer = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return;
    }
    var transferId = request.body.transferId;
    if (!transferId) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    file_service.endTransfer(username, transferId, (status, transferId) => {
        if (status === file_service.Status.SUCCESS) {
            response.sendStatus(http_status.OK);
        } else if (status === file_service.Status.INVALID_TRANSFER_ID) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid transfer id');
        } else if (status === file_service.Status.UNAUTHORIZED) {
            response.sendStatus(http_status.UNAUTHORIZED);
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.size = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return;
    }
    var path = request.query.path;
    if (!path) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    file_service.size(username, path, (status, size) => {
        if (status === file_service.Status.SUCCESS) {
            response.status(http_status.OK);
            response.send(String(size));
        } else if (status === file_service.Status.INVALID_PATH) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid path');
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.list = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return;
    }
    var path = request.query.path;
    if (!path && path !== '') {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    file_service.list(username, path, (status, list) => {
        if (status === file_service.Status.SUCCESS) {
            response.status(http_status.OK);
            response.send(list);
        } else if (status === file_service.Status.INVALID_PATH) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid path');
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.delete = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return;
    }
    var path = request.body.path;
    if (!path) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    file_service.delete(username, path, (status) => {
        if (status === file_service.Status.SUCCESS) {
            response.sendStatus(http_status.OK);
        } else if (status === file_service.Status.INVALID_PATH) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid path');
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.move = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return;
    }
    var src = request.body.src;
    var dst = request.body.dst;
    if (!src || !dst) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    file_service.move(username, src, dst, (status) => {
        if (status === file_service.Status.SUCCESS) {
            response.sendStatus(http_status.OK);
        } else if (status === file_service.Status.INVALID_PATH) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid source path');
        } else if (status === file_service.FILE_ALREADY_EXISTS) {
            response.status(http_status.BAD_REQUEST);
            response.send('Destination already exists');
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.download = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return;
    }
    var transferId = request.query.transferId;
    var offset = request.query.offset;
    var length = request.query.length;
    if (!transferId || !offset || !length) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    var buffer = Buffer.alloc(Number(length));
    file_service.download(username, transferId, buffer, Number(offset), Number(length), (
        status) => {
        if (status === file_service.Status.SUCCESS) {
            response.status(http_status.OK);
            response.send(buffer);
        } else if (status === file_service.Status.INVALID_TRANSFER_ID) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid transfer id');
        } else if (status === file_service.Status.UNAUTHORIZED) {
            response.sendStatus(http_status.UNAUTHORIZED);
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.upload = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return;
    }
    var transferId = request.body.transferId;
    var offset = request.body.offset;
    if (!transferId || !offset || !request.file) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    file_service.upload(username, transferId, request.file.buffer, Number(offset), request.file
        .size, (
            status) => {
            if (status === file_service.Status.SUCCESS) {
                response.sendStatus(http_status.OK);
            } else if (status === file_service.Status.INVALID_TRANSFER_ID) {
                response.status(http_status.BAD_REQUEST);
                response.send('Invalid transfer id');
            } else if (status === file_service.Status.UNAUTHORIZED) {
                response.sendStatus(http_status.UNAUTHORIZED);
            } else {
                response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
            }
        });
};

exports.isDir = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return;
    }
    var path = request.query.path;
    if (!path) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    file_service.isDir(username, path, (status, dir) => {
        if (status === file_service.Status.SUCCESS) {
            response.status(http_status.OK);
            response.send(dir ? 'true' : 'false');
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.share = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return;
    }
    var usernameTo = request.body.to;
    var path = request.body.path;
    if (!usernameTo || (!path && path !== '')) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    file_service.shareFile(username, usernameTo, path, (status) => {
        if (status === file_service.Status.SUCCESS) {
            response.sendStatus(http_status.OK);
        } else if (status === file_service.Status.INVALID_PATH) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid path');
        } else if (status === file_service.Status.INVALID_USER) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid user');
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.shareKey = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return;
    }
    var usernameTo = request.body.to;
    var keyName = request.body.name;
    var keyLength = request.body.length;
    var keyContent = request.body.content;
    if (!usernameTo || !keyName || !keyLength || !keyContent) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    file_service.shareKey(username, usernameTo, keyName, keyLength, keyContent, (status) => {
        if (status === file_service.Status.SUCCESS) {
            response.sendStatus(http_status.OK);
        } else if (status === file_service.Status.INVALID_USER) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid user');
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.acceptFile = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        return;
    }
    var notificationId = request.body.notification;
    var path = request.body.path;
    if (!notificationId || !path) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    file_service.acceptSharedFile(username, notificationId, path, (status) => {
        if (status === file_service.Status.SUCCESS) {
            response.sendStatus(http_status.OK);
        } else if (status === file_service.Status.UNAUTHORIZED) {
            response.sendStatus(http_status.UNAUTHORIZED);
        } else if (status === file_service.Status.INVALID_NOTIFICATION_TYPE) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid notification type');
        } else if (status === file_service.Status.INVALID_USER || status === file_service.Status.FILE_NO_LONGER_EXISTS) {
            response.status(http_status.BAD_REQUEST);
            response.send('File no longer exists');
        } else if (status === file_service.Status.FILE_ALREADY_EXISTS) {
            response.status(http_status.BAD_REQUEST);
            response.send('File already exists');
        } else if (status === file_service.Status.INVALID_PATH) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid path');
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.getSharedKey = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        return;
    }
    var notificationId = request.query.notification;
    if (!notificationId) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    file_service.getSharedKey(username, notificationId, (status, key) => {
        if (status === file_service.Status.SUCCESS) {
            response.status(http_status.OK);
            response.send(key);
        } else if (status === file_service.Status.UNAUTHORIZED) {
            response.sendStatus(http_status.UNAUTHORIZED);
        } else if (status === file_service.Status.INVALID_NOTIFICATION_TYPE) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid notification type');
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

function authorize(request, response) {
    token = request.get('token');
    if (!token) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return null;
    }
    username = user_service.usernameFromToken(token);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return null;
    }
    return username;
}
