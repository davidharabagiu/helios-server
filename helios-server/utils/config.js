var fs = require('fs');

configData = fs.readFileSync('config.json');
exports.config = JSON.parse(configData);
