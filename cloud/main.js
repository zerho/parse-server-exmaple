Parse.Cloud.define("sendPush", function(request, response) {

    var query = new Parse.Query('_Parse.Installation');
    var postOwner = request.params.userChannel
    query.equalTo('channels', postOwner);
    Parse.Push.send({
        where: query,
        data: request.params
    }, {
        useMasterKey: true
    }).then(function() {

        var notifications = Parse.Object.extend("Notifications");
        var aNotification = new notifications();
        aNotification.set("postType", request.params.type)
        aNotification.set("senderUsername", request.params.username)
        aNotification.set("postObjectId", request.params.postId)
        aNotification.set("parseObjectId", request.params.kParsePushParameterNotificationParseObjectId)
        aNotification.set("notificationMessage", request.params.message)
        aNotification.save().then(function() {}, function(error) {
            response.error(error);
        });

    }, function(error) {
        response.error(error);
    });
});