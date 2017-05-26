/**
 * Created by rico on 23/05/17.
 */
'use strict';

var foursquareClientId = process.env.FOURSQUARE_CLIENT_ID;
var foursquareSecretKey = process.env.FOURSQUARE_CLIENT_SECRET;

var foursquare = (require('foursquarevenues'))(foursquareClientId, foursquareSecretKey);
var request = require('request');

module.exports = {

    getPlacesFromWikidata: function (latitude, longitude, hashtagsFilter, limit, callback) {
        var url = "https://en.wikipedia.org/w/api.php?" +
            "action=query" +
            "&format=json" +
            "&prop=coordinates|pageprops|categoryinfo" +
            "&generator=geosearch" +
            "&formatversion=2" +
            "&colimit=50" +
            "&ggscoord=" + latitude + '|' + longitude +
            "&ggsradius=" + (process.env.WIKIDATA_RADIUS || 2000) +
            "&ggslimit=" + limit || 10;

        request(url, function (error, response, body) {
            if (!error && (response.statusCode >= 200 || response.statusCode < 300)) {

                var pages = JSON.parse(body).query.pages;

                var hashtagsKey = {};
                pages.forEach(function (page) {
                    hashtagsKey[('#' + page.title).replace(/\s/g,'')] = false;
                });
                var hashtags = [];
                for (var key in hashtagsKey) {
                    hashtags.push(key);
                }
                var query = new Parse.Query('Hashtags').containedIn('hashtag', hashtags);
                query.find().then(function (list) {

                    list.forEach(function (obj) {
                        hashtagsKey[obj.get('hashtag')] = obj;
                    });

                    var posts = [];
                    var index = 0;
                    pages.forEach(function (page) {
                        createPost({'name': 'wikidataId', 'value': page.pageid},
                            page.title,
                            page.coordinates[0].lat,
                            page.coordinates[0].lon,
                            null,
                            hashtags,
                            hashtagsKey,
                            function (post, error) {
                                if (!error) {
                                    if (!hashtagsFilter || (hashtagsFilter && post.hashtagsAsString.indexOf(hashtagsFilter) != -1)) {
                                        posts.push(post);
                                    }
                                    index++;
                                    if (index == pages.length) {
                                        savePostsInDb(posts, function (posts) {
                                            callback(posts, null);
                                        }, function (error) {
                                            console.log(error);
                                            callback(null, error);
                                        })
                                    }
                                } else {
                                    callback(null, error);
                                }
                            });
                    });

                }, function (error) {
                    // if some error in Query.find()
                    callback(null, error);
                });
            } else if (error) {
                // if some error in request
                callback(null, error);
            }
        });

    },

    /**
     * This function call Foursquare API to get places and save them as Posts into the Abracapp DB;
     * Use the callback to have the new posts already converted into Parse.Object('Posts').
     *
     * @param latitude The latitude to serach nearby.
     * @param longitude The longitude to serach nearby.
     * @param hashtagsFilter The filter to get only specific posts that have some hashtag matching this filter. Optional.
     * @param limit The maximum number of posts retrieved from Foursquare. Default is 10.
     * @param callback The closure called for result.
     */
    getPlacesFromFoursquare: function (latitude, longitude, hashtagsFilter, limit, callback) {
        var params = {
            "ll": latitude + "," + longitude,
            "venuePhotos": 1,
            "limit": limit || 10
        };

        const excludedCategories = require('./excludedCategories.json');

        // TODO: transform this callback hell into promises to have a better code...
        foursquare.getVenues(params, function (error, result) {
            if (!error) {
                var venues = result.response.venues;

                var excludedIds = '4bf58dd8d48988d17c941735,5744ccdfe4b0c0459246b4b8,56aa371be4b08b9a8d573520,4f4534884b9074f6e4fb0174,4e52adeebd41615f56317744,58daa1548bbb0b01f18ec1a9,5310b8e5bcbc57f1066bcbf1,4f4533804b9074f6e4fb0105,4bf58dd8d48988d13d941735,4f4533814b9074f6e4fb0106,4f04b10d2fb6e1c99f3db0be,4f4533814b9074f6e4fb0107,52e81612bcbc57f1066b7a45,52e81612bcbc57f1066b7a46,52e81612bcbc57f1066b7a47,5744ccdfe4b0c0459246b4c7,4f4532974b9074f6e4fb0104,52f2ab2ebcbc57f1066b8b19,52f2ab2ebcbc57f1066b8b38';

                if (venues != null) {

                    var hashtagsKey = {};
                    var filteredVenues = [];
                    venues.forEach(function (venue) {
                        if (venue.categories) {
                            venue.categories.forEach(function (category) {
                                if (excludedIds.indexOf(category.id) == -1) {
                                    hashtagsKey[('#' + category.name).replace(/\s/g,'')] = false;
                                    filteredVenues.push(venue);
                                }
                            });
                        }
                    });
                    var hashtags = [];
                    for (var key in hashtagsKey) {
                        hashtags.push(key);
                    }

                    var query = new Parse.Query('Hashtags').containedIn('hashtag', hashtags);
                    query.find().then(function (list) {

                        list.forEach(function (obj) {
                            hashtagsKey[obj.get('hashtag')] = obj;
                        });

                        var posts = [];
                        var index = 0;
                        filteredVenues.forEach(function (venue) {
                            var hashtags = [];

                            if (venue.categories) {
                                venue.categories.forEach(function (category) {
                                    hashtags.push(('#' + category.name).replace(/\s/g,''));
                                });
                            }

                            createPost({'name': 'foursquareId', 'value': venue.id},
                                venue.name,
                                venue.location.lat,
                                venue.location.lng,
                                venue.contact.phone,
                                hashtags,
                                hashtagsKey,
                                function (post, error) {
                                    if (!error) {
                                        if (!hashtagsFilter || (hashtagsFilter && post.hashtagsAsString.indexOf(hashtagsFilter) != -1)) {
                                            posts.push(post);
                                        }
                                        index++;
                                        if (index == filteredVenues.length) {
                                            savePostsInDb(posts, function (posts) {
                                                callback(posts, null);
                                            }, function (error) {
                                                console.log(error);
                                                callback(null, error);
                                            })
                                        }
                                    } else {
                                        callback(null, error);
                                    }
                                });
                        });

                    }, function (error) {
                        // if some error in Query.find()
                        callback(null, error);
                    });

                } else {
                    // if no result found, return empty array.
                    callback([], null);
                }
            } else {
                // if some error in foursquare.getVenues()
                callback(null, error);
            }
        });

    }
}


