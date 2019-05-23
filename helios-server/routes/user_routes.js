var user_service = require('../services/user_service');
var http_status = require('../utils/http_status');

exports.register = function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (!username || !password) {
        response.sendStatus(http_status.BAD_REQUEST);
    } else {
        user_service.register(username, password, function(status) {
            if (status === user_service.Status.REGISTER_USER_ALREADY_EXISTS) {
                response.status(http_status.BAD_REQUEST);
                response.send('Username already taken');
            } else if (status === user_service.Status.REGISTER_INVALID_USERNAME) {
                response.status(http_status.BAD_REQUEST);
                response.send('Invalid username');
            } else if (status === user_service.Status.REGISTER_INVALID_PASSWORD) {
                response.status(http_status.BAD_REQUEST);
                response.send('Invalid password');
            } else if (status === user_service.Status.SUCCESS) {
                response.sendStatus(http_status.OK);
            } else {
                response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
            }
        });
    }
}

exports.login = function(request, response) {
    var username = request.body.username;
    var password = request.body.password;
    if (!username || !password) {
        response.sendStatus(http_status.BAD_REQUEST);
    } else {
        user_service.login(username, password, function(status, token) {
            if (status === user_service.Status.LOGIN_INVALID_USERNAME) {
                response.status(http_status.UNAUTHORIZED);
                response.send('Invalid username');
            } else if (status === user_service.Status.LOGIN_INVALID_PASSWORD) {
                response.status(http_status.UNAUTHORIZED);
                response.send('Invalid password');
            } else if (status === user_service.Status.SUCCESS) {
                if (token) {
                    response.status(http_status.OK);
                    response.send(token);
                } else {
                    console.log('user_routes', 'Token undefined');
                    response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
                }
            } else {
                response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
            }
        });
    }
}

exports.logout = function(request, response) {
    var token = request.get('token');
    if (!token) {
        response.sendStatus(http_status.UNAUTHORIZED);
    } else {
        var status = user_service.logout(token);
        if (status === user_service.Status.SUCCESS) {
            response.sendStatus(http_status.OK);
        } else {
            response.sendStatus(http_status.UNAUTHORIZED);
        }
    }
}

exports.checkToken = function(request, response) {
    var token = request.get('token');
    var username = request.query.username;
    if (!token || !username) {
        response.sendStatus(http_status.BAD_REQUEST);
    } else {
        var status = user_service.checkToken(username, token);
        if (status === user_service.Status.SUCCESS) {
            response.sendStatus(http_status.OK);
        } else {
            response.sendStatus(http_status.UNAUTHORIZED);
        }
    }
}

exports.setUserKey = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        return;
    }
    user_service.setUserKey(username, request.file.buffer, (status) => {
        if (status === user_service.Status.SUCCESS) {
            response.sendStatus(http_status.OK);
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

exports.getUserKey = (request, response) => {
    var username = authorize(request, response);
    if (!username) {
        return;
    }
    var targetUsername = request.query.user;
    if (!targetUsername) {
        response.sendStatus(http_status.BAD_REQUEST);
        return;
    }
    user_service.getUserKey(targetUsername, (status, data) => {
        if (status === user_service.Status.SUCCESS) {
            response.status(http_status.OK);
            response.send(data);
        } else if (status === user_service.Status.INVALID_USER) {
            response.status(http_status.BAD_REQUEST);
            response.send('Invalid user');
        } else if (status === user_service.Status.USER_DID_NOT_SPECIFY_PUBLIC_KEY) {
            response.status(http_status.BAD_REQUEST);
            response.send('User did not specify public key');
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
