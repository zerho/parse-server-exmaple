var app = angular.module('abracapp_app', ['ngMaterial']);

app.controller('postCtrl', ['$scope', '$mdDialog', '$timeout', function($scope, $mdDialog, $timeout) {
  function getQueryVariable(variable)
    {
      var query = window.location.search.substring(1);
      var vars = query.split("&");
      for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if(pair[0] == variable){return pair[1];}
      }
      return(false);
    }

    var ObjectId = getQueryVariable("id");

    Parse.initialize("E7FSOox76bEDHOjHdEdRcBPMFMuQYSXhAZpEi8bm", "yeckCUIkEcZauwCw795skJYkV2kFEFMf68P4KyZf");
    var post = Parse.Object.extend("Posts");
        var query = new Parse.Query(post);
        query.include("user");
        query.get(ObjectId, {
          success: function(post) {
            $scope.post = post.attributes;
            $scope.authorName_p = post.get("user").get("username");
            $scope.authorPhoto_p = post.get("user").get("photo");
            var comments = post.relation("comments");
              var query = comments.query();
              query.include("user");
              query.find({
                success: function(object) {
                  $scope.comments = object;
                  for (i in object) {
                    $scope.authorName_c = object[i].get("user").get("username");
                    $scope.authorPhoto_c = object[i].get("user").get("photo");
                  } 
                },
                error : function(error) {
                  console.log("Error!", error);
                }
              });
            var hashtags = post.relation("hashtags");
              var query = hashtags.query();
              query.include("user");
              query.find({
                success: function(object) {
                  $scope.hashtags = object;
                },
                error : function(error) {
                  console.log("Error!", error);
                }
              });
            $scope.$apply();
            var state = document.querySelector(".state");
            state.style.display = "inherit";
            var state_toolbar = document.querySelector(".state_toolbar");
            state_toolbar.style.display = "inherit";
            $timeout(function(){$scope.spinner = "false";}, 1000);
          },
          error: function(object, error) {
            console.log("Error!", error);
          }  
        });
}]);