/**
 * Create a Post object and save it in Parse database.
 * @param id
 * @param text The text of the Post.
 * @param lat The latitude of the Post.
 * @param lng The longitude of the Post.
 * @param phoneNumber A phone number, can be null.
 * @param hashtags the hashtags of the post
 * @param existingHashtags All existing hashtags. Must be a map where key is the hashtag name (like '#ehi') and the value is
 *                         a Parse.Object('Hashtags') object.
 * @param callback A closure that takes a Parse.Object('Posts') object and an error as arguments.
 */
function createPost(id, text, lat, lng, phoneNumber, hashtags, existingHashtags, callback) {
    var Hashtag = Parse.Object.extend('Hashtags');
    var post = new Parse.Object('Posts');

    var newHashtags = [];
    var hashtagsAsString = '';

    // I analyze every hashtag to create the hashtagsAsString and to check if the
    // given hashtags already exist into Abracapp DB. If not, new hashatags will be
    // saved, otherwise the it will be set a relation between the post object and the hashtag object.
    hashtags.forEach(function (stringHashtag) {
        hashtagsAsString += stringHashtag + " ";
        if (existingHashtags[stringHashtag]) {
            console.log('found an existing hashtag: ' + existingHashtags[stringHashtag].get('hashtag'));
            post.relation('hashtags').add(existingHashtags[stringHashtag]);
        } else {
            console.log('must create new hashtag');
            var hashtag = new Hashtag();
            hashtag.set('hashtag', stringHashtag);
            newHashtags.push(hashtag);
        }
    });

    Parse.Object.saveAll(newHashtags, {useMasterKey: true}).then(function (createdHashtags) {
        // set a relation between the post object and the new hashtags.
        createdHashtags.forEach(function (tag) {
            post.relation('hashtags').add(tag);
        });

        hashtagsAsString = hashtagsAsString.trim();

        post.set(id.name, id.value);
        post.set('position', new Parse.GeoPoint(lat, lng));
        post.set('text', text);
        if (phoneNumber) {
            post.set('phoneNumber', phoneNumber);
        }
        post.set('type', 3);
        post.set('banCount', 0);
        post.set('likesCount', 0);
        post.set('deleted', false);
        post.set('hashtagsAsString', hashtagsAsString);

        callback(post, null);
    }, function (error) {
        callback(null, error);
    });

}

function savePostsInDb(posts, callback) {
    var ids = [];
    var fieldName = 'foursquareId';
    posts.forEach(function (post) {
        if (post.get('wikidataId')) {
            fieldName = 'wikidataId';
        }
        ids.push(post.get(fieldName));
    });

    var finalQuery = new Parse.Query('Posts').containedIn(fieldName, ids);
    finalQuery.find().then(function (list) {

        var existingIds = [];
        list.forEach(function(existingPost) {
            existingIds.push(existingPost.get(fieldName));
        });

        var newPosts = [];
        posts.forEach(function(post) {
            if(existingIds.indexOf(post.get(fieldName)) == -1) {
                newPosts.push(post);
            }
        });

        Parse.Object.saveAll(newPosts, {useMasterKey: true}).then(function (insertedPosts) {
            callback(posts, null);
        }, function (error) {
            console.log(error);
            callback(posts, error);
        });

    }, function(error) {
        callback(posts, error);
    });


}