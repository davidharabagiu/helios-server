var crypto = require('crypto');
var config = require('../utils/config').config;

const tokenLength = config.authentication.tokenLength;
const pwdEncryptionIterations = config.authentication.password.encryptPassword;
const saltLength = config.authentication.password.saltLength;

exports.createToken = function() {
    abc = 'aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ1234567890'.split('');
    var token = '';
    for (i = 0; i < tokenLength; i++) {
        token += abc[Math.floor(Math.random() * abc.length)];
    }
    return token;
}

exports.createSalt = function() {
    var salt = '';
    for (i = 0; i < saltLength; ++i) {
        salt += String.fromCharCode(Math.floor(Math.random() * 95) + 32);
    }
    return salt;
}

exports.encryptPassword = function(password, salt) {
    var result = password + salt;
    for (i = 0; i < pwdEncryptionIterations; ++i) {
        result = crypto.createHash('sha256').update(result).digest(
            i === pwdEncryptionIterations - 1 ? 'hex' : 'base64');
    }
    return result;
}
