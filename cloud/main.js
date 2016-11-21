Parse.Cloud.afterSave("Posts", function(request) {
var aPost = request.object;
var user = request.user.fetch()
var commentRelation = aPost.relation("comments");
var aComment = commentRelation[commentRelation.length - 1].fetch();
var query = new Parse.Query('_Parse.Installation');
var postOwner = "ABRA_User_" + aPost.get('user').id
query.equalTo('channels', postOwner);
Parse.Push.send({
  where: query,
  data: { 
    "title": "abracapp",
    "alert": user.get('username') + ":" + aComment.get('text') + "in: " + aPost.get('text')
  }
  }, { useMasterKey: true }).then(() => {
      // Push was successful
      console.log('DAJEEEEEE weeee!');
  }, (e) => {
      console.log('ERRORE: ' + e);
  });
});