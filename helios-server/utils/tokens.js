const tokenLength = 32;

exports.createToken = function() {
    abc = "aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ1234567890".split("");
    var token = ""; 
    for (i=0; i<32; i++) {
         token += abc[Math.floor(Math.random() * abc.length)];
    }
    return token;
}
