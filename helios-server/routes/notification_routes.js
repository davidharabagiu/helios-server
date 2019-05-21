var notification_service = require('../services/notification_service');
var http_status = require('../utils/http_status');

exports.notifications = function(request, response) {
    var username = authorize(request, response);
    notification_service.getNotifications(username, (status, result) => {
        if (status === notification_service.Status.SUCCESS) {
            response.status(http_status.OK);
            response.send(result);
        } else {
            response.sendStatus(http_status.INTERNAL_SERVER_ERROR);
        }
    });
};

function authorize(request, response) {
    token = request.get('token');
    if (!token) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return null;
    }
    username = user_service.usernameFromToken(token);
    if (!username) {
        response.sendStatus(http_status.UNAUTHORIZED);
        return null;
    }
    return username;
}
