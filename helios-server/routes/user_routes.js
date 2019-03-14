var user_service = require('../services/user_service');
var http_status = require('../utils/http_status');

exports.register = function(request, response) {
    username = request.body.username;
    password = request.body.password;
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
    username = request.body.username;
    password = request.body.password;
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
                response.sendStatus(500);
            }
        });
    }
}

exports.logout = function(request, response) {
    token = request.get('token');
    if (!token) {
        response.sendStatus(http_status.UNAUTHORIZED);
    } else {
        status = user_service.logout(token);
        if (status === user_service.Status.SUCCESS) {
            response.sendStatus(http_status.OK);
        } else {
            response.sendStatus(http_status.UNAUTHORIZED);
        }
    }
}
