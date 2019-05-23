var persistence = require('../persistence/user_persistence');
var auth_utils = require('../utils/auth_utils');
var config = require('../utils/config').config;
var fs = require('fs');

const Status = {
    SUCCESS: 0,
    DATABASE_ERROR: 1,
    REGISTER_USER_ALREADY_EXISTS: 2,
    LOGIN_INVALID_USERNAME: 3,
    LOGIN_INVALID_PASSWORD: 4,
    INVALID_TOKEN: 5,
    REGISTER_INVALID_USERNAME: 6,
    REGISTER_INVALID_PASSWORD: 7,
    IO_ERROR: 8,
    INVALID_USER: 9,
    USER_DID_NOT_SPECIFY_PUBLIC_KEY: 10
};
Object.freeze(Status);
exports.Status = Status;

var authTokens = {};

exports.usernameFromToken = function(token) {
    return authTokens[token];
}

exports.register = function(username, password, callback) {
    persistence.findUser(username, function(user) {
        if (user === undefined) {
            callback(Status.DATABASE_ERROR);
        } else if (!username || username.length < config.usernameRules.minimumLength ||
            !/^\w+$/.test(username)) {
            callback(Status.REGISTER_INVALID_USERNAME);
        } else if (!password || password.length < config.passwordRules.minimumLength ||
            (config.passwordRules.mustContainLowercase && !/[a-z]/.test(password)) ||
            (config.passwordRules.mustContainUppercase && !/[A-Z]/.test(password)) ||
            (config.passwordRules.mustContainDigit && !/[0-9]/.test(password)) ||
            (config.passwordRules.mustContainSpecial &&
                !/[-+!@#$%^&*():;'"\\?/,.<>=`~[\]{}|]/.test(password))) {
            callback(Status.REGISTER_INVALID_PASSWORD);
        } else if (user !== null) {
            callback(Status.REGISTER_USER_ALREADY_EXISTS);
        } else {
            var salt = auth_utils.createSalt();
            var password_enc = auth_utils.encryptPassword(password, salt);
            persistence.createUser(username, password_enc, salt, function(success) {
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
    persistence.findUser(username, function(user) {
        if (user === undefined) {
            callback(Status.DATABASE_ERROR);
        } else if (user === null) {
            callback(Status.LOGIN_INVALID_USERNAME);
        } else {
            var password_enc = auth_utils.encryptPassword(password, user.salt);
            if (password_enc != user.password) {
                callback(Status.LOGIN_INVALID_PASSWORD);
            } else {
                var token = auth_utils.createToken();
                authTokens[token] = username;
                callback(Status.SUCCESS, token);
            }
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

exports.checkToken = function(username, token) {
    if (!authTokens[token] || authTokens[token] !== username) {
        return Status.INVALID_TOKEN;
    } else {
        return Status.SUCCESS;
    }
}

exports.setUserKey = (username, buffer, callback) => {
    fs.open(config.userKeyStorage + '/' + username + '.pubk', 'w+', (err, fd) => {
        if (err) {
            console.log('user_service', err);
            callback(Status.IO_ERROR);
            return;
        }
        fs.write(fd, buffer, (err, bytesWritten) => {
            if (err) {
                console.log('user_service', err);
                fs.close(fd, () => {
                    callback(Status.IO_ERROR);
                });
                return;
            }
            if (bytesWritten !== buffer.length) {
                fs.close(fd, () => {
                    callback(Status.IO_ERROR);
                });
                return;
            }
            fs.close(fd, () => {
                callback(Status.SUCCESS);
            });
        });
    });
};

exports.getUserKey = (username, callback) => {
    persistence.findUser(username, (user) => {
        if (!user) {
            callback(Status.INVALID_USER);
            return;
        }
        fs.open(config.userKeyStorage + '/' + username + '.pubk', 'r', (err, fd) => {
            if (err) {
                callback(Status.USER_DID_NOT_SPECIFY_PUBLIC_KEY);
                return;
            }
            fs.readFile(fd, 'utf8', (err, data) => {
                if (err) {
                    console.log('user_service', err);
                    fs.close(fd, () => {
                        callback(Status.IO_ERROR);
                    });
                    return;
                }
                fs.close(fd, () => {
                    callback(Status.SUCCESS, data);
                });
            });
        });
    });
};
