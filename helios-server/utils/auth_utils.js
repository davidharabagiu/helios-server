const tokenLength = 32;

exports.createToken = function() {
    abc = 'aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ1234567890'.split('');
    var token = ''; 
    for (i = 0; i < 48; i++) {
         token += abc[Math.floor(Math.random() * abc.length)];
    }
    return token;
}
