var ExternalPostService = require("./externalPostService.js");

Parse.Cloud.define("sendPush", function (request, response) {

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
        aNotification.set("postType", request.params.postType)
        aNotification.set("notificationType", request.params.notificationType)
        aNotification.set("senderUsername", request.params.senderUsername)
        aNotification.set("receiverUsername", request.params.receiverUsername)
        aNotification.set("postObjectId", request.params.postId)
        aNotification.set("parseObjectId", request.params.kParsePushParameterNotificationParseObjectId)
        aNotification.set("notificationMessage", request.params.alert)
        aNotification.save().then(function() {}, function(error) {
            response.error(error);
        });

    }, function(error) {
        response.error(error);
    });
});

Parse.Cloud.define('getPosts', function (request, response) {

    var lat = request.params.latitude;
    var long = request.params.longitude;

    if (!lat || !long) {
        response.error(400, 'Malformed request: no latitude or longitude found');
        return;
    }

    var limit = request.params.limit;
    if (!limit) {
        limit = 40;
    }

    var finalPosts = [];

    ExternalPostService.getPlacesFromFoursquare(lat, long, request.params.hashtagsFilter, limit / 2, function (posts, error) {
        if (!error) {
            finalPosts.push(posts);
            ExternalPostService.getPlacesFromWikidata(lat, long, request.params.hashtagsFilter, limit / 2, function (posts, error) {
                if (!error) {
                    finalPosts.push(posts);
                    console.log(finalPosts);
                    response.success(finalPosts);
                } else {
                    console.log(error);
                    response.error(error);
                }
            });
        } else {
            console.log(error);
            response.error(error);
        }
    });




});



