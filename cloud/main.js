Parse.Cloud.afterSave("Posts", function(request) {
  var aPost = request.object;
  var user = aPost.get("user").fetch()
  var currentUser = Parse.User.current();

  var commentRelationQuery = aPost.relation("comments").query();
  commentRelationQuery.descending("createdAt");
  commentRelationQuery.limit(1)
  commentRelationQuery.find().then(function(results) {

    var aComment = results[0].fetch()
    var query = new Parse.Query('_Parse.Installation');
    var postOwner = "ABRA_User_" + user.id
    query.equalTo('channels', postOwner);

    Parse.Push.send({   
      where: query,
      data: { 
        "title": "abracapp",
        "alert": currentUser.get("username") + ":" + aComment.get("text") + "in: " + aPost.get("text")
      }
      }, { useMasterKey: true }).then(() => {
          // Push was successful
          console.log('DAJEEEEEE weeee!');
      }, (e) => {
          console.log('ERROR: ' + e);
      });
    });

});


