Parse.Cloud.define("sendPush", function(request, response) {
  
  var query = new Parse.Query('_Parse.Installation');
  var postOwner = request.params.userChannel
  console.log("PROVA 1" + postOwner)
  query.equalTo('channels', postOwner);
  Parse.Push.send({   
  where: query,
  data: request.params
  }, { useMasterKey: true }).then(function() {
                              response.success()
                            }, function(error) {
                              response.error(error);
                            });
});