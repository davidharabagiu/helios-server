var persistence = require('../persistence/user_persistence');
var auth_utils = require('../utils/auth_utils');

const Status = {
    SUCCESS: 0,
    DATABASE_ERROR: 1,
    REGISTER_USER_ALREADY_EXISTS: 2,
    LOGIN_INVALID_USERNAME: 3,
    LOGIN_INVALID_PASSWORD: 4,
    INVALID_TOKEN: 5,
    REGISTER_INVALID_USERNAME: 6,
    REGISTER_INVALID_PASSWORD: 7
};
Object.freeze(Status);
exports.Status = Status;

var authTokens = {};

exports.usernameFromToken = function(token) {
    return authTokens[token];
}

exports.register = function(username, password, callback) {
    persistence.userExists(username, function(userExists) {
        if (userExists === undefined) {
            callback(Status.DATABASE_ERROR);
        } else if (!username || username.length < 5 || !/^\w+$/.test(username)) {
            callback(Status.REGISTER_INVALID_USERNAME);
        } else if (!password || password.length < 6) {
            callback(Status.REGISTER_INVALID_PASSWORD);
        } else if (userExists) {
            callback(Status.REGISTER_USER_ALREADY_EXISTS);
        } else {
            persistence.createUser(username, password, function(success) {
                if (success) {
                    callback(Status.SUCCESS);
                } else {
                    callback(Status.DATABASE_ERROR);
                }
            });
        }
    });
}

exports.login = function(username, password, callback) {
    persistence.userExists(username, function(userExists) {
        if (userExists === undefined) {
            callback(Status.DATABASE_ERROR);
        } else if (!userExists) {
            callback(Status.LOGIN_INVALID_USERNAME);
        } else {
            persistence.userPasswordMatch(username, password, function(match) {
                if (match === undefined) {
                    callback(Status.DATABASE_ERROR);
                } else if (!match) {
                    callback(Status.LOGIN_INVALID_PASSWORD);
                } else {
                    var token = auth_utils.createToken();
                    authTokens[token] = username;
                    callback(Status.SUCCESS, token);
                }
            });
        }
    });
}

exports.logout = function(token) {
    if (!authTokens[token]) {
        return Status.INVALID_TOKEN;
    }
    delete authTokens[token];
    return Status.SUCCESS;
}
