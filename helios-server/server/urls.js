var user_routes = require('../routes/user_routes');
var file_routes = require('../routes/file_routes');

exports.register = (app) => {
    // User routes
    app.post('/register', user_routes.register);
    app.post('/login', user_routes.login);
    app.post('/logout', user_routes.logout);

    // File routes
    app.post('/mkdir', file_routes.mkdir);
    app.post('/beginupload', file_routes.beginUpload);
    app.post('/begindownload', file_routes.beginDownload);
    app.post('/endtransfer', file_routes.endTransfer);
    app.get('/size', file_routes.size);
    app.get('/list', file_routes.list);
    app.post('/delete', file_routes.delete);
    app.post('/move', file_routes.move);
};
