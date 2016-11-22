Parse.Cloud.define("sendPush", function(request, response) {
  
  var query = new Parse.Query('_Parse.Installation');
  var postOwner = request.params.userChannel
  var postOwner2 = request.params.userchannel
  console.log("PROVA 1" + postOwner);
  console.log("PROVA 2" + postOwner2);
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