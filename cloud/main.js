Parse.Cloud.afterSave("Posts", function(request) {
  var aPost = request.object.fetch();
  var userOwner = aPost.get("user").fetch()

  var commentRelation = aPost.relation("comments");
  var commentRelationQuery = commentRelation.query();
  commentRelationQuery.descending("createdAt");
  commentRelationQuery.find().then(function(results) {

    var aComment = results[0].fetch()
    var query = new Parse.Query('_Parse.Installation');
    var postOwner = "ABRA_User_" + userOwner.id
    query.equalTo('channels', postOwner);

    Parse.Push.send({
      where: query,
      data: { 
        "title": "abracapp",
        "alert": userOwner.get("username") + ":" + aComment.get("text") + "in: " + aPost.get("text")
      }
      }, { useMasterKey: true }).then(() => {
          // Push was successful
          console.log('DAJEEEEEE weeee!');
      }, (e) => {
          console.log('ERRORE: ' + e);
      });
    });

});


