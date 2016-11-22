Parse.Cloud.beforeSave("Posts", function(request) {
  var aPost = request.object;
  var currentUser = request.user

  var addedLikes = request.object.op("likes").relationsToAdd;
  console.log("TEEEEEEST: " + addedLikes)

  if (addedLikes.lenght == 1) {
    console.log("ENTRO PERCHE' E' uno")
    var query = new Parse.Query('_Parse.Installation');
    var postOwner = "ABRA_User_" + aPost.get("user").id
    query.equalTo('channels', postOwner);
    console.log("USER:" + postOwner)

    Parse.Push.send({   
      where: query,
      data: { 
        "title": "abracapp",
        "badge": "Increment",
        "sound": "default",
        "alert": currentUser.get("username") + " likes your post: " + aPost.get("text")
      }
      }, { useMasterKey: true })
  }
});

Parse.Cloud.afterSave("Posts", function(request) {
  var aPost = request.object;
  var currentUser = request.user

  var commentRelationQuery = aPost.relation("comments").query();
  commentRelationQuery.descending("createdAt");
  commentRelationQuery.limit(1)
  commentRelationQuery.find().then(function(results) {

    results[0].fetch()
    var aComment = results[0]
    var query = new Parse.Query('_Parse.Installation');
    var postOwner = "ABRA_User_" + aPost.get("user").id
    query.equalTo('channels', postOwner);
    
    Parse.Push.send({   
      where: query,
      data: { 
        "title": "abracapp",
        "badge": "Increment",
        "sound": "default",
        "alert": currentUser.get("username") + ": " + aComment.get("text") + " in: " + aPost.get("text")
      }
      }, { useMasterKey: true })
    });
});