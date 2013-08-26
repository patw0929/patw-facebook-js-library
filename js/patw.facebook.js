/*
* patw's jQuery Facebook JS SDK Library 1.2
* https://code.google.com/p/patw-facebook-js-library/
*
* Copyright (C) 2013 Patrick Wang <patw.hi@gmail.com>
*
* Permission is hereby granted, free of charge, to any person 
* obtaining a copy of this software and associated documentation 
* files (the "Software"), to deal in the Software without restriction, 
* including without limitation the rights to use, copy, modify, merge, 
* publish, distribute, sublicense, and/or sell copies of the Software, 
* and to permit persons to whom the Software is furnished to do so, 
* subject to the following conditions:
*
* The above copyright notice and this permission notice shall be included in 
* all copies or substantial portions of the Software.
*
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS 
* OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
* CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*
*/

/*jslint browser: true*/
/*jslint devel: true*/
/*global $, jQuery, FB*/

var PatwFB = window.PatwFB || {};
(function () {
    "use strict";

    PatwFB = {

        uid: "",
        me: [],
        accessToken: "",
        appId: "",
        xfbml: true,
        status: true,
        cookie: true,
        oauth: true,
        channelUrl: "",
        redirect_uri: "",
        scope: "",
        perm_cache: [],
        // =====================================================================
        // init
        // =====================================================================
        init: function () {

            PatwFB.channelUrl = window.location.protocol + "//" + window.location.hostname + "/channel.html";

            window.fbAsyncInit = function () {
                if ($("#fb-root").length === 0) {
                    $('body').append('<div id="fb-root"></div>');
                }

                FB.init({
                    appId: PatwFB.appId,
                    xfbml: PatwFB.xfbml,
                    status: PatwFB.status,
                    cookie: PatwFB.cookie,
                    oauth: PatwFB.oauth
                });

                FB.getLoginStatus(function (response) {

                    FB.api('/me', function () {

                        if (response.authResponse) {
                            PatwFB.accessToken = response.authResponse.accessToken;
                        }

                    });

                });

                FB.getLoginStatus(PatwFB.updateStatus);
                FB.Event.subscribe('auth.statusChange', PatwFB.updateStatus);
            };
        },
        updateStatus: function (response) {

            if (response.authResponse) {
                //user is already logged in and connected
                FB.api('/me', function () {
                    if (response.authResponse) {
                        PatwFB.accessToken = response.authResponse.accessToken;
                    }
                });
            }
        },
        // =====================================================================
        // Console.log
        // =====================================================================
        log: function (msg) {
            if (window.console) {
                console.log(msg);
            }
        },
        isEmpty: function (obj) {
            var prop;
            for (prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    return false;
                }
            }
            return true;
        },
        // =====================================================================
        // Check the permissions we ask are same as the app's permission or not
        // =====================================================================
        CheckPerm: function () {

            FB.api('/me/permissions', function (response) {
                var permsArray = response.data[0],
                    permsNeeded = PatwFB.scope.split(","),
                    permsToPrompt = [],
                    i;

                for (i = 0; i < permsNeeded.length; i += 1) {
                    if (permsArray[permsNeeded[i]] === null) {
                        permsToPrompt.push(permsNeeded[i]);
                    }
                }

                if (permsToPrompt.length > 0) {
                    PatwFB.log('Need to re-prompt user for permissions: ' + permsToPrompt.join(','));
                } else {
                    PatwFB.log("No need to prompt for any permissions");
                    return true;
                }

                return false;
            });
        },
        // =====================================================================
        // Ask permissions
        // =====================================================================
        requestPerm: function (perm_list) {
            if (!PatwFB.CheckPerm(perm_list)) {
                this.request_perm_count += 1;
                if (this.request_perm_count > 1) {
                    this.request_perm_count = 0;
                } else {
                    this.scope = perm_list;
                    PatwFB.Login();
                }
            } else {
                return true;
            }

            return false;
        },
        // =====================================================================
        // set Canvas size
        // =====================================================================
        setSize: function (width, height) {
            // only execute when this page is in iframe (canvas mode)
            if (window.parent) {
                PatwFB.log(window.parent);

                if (width && height) {
                    FB.Canvas.setSize({
                        width: width,
                        height: height
                    });
                } else {
                    FB.Canvas.setSize();
                }
            }
        },
        // =====================================================================
        // Facebook Connect Login
        // =====================================================================
        Login: function (success_callback, fail_callback) {
            PatwFB.CheckPerm(PatwFB.scope);

            if (typeof success_callback !== 'function') {
                success_callback = false;
            }

            if (typeof fail_callback !== 'function') {
                fail_callback = false;
            }

            FB.getLoginStatus(function (response) {
                if (response.status === 'connected') {

                    PatwFB.userInfo();
                    PatwFB.uid = response.authResponse.userID;
                    PatwFB.accessToken = response.authResponse.accessToken;

                    if (success_callback) {
                        FB.api('/me', function (response) {
                            success_callback(response);
                        });
                    }

                } else if (response.status === 'not_authorized') {

                    FB.login(function (response) {
                        if (response.authResponse) {

                            PatwFB.userInfo();
                            PatwFB.uid = response.authResponse.userID;
                            PatwFB.accessToken = response.authResponse.accessToken;

                            if (success_callback) {
                                FB.api('/me', function (response) {
                                    success_callback(response);
                                });
                            }
                        } else {

                            if (fail_callback) {
                                fail_callback(response);
                            } else {
                                PatwFB.log("login failed");
                                PatwFB.log(response);
                            }
                        }
                    });

                } else {

                    window.open('https://www.facebook.com/dialog/oauth?client_id=' + PatwFB.appId + '&redirect_uri=' + PatwFB.redirect_uri + '&scope=' + PatwFB.scope, '_top');

                }
            });

            FB.login(undefined, {scope: PatwFB.scope});
        },
        Logout: function (callback) {
            FB.logout(function (response) {
                PatwFB.log("user is now logged out");

                if (typeof callback === 'function') {
                    callback(response);
                }
            });
        },
        // =====================================================================
        // FB.api
        // path: such as "/me"
        // method: POST / GET
        // params: Object.
        // successEvent: Success callback
        // failedEvent: Failed callback
        // =====================================================================
        API: function (path, method, params, successEvent, failedEvent) {
            FB.api(path, method, params, function (response) {
                if (!response || response.error) {
                    if (typeof failedEvent === 'function') {
                        failedEvent(response);
                    }
                } else {
                    if (typeof successEvent === 'function') {
                        successEvent(response);
                    }
                }
            });

        },
        // =====================================================================
        // FB.ui
        // =====================================================================
        UI: function (params, successEvent, failedEvent) {
            FB.ui(params, function (response) {
                if (!response || response.error) {
                    if (typeof failedEvent === 'function') {
                        failedEvent(response);
                    }
                } else {
                    if (typeof successEvent === 'function') {
                        successEvent(response);
                    }
                }
            });
        },
        // =====================================================================
        // FQL
        // =====================================================================
        FQL: function (query, successEvent) {
            FB.api({
                method: 'fql.query',
                query: query
            }, function (response) {
                if (typeof successEvent === 'function') {
                    successEvent(response);
                }
            });
        },
        // =====================================================================
        // Retrieve how many times a URL has been shared
        // (Don't need Facebook connect)
        //
        // url: the URL address
        // =====================================================================
        RetrieveURLShareCount: function (url, callback) {

            $.getJSON("http://graph.facebook.com/" + url, function (data) {
                var count = 0;
                count = data.shares;

                if (typeof callback === 'function') {
                    callback(count);
                }
            });
        },
        // =====================================================================
        // Check the user is some page's fans or not
        // 
        // PageID: Fanpage's ID
        // trueEvent: If the user is a fan, the callback event.
        // falseEvent: If not, the callback event.
        // =====================================================================
        isFan: function (PageID, trueEvent, falseEvent) {

            FB.getLoginStatus(function (response) {
                if (response.authResponse) {

                    PatwFB.CheckPerm(PatwFB.scope);

                    FB.api('/me/likes/' + PageID, function (response) {
                        if (response.data) {
                            if (!PatwFB.isEmpty(response.data)) {
                                if (typeof trueEvent === 'function') {
                                    trueEvent(response.data);
                                }
                            } else {
                                PatwFB.log(response);
                                if (typeof falseEvent === 'function') {
                                    falseEvent();
                                }
                            }
                        } else {
                            PatwFB.log(response);
                            if (typeof falseEvent === 'function') {
                                falseEvent();
                            }
                        }
                    });
                } else {
                    PatwFB.Login(PatwFB.isFan);
                }
            });
        },
        // =====================================================================
        // Retrieve the user's information
        // =====================================================================
        userInfo: function (callback) {

            FB.getLoginStatus(function (response) {
                if (response.authResponse) {

                    PatwFB.CheckPerm(PatwFB.scope);

                    FB.api("/me", function (response) {
                        PatwFB.log(response);
                        PatwFB.me = response;

                        if (typeof callback === 'function') {
                            callback(response);
                        }
                    });

                } else {
                    PatwFB.Login(function LoginSuccess() {
                        PatwFB.userInfo();
                    });
                }
            });

        },
        // =====================================================================
        // Publish
        // =====================================================================
        Publish: function (params, successEvent, failedEvent) {

            FB.getLoginStatus(function (response) {
                if (response.authResponse) {

                    PatwFB.CheckPerm(PatwFB.scope);

                    if (params !== undefined) {
                        PatwFB.API('/me/feed', 'POST', params, successEvent, failedEvent);
                    } else {
                        alert("please fill the params");
                    }

                } else {
                    PatwFB.Login(function LoginSuccess() {
                        PatwFB.Publish(params, successEvent, failedEvent);
                    });
                }
            });

        },
        // =====================================================================
        // Publish (with Dialog)
        // =====================================================================
        PublishUI: function (params, successEvent, failedEvent) {

            FB.getLoginStatus(function (response) {
                if (response.authResponse) {

                    PatwFB.CheckPerm(PatwFB.scope);

                    if (params !== undefined) {
                        PatwFB.UI(params, successEvent, failedEvent);
                    } else {
                        alert("please fill the params");
                    }

                } else {
                    PatwFB.Login(function LoginSuccess() {
                        PatwFB.PublishUI(params, successEvent, failedEvent);
                    });
                }
            });

        },
        // =====================================================================
        // Checkin
        // =====================================================================
        Checkin: function (params, successEvent, failedEvent) {
            // 檢查授權狀態
            FB.getLoginStatus(function (response) {
                if (response.authResponse) {
                    // 檢查權限是否相符
                    PatwFB.CheckPerm(PatwFB.scope);

                    if (params !== undefined) {
                        PatwFB.API('/me/checkins', 'POST', params, successEvent, failedEvent);
                    } else {
                        alert("please fill the params");
                    }

                } else {
                    PatwFB.Login(function LoginSuccess() {
                        PatwFB.Checkin(params, successEvent, failedEvent);
                    });
                }
            });

        },
        // Invite Friends
        // FYI: https://developers.facebook.com/docs/reference/dialogs/requests/
        //
        // params:
        // redirect_uri: Required, but automatically specified by most SDKs.
        // message: Required. Maximum length is 60 characters.
        // to: A user ID or username. This may or may not be a friend of the user. 
        // If this is omitted, the user will see a Multi Friend Selector and will be able to select a maximum of 50 recipients.
        // filters: Optional. all, app_users ,or app_non_users
        // exclude_ids: A array of user IDs that will be excluded from the Dialog, for example:exclude_ids: [1, 2, 3]
        // max_recipients: An integer that specifies the maximum number of friends that can be chosen by the user in the friend selector.
        // This parameter is not supported on mobile devices.
        // data:
        // title: Optional, the title for the Dialog. Maximum length is 50 characters.
        InviteFriend: function (params, callbackEvent) {

            FB.getLoginStatus(function (response) {
                if (response.authResponse) {

                    PatwFB.CheckPerm(PatwFB.scope);

                    if (params !== undefined) {

                        var defaults = {
                            method: 'apprequests'
                        },
                            opts = $.extend(defaults, params);

                        FB.ui(opts, function (callback) {
                            if (callbackEvent !== undefined) {
                                callbackEvent(callback);
                            }
                        });

                    } else {

                        alert("please fill the params. At least have: method:apprequests and message.");

                    }

                } else {
                    PatwFB.Login(function LoginSuccess() {
                        PatwFB.Checkin(params);
                    });
                }
            });

        },
        // =====================================================================
        // Upload photo
        // =====================================================================
        UploadPhoto: function (albums_params, photos_params, tags_params, successEvent, failedEvent) {

            if (typeof successEvent !== 'function') {
                successEvent = false;
            }

            if (typeof failedEvent !== 'function') {
                failedEvent = false;
            }

            FB.getLoginStatus(function (response) {

                if (response.authResponse) {

                    PatwFB.CheckPerm(PatwFB.scope);

                    if ((PatwFB.scope).indexOf("user_photos") === -1) {
                        PatwFB.log("API need 'user_photos' permission to check album is exist or not.");
                        return;
                    }

                    if ((PatwFB.scope).indexOf("publish_stream") === -1) {
                        PatwFB.log("API need 'publish_stream' permission to publish photo.");
                        return;
                    }

                    if (albums_params !== undefined) {
                        // Check the album is exist or not
                        FB.api('/me/albums', function (response) {
                            var AlbumsID = "";
                            $.each(response.data, function (key) {
                                if (albums_params.name === response.data[key].name) {
                                    AlbumsID = response.data[key].id;
                                    return false;
                                }
                            });
                            // If not exist, make a new one
                            if (AlbumsID === "") {
                                PatwFB.API('/me/albums', 'POST', albums_params,

                                    function Success(response) {
                                        PatwFB.log('Make a new album success!');

                                        // upload
                                        PatwFB.API('/' + response.id + '/photos', 'POST', photos_params,

                                            function Success(response) {

                                                // If has tag params
                                                if (tags_params.length !== 0) {

                                                    PatwFB.API('/' + response.id + '/tags', 'POST', tags_params,

                                                        function (response) {
                                                            PatwFB.log('Publish photo with tags success!');
                                                            if (successEvent) {
                                                                successEvent(response);
                                                            }
                                                        },
                                                        function (response) {
                                                            PatwFB.log('Publish photo with tags failed!');
                                                            if (failedEvent) {
                                                                failedEvent(response);
                                                            }
                                                        }
                                                        );
                                                } else { // no tag
                                                    PatwFB.log('Publish photo success!');
                                                    if (successEvent) {
                                                        successEvent(response);
                                                    }

                                                }
                                            },
                                            function Failed(response) {
                                                PatwFB.log('Publish photo failed!');
                                                if (failedEvent) {
                                                    failedEvent(response);
                                                }
                                            });
                                    },

                                       function Failed(response) {
                                        PatwFB.log('Make a new album failed!');
                                        if (failedEvent) {
                                            failedEvent(response);
                                        }
                                    });
                            } else { // find the album
                                // upload
                                PatwFB.API('/' + AlbumsID + '/photos', 'POST', photos_params,

                                    function (response) {
                                        PatwFB.log('Publish the photo to the specific album success!');
                                        if (successEvent) {
                                            successEvent(response);
                                        }
                                    },
                                    function (response) {
                                        PatwFB.log('Publish the photo to the specific album failed!');
                                        if (failedEvent) {
                                            failedEvent(response);
                                        }
                                    });
                            }
                        });
                    } else {
                        alert("please fill the params");
                    }

                } else { // not login
                    PatwFB.Login(

                        function LoginSuccess() {
                            PatwFB.UploadPhoto(albums_params, photos_params,

                                function (response) {
                                    if (successEvent) {
                                        successEvent(response);
                                    }
                                },
                                function (response) {
                                    if (failedEvent) {
                                        failedEvent(response);
                                    }
                                });
                        }
                    );
                }
            });
        }
    };

}());


// Load the SDK Asynchronously
(function (d, s, id) {
    "use strict";
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) {
        return;
    }
    js = d.createElement(s);
    js.id = id;
    js.src = "//connect.facebook.net/en_US/all.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));