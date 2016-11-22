Parse.Cloud.define("sendPush", function(request, response) {
  Parse.Push.send({   
  where: query,
  data: request.params
  }, { useMasterKey: true }).then(function() {
                              response.success()
                            }, function(error) {
                              response.error(error);
                            });
}