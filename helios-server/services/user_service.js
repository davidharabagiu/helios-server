var persistence = require('../persistence/user_persistence');
var tokens = require('../utils/tokens');

var UserServiceErrors = {
    DATABASE_ERROR = 0,
    REGISTER_USER_ALREADY_EXISTS = 1,
    LOGIN_INVALID_USERNAME = 2,
    LOGIN_INVALID_PASSWORD = 3,
    INVALID_TOKEN = 4
};
Object.freeze(UserServiceErrors);
exports.UserServiceErrors = UserServiceErrors;

var authTokens = {};

exports.usernameFromToken = function(token) {
    return authTokens[token];
}

exports.register = function(username, password, callback) {
    persistence.userExists(username, function(userExists) {
        if (userExists === undefined) {
            callback(false, UserServiceErrors.DATABASE_ERROR);
        } else if (userExists) {
            callback(false, UserServiceErrors.REGISTER_USER_ALREADY_EXISTS);
        } else {
            persistence.createUser(username, password, function(success) {
                if (success) {
                    callback(true);
                } else {
                    callback(false, UserServiceErrors.DATABASE_ERROR);
                }
            });
        }
    });
}

exports.login = function(username, password, callback) {
    persistence.userExists(username, function(userExists) {
        if (userExists === undefined) {
            callback(false, UserServiceErrors.DATABASE_ERROR);
        } else if (!userExists) {
            callback(false, UserServiceErrors.LOGIN_INVALID_USERNAME);
        } else {
            persistence.userPasswordMatch(username, password, function(match) {
                if (match === undefined) {
                    callback(false, UserServiceErrors.DATABASE_ERROR);
                } else if (!match) {
                    callback(false, UserServiceErrors.LOGIN_INVALID_PASSWORD);
                } else {
                    var token = tokens.createToken();
                    authTokens[token] = username;
                    callback(true, token);
                }
            });
        }
    });
}

exports.logout = function(token) {
    if (!authTokens[token]) {
        return UserServiceErrors.INVALID_TOKEN;
    }
    delete authTokens[token];
}
