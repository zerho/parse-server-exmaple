
// Array.prototype.last = function() {
//     return this[this.length-1];
// }

// Parse.Cloud.afterSave("Post", function(request) {
// var aPost = request.object.extend("Post");
// var commentRelation = subjectObj.relation("comments");
// var aComment = commentRelation.last()
// var query = new Parse.Query('_Parse.Installation');
// var postOwner = "ABRA_User_" + aPost.get('user').id
// query.equalTo('channels', postOwner);
// Parse.Push.send({
// 	where: query,
// 	data: { 
// 		"title": "abracapp",
// 		"alert": request.user.get('username') + "likes your post: " + aPost.get('text')
// 	}
// 	}, { useMasterKey: true });
// });

Parse.Cloud.afterSave("Post", function(request) {
	Parse.Push.send({
    where: new Parse.Query(Parse.Installation), // Set our Installation query
    data: {
      alert: "New message: Ciao a tutti"
    }
  }, { useMasterKey: true}).then(() => {
      // Push was successful
      console.log('DAJEEEEEE weeee!');
  }, (e) => {
      console.log(e);
  });
});