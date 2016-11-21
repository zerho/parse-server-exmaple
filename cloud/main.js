Parse.Cloud.afterSave("Posts", function(request) {
var aPost = request.object;
var commentRelation = aPost.relation("comments");
var query = new Parse.Query('_Parse.Installation');
var postOwner = "ABRA_User_" + aPost.get('user').id
query.equalTo('channels', postOwner);
Parse.Push.send({
  where: query,
  data: { 
    "title": "abracapp",
    "alert": aPost.get("user").get("username") + ":" + "prova commento" + "in: " + aPost.get("text")
  }
  }, { useMasterKey: true }).then(() => {
      // Push was successful
      console.log('DAJEEEEEE weeee!');
  }, (e) => {
      console.log('ERRORE: ' + e);
  });
});