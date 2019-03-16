var config = require('../utils/config').config;

const tokenLength = config.authentication.tokenLength;

exports.createToken = function() {
    abc = 'aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ1234567890'.split('');
    var token = '';
    for (i = 0; i < tokenLength; i++) {
         token += abc[Math.floor(Math.random() * abc.length)];
    }
    return token;
}
