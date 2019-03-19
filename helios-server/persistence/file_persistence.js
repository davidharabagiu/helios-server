var config = require('../utils/config').config;

const fileIdLength = config.storage.fileIdLength;

exports.createFileId = function() {
    abc = 'abcdefghijklmnopqrstuvwxyz1234567890'.split('');
    var id = '';
    for (i = 0; i < fileIdLength; i++) {
        id += abc[Math.floor(Math.random() * abc.length)];
    }
    return id;
}
