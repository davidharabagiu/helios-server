var user_routes = require('../routes/user_routes');
var file_routes = require('../routes/file_routes');
var notification_routes = require('../routes/notification_routes');
var bodyParser = require('body-parser');
var multer = require('multer');

exports.register = (app) => {
    var urlEncodedParser = bodyParser.urlencoded({
        extended: true
    });

    var formData = multer();

    // User routes
    app.post('/register', urlEncodedParser, user_routes.register);
    app.post('/login', urlEncodedParser, user_routes.login);
    app.post('/logout', urlEncodedParser, user_routes.logout);
    app.get('/checktoken', urlEncodedParser, user_routes.checkToken);

    // File routes
    app.post('/mkdir', urlEncodedParser, file_routes.mkdir);
    app.post('/beginupload', urlEncodedParser, file_routes.beginUpload);
    app.post('/begindownload', urlEncodedParser, file_routes.beginDownload);
    app.post('/endtransfer', urlEncodedParser, file_routes.endTransfer);
    app.get('/size', urlEncodedParser, file_routes.size);
    app.get('/list', urlEncodedParser, file_routes.list);
    app.post('/delete', urlEncodedParser, file_routes.delete);
    app.post('/move', urlEncodedParser, file_routes.move);
    app.get('/download', urlEncodedParser, file_routes.download);
    app.post('/upload', formData.single('data'), file_routes.upload);
    app.get('/isdir', urlEncodedParser, file_routes.isDir);
    app.post('/share', urlEncodedParser, file_routes.share);
    app.post('/sharekey', urlEncodedParser, file_routes.shareKey);
    app.get('/getsharedkey', urlEncodedParser, file_routes.getSharedKey);
    app.post('/acceptfile', urlEncodedParser, file_routes.acceptFile);

    // Notification routes
    app.get('/notifications', urlEncodedParser, notification_routes.notifications);
    app.post('/dismissnotification', urlEncodedParser, notification_routes.dismiss);
    app.post('/dismissallnotifications', urlEncodedParser, notification_routes.dismissAll);
};
