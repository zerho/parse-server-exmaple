/**
 * Created by rico on 23/05/17.
 */
'use strict';

var fbClientId = process.env.FB_CLIENT_ID || '1417032295024144';
var fbSecretKey = process.env.FB_SECRET_KEY || '1fb15a2dd1bf9aa9b6546f73cc4ebd99';
var foursquareClientId = process.env.FOURSQUARE_CLIENT_ID || 'PZIYFJB5HNOQLZHET00ZVE5CIOKCLKWNBZAUNWDPHQ2PCUKL';
var foursquareSecretKey = process.env.FOURSQUARE_CLIENT_SECRET || 'S0L43S2OV3GP2N1JCYLUHJMRXMXYYUWKTCDFRUX1T4FB044N';

var foursquare = (require('foursquarevenues'))(foursquareClientId, foursquareSecretKey);

module.exports = {
    getPlacesFromFB: function (latitude, longitude, callback) {
        var fbRequestUrl = 'https://graph.facebook.com/search?type=event&q=a'
            + '&center=' + latitude + ',' + longitude
            + '&fields=name,location'
            + '&access_token=' + fbClientId + '|' + fbSecretKey;

        var request = require('request');
        request(fbRequestUrl, function (fbError, fbResponse, fbBody) {
            if (!fbError && fbResponse.statusCode === 200) {
                var result = (JSON.parse(fbBody).data);
            } else if (fbError) {

            } else if (fbResponse.statusCode !== 200) {

            }
        });
    },


    getPlacesFromWikidata: function (latitude, longitude, hashtagsFilter, limit, callback) {

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

        // TODO: transform this callback hell into promises to have a better code...
        foursquare.getVenues(params, function (error, result) {
            if (!error) {
                var venues = result.response.venues;

                if (venues != null) {

                    var hashtagsKey = {};
                    venues.forEach(function (venue) {
                        if (venue.categories) {
                            venue.categories.forEach(function (category) {
                                hashtagsKey[('#' + category.name).replace(" ", "")] = false;
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
                            console.log(hashtagsKey[obj.get('hashtag')].get('hashtag'));
                        });

                        var posts = [];
                        var index = 0;
                        venues.forEach(function (venue) {
                            var hashtags = [];

                            if (venue.categories) {
                                venue.categories.forEach(function (category) {
                                    hashtags.push(('#' + category.name).replace(" ", ""));
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
                                        if (index == venues.length) {
                                            savePostsInDb(posts, function (posts) {
                                                console.log(posts);
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
        console.log('looking for hashtag: ' + stringHashtag);
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

        console.log('setting all post field');
        hashtagsAsString = hashtagsAsString.trim();

        post.set(id.name, id.value);
        post.set('position', new Parse.GeoPoint(lat, lng));
        post.set('text', text);
        post.set('phoneNumber', phoneNumber);
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
    console.log('i am saving posts...');
    Parse.Object.saveAll(posts, {useMasterKey: true}).then(callback);
}