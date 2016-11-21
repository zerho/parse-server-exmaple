Parse.Cloud.afterSave("Posts", function(request) {
Array.prototype.last = function() {
  return this[this.length-1];
}
var aPost = request.object;
var commentRelation = subjectObj.relation("comments");
var aComment = commentRelation.last()
var query = new Parse.Query('_Parse.Installation');
var postOwner = "ABRA_User_" + aPost.get('user').id
query.equalTo('channels', postOwner);
Parse.Push.send({
  where: query,
  data: { 
    "title": "abracapp",
    "alert": request.user.get('username') + ":" + aComment.get('text') + "in: " + aPost.get('text')
  }
  }, { useMasterKey: true }).then(() => {
      // Push was successful
      console.log('DAJEEEEEE weeee!');
  }, (e) => {
      console.log('ERRORE: ' + e);
  });
});