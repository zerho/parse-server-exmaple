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

Parse.Cloud.beforeSave("Posts", function(request) {
  var aPost = request.object;
  var currentUser = request.user

  var addedLikes = request.object.op("likes").relationsToAdd;

  if addedLikes.empty? return
        
  var query = new Parse.Query('_Parse.Installation');
  var postOwner = "ABRA_User_" + aPost.get("user").id
  query.equalTo('channels', postOwner);
  
  Parse.Push.send({   
    where: query,
    data: { 
      "title": "abracapp",
      "badge": "Increment",
      "sound": "default",
      "alert": currentUser.get("username") + " likes your post: " + aPost.get("text")
    }
    }, { useMasterKey: true })
});

