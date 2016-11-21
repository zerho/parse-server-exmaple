Parse.Cloud.afterSave("Posts", function(request) {
  var aPost = request.object;

  var commentRelationQuery = aPost.relation("comments").query();
  commentRelationQuery.descending("createdAt");
  commentRelationQuery.limit(1)
  commentRelationQuery.find().then(function(results) {

    console.log(results)

    var aComment = results[0].fetch()
    var query = new Parse.Query('_Parse.Installation');
    var postOwner = "ABRA_User_" + aPost.get("user").id
    query.equalTo('channels', postOwner);

    console.log("USER: "+aPost.get("user").get("username"))
    console.log("TEXT: "+aComment.get("text"))
    console.log("POST TEXT: " +aPost.get("text"))

    Parse.Push.send({
      where: query,
      data: { 
        "title": "abracapp",
        "alert": aPost.get("user").get("username") + ":" + aComment.get("text") + "in: " + aPost.get("text")
      }
      }, { useMasterKey: true }).then(() => {
          // Push was successful
          console.log('DAJEEEEEE weeee!');
      }, (e) => {
          console.log('ERRORE: ' + e);
      });
    });

});


