/*
 * patw's jQuery Facebook JS SDK Library 1.0
 * https://code.google.com/p/patw-facebook-js-library/
 *
 * Copyright (C) 2012 Patrick Wang <patw.hi@gmail.com>
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

var PatwFB = window.PatwFB || {};
(function () {

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
        scope: "",
        perm_cache: [],
        // =====================================================================
        // init
        // =====================================================================
        init: function () {

            PatwFB.channelUrl = window.location.protocol + "//" + window.location.hostname + "/channel.html";
            
            window.fbAsyncInit = function() {
                if ($("fb-root").length == 0) {
                    $('body').append('<div id="fb-root"></div>');
                }

                FB.init({
                    appId: PatwFB.appId,
                    xfbml: PatwFB.xfbml,
                    status: PatwFB.status,
                    cookie: PatwFB.cookie,
                    oauth: PatwFB.oauth
                });

                FB.getLoginStatus(function(response){
                
                    FB.api('/me', function(info) {

                        if (response.authResponse) {
                            var accessToken = response.authResponse.accessToken;
                        }

                    });

                });

                FB.getLoginStatus(PatwFB.updateStatus);
                FB.Event.subscribe('auth.statusChange', PatwFB.updateStatus);	
            }
        },
        updateStatus: function(response) {

            if (response.authResponse) {
                //user is already logged in and connected
                FB.api('/me', function(info) {
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
            if (typeof (console) != 'undefined') {
                console.log(msg);
            }
        },
        isEmpty: function (obj) {
            for (var prop in obj) {
                if (obj.hasOwnProperty(prop)) {
                    return false;
                }
            }
            return true;
        },
        // =====================================================================
        // Check the permissions we ask are same as the app's permission or not
        // =====================================================================
        CheckPerm: function (perm_list) {

            FB.api('/me/permissions', function (response) {
                var permsArray = response.data[0];
                var permsNeeded = [];
                permsNeeded = PatwFB.scope.split(",");

                var permsToPrompt = [];
                for (var i in permsNeeded) {
                    if (permsArray[permsNeeded[i]] == null) {
                        permsToPrompt.push(permsNeeded[i]);
                    }
                }

                if (permsToPrompt.length > 0) {
                    PatwFB.log('Need to re-prompt user for permissions: ' + permsToPrompt.join(','));
                    return false;
                } else {
                    PatwFB.log("No need to prompt for any permissions");
                    return true;
                }
            });
        },
        // =====================================================================
        // Ask permissions
        // =====================================================================
        requestPerm: function (perm_list) {
            if (!PatwFB.CheckPerm(perm_list)) {
                this.request_perm_count++;
                if (this.request_perm_count > 1) {
                    this.request_perm_count = 0;
                } else {
                    this.scope = perm_list;
                    PatwFB.Login();
                }
                return false;
            } else {
                return true;
            }
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
        Login: function (Success_callback, fail_callback) {
            FB.login(function (response) {
                PatwFB.CheckPerm(PatwFB.scope);

                if (response.authResponse) {

                    PatwFB.userInfo();
                    PatwFB.uid = response.authResponse.userID;
                    PatwFB.accessToken = response.authResponse.accessToken;

                    if (typeof (Success_callback) != 'undefined') {
                        FB.api('/me', function (response) {
                            Success_callback(response);
                        });
                    }
                } else {

                    if (typeof (fail_callback) != 'undefined') {
                        fail_callback(response);
                    } else {
                        PatwFB.log("login failed");
                        PatwFB.log(response);
                    }
                }
            }, {
                scope: PatwFB.scope
            });
        },
        Logout: function (Callback) {
            FB.logout(function(response) {
                PatwFB.log("user is now logged out");

                if (typeof(Callback)) {
                    Callback(response);
                }
            });
        },
        // =====================================================================
        // FB.api
        //   path: such as "/me"
        //   method: POST / GET
        //   params: Object.
        //   SuccessEvent: Success callback
        //   FailedEvent: Failed callback
        // =====================================================================
        API: function (path, method, params, SuccessEvent, FailedEvent) {
            FB.api(path, method, params, function (response) {
                if (!response || response.error) {
                    if (typeof (FailedEvent) != 'undefined') {
                        FailedEvent(response);
                    }
                } else {
                    if (typeof (SuccessEvent) != 'undefined') {
                        SuccessEvent(response);
                    }
                }
            });

        },
        // =====================================================================
        // FB.ui
        // =====================================================================
        UI: function (params, SuccessEvent, FailedEvent) {
            FB.ui(params, function (response) {
                if (!response || response.error) {
                    if (typeof (FailedEvent) != 'undefined') {
                        FailedEvent(response);
                    }
                } else {
                    if (typeof (SuccessEvent) != 'undefined') {
                        SuccessEvent(response);
                    }
                }
            });
        },
        // =====================================================================
        // FQL
        // =====================================================================
        FQL: function (query, SuccessEvent) {
            FB.api({
                method: 'fql.query',
                query: query
            },

            function (response) {
                if (typeof (SuccessEvent) != 'undefined') {
                    SuccessEvent(response);
                }
            });
        },
        // =====================================================================
        // Retrieve how many times a URL has been shared
        //   (Don't need Facebook connect)
        //
        //   url: the URL address
        // =====================================================================
        RetrieveURLShareCount: function (url, callback) {

            $.getJSON("http://graph.facebook.com/" + url, function (data) {
                var count = 0;
                count = data["shares"];

                if ( typeof(callback) != "undefined" )
                {
                    callback(count);
                }
            });
        },
        // =====================================================================
        // Check the user is some page's fans or not
        // 
        //   PageID: Fanpage's ID
        //   TrueEvent: If the user is a fan, the callback event.
        //   FalseEvent: If not, the callback event.
        // =====================================================================
        isFan: function (PageID, TrueEvent, FalseEvent) {

            FB.getLoginStatus(function (response) {
                if (response.authResponse) {

                    PatwFB.CheckPerm(PatwFB.scope);

                    FB.api('/me/likes/' + PageID, function (response) {
                        if (response.data) {
                            if (!PatwFB.isEmpty(response.data)) {
                                if (typeof (TrueEvent) != 'undefined') {
                                    TrueEvent(response.data);
                                }
                            } else {
                                PatwFB.log(response);
                                if (typeof (FalseEvent) != 'undefined') {
                                    FalseEvent();
                                }
                            }
                        } else {
                            PatwFB.log(response);
                            if (typeof (FalseEvent) != 'undefined') {
                                FalseEvent();
                            }
                        }
                    });
                } else {
                    PatwFB.Login(isFan);
                }
            });
        },
        // =====================================================================
        // Retrieve the user's information
        // =====================================================================
        userInfo: function (Callback) {

            FB.getLoginStatus(function (response) {
                if (response.authResponse) {
                    
                    PatwFB.CheckPerm(PatwFB.scope);

                    FB.api("/me", function (response) {
                        PatwFB.log(response);
                        PatwFB.me = response;
                        
                        if ( typeof(Callback) != "undefined" )
                        {
                            Callback(response);
                        }
                    });

                } else {
                    PatwFB.Login(
                    function LoginSuccess(response) {
                        PatwFB.userInfo();
                    });
                }
            });

        },
        // =====================================================================
        // Publish
        // =====================================================================
        Publish: function (params, SuccessEvent, FailedEvent) {
            
            FB.getLoginStatus(function (response) {
                if (response.authResponse) {
                    
                    PatwFB.CheckPerm(PatwFB.scope);

                    if (typeof (params) != 'undefined') {
                        PatwFB.API('/me/feed', 'POST', params, SuccessEvent, FailedEvent);
                    } else {
                        alert("please fill the params");
                    }

                } else {
                    PatwFB.Login(

                    function LoginSuccess(response) {
                        PatwFB.Publish(params, SuccessEvent, FailedEvent);
                    });
                }
            });

        },
        // =====================================================================
        // Publish (with Dialog)
        // =====================================================================
        PublishUI: function (params, SuccessEvent, FailedEvent) {
            
            FB.getLoginStatus(function (response) {
                if (response.authResponse) {
                    
                    PatwFB.CheckPerm(PatwFB.scope);

                    if (typeof (params) != 'undefined') {
                        PatwFB.UI(params, SuccessEvent, FailedEvent);
                    } else {
                        alert("please fill the params");
                    }

                } else {
                    PatwFB.Login(

                    function LoginSuccess(response) {
                        PatwFB.PublishUI(params, SuccessEvent, FailedEvent);
                    });
                }
            });

        },
        // =====================================================================
        // Checkin
        // =====================================================================
        Checkin: function (params, SuccessEvent, FailedEvent) {
            // 檢查授權狀態
            FB.getLoginStatus(function (response) {
                if (response.authResponse) {
                    // 檢查權限是否相符
                    PatwFB.CheckPerm(PatwFB.scope);

                    if (typeof (params) != 'undefined') {
                        PatwFB.API('/me/checkins', 'POST', params, SuccessEvent, FailedEvent);
                    } else {
                        alert("please fill the params");
                    }

                } else {
                    PatwFB.Login(

                    function LoginSuccess(response) {
                        PatwFB.Checkin(params, SuccessEvent, FailedEvent);
                    });
                }
            });

        },
        // Invite Friends
        // FYI: https://developers.facebook.com/docs/reference/dialogs/requests/
        //
        // params:
        //  redirect_uri: Required, but automatically specified by most SDKs.
        //  message: Required. Maximum length is 60 characters.
        //  to: A user ID or username. This may or may not be a friend of the user. 
        //      If this is omitted, the user will see a Multi Friend Selector and will be able to select a maximum of 50 recipients.
        //  filters: Optional. all, app_users ,or app_non_users
        //  exclude_ids: A array of user IDs that will be excluded from the Dialog, for example:exclude_ids: [1, 2, 3]
        //  max_recipients: An integer that specifies the maximum number of friends that can be chosen by the user in the friend selector.
        //                  This parameter is not supported on mobile devices.
        //  data:
        //  title: Optional, the title for the Dialog. Maximum length is 50 characters.
        InviteFriend: function (params, CallbackEvent) {

            FB.getLoginStatus(function (response) {
                if (response.authResponse) {

                    PatwFB.CheckPerm(PatwFB.scope);

                    if (typeof (params) != 'undefined') {

                        var defaults = {
                            method: 'apprequests'
                        };
                        var opts = $.extend(defaults, params);
                        FB.ui(opts, function (callback) {
                            if (typeof (CallbackEvent) != 'undefined') {
                                CallbackEvent(callback);
                            }
                        });

                    } else {

                        alert("please fill the params. At least have: method:apprequests and message.");

                    }

                } else {
                    PatwFB.Login(

                    function LoginSuccess(response) {
                        PatwFB.Checkin(params, SuccessEvent, FailedEvent);
                    });
                }
            });

        },
        // =====================================================================
        // Upload photo
        // =====================================================================
        UploadPhoto: function (albums_params, photos_params, tags_params, SuccessEvent, FailedEvent) {

            FB.getLoginStatus(function (response) {

                if (response.authResponse) {

                    PatwFB.CheckPerm(PatwFB.scope);

                    if ((PatwFB.scope).indexOf("user_photos") == -1) {
                        PatwFB.log("API need 'user_photos' permission to check album is exist or not.");
                        return;
                    }

                    if ((PatwFB.scope).indexOf("publish_stream") == -1) {
                        PatwFB.log("API need 'publish_stream' permission to publish photo.");
                        return;
                    }

                    if (typeof (albums_params) != 'undefined') {
                        // Check the album is exist or not
                        FB.api('/me/albums', function (response) {
                            var AlbumsID = "";
                            $.each(response.data, function (key, value) {
                                if (albums_params['name'] == response.data[key].name) {
                                    AlbumsID = response.data[key].id;
                                    return false;
                                }
                            });
                            // If not exist, make a new one
                            if (AlbumsID == "") {
                                PatwFB.API('/me/albums', 'POST', albums_params,

                                function Success(response) {
                                    // upload
                                    PatwFB.API('/' + response.id + '/photos', 'POST', photos_params,

                                    function Success(response) {

                                        // If has tag params
                                        if (tags_params.length != 0) {

                                            PatwFB.API('/' + response.id + '/tags', 'POST', tags_params, 
                                                function(response){
                                                    if (typeof (SuccessEvent) != 'undefined') {
                                                        SuccessEvent(response);
                                                    }
                                                }, 
                                                function(response){
                                                    if (typeof (FailedEvent) != 'undefined') {
                                                        FailedEvent(response);
                                                    }
                                                });
                                            
                                        } else {

                                            if (typeof (SuccessEvent) != 'undefined') {
                                                SuccessEvent(response);
                                            }
                                            
                                        }
                                    },
                                    function(response){
                                        if (typeof (FailedEvent) != 'undefined') {
                                            FailedEvent(response);
                                        }
                                    });
                                },
                                function(response){
                                    if (typeof (FailedEvent) != 'undefined') {
                                        FailedEvent(response);
                                    }
                                });
                            } else {
                                // upload
                                PatwFB.API('/' + AlbumsID + '/photos', 'POST', photos_params, 
                                    function(response){
                                        if (typeof (SuccessEvent) != 'undefined') {
                                            SuccessEvent(response);
                                        }
                                    }, 
                                    function(response){
                                        if (typeof (FailedEvent) != 'undefined') {
                                            FailedEvent(response);
                                        }
                                    });
                            }
                        });
                    } else {
                        alert("please fill the params");
                    }

                } else {
                    PatwFB.Login(

                    function LoginSuccess(response) {
                        PatwFB.UploadPhoto(albums_params, photos_params,
                            function(response){
                                if (typeof (SuccessEvent) != 'undefined') {
                                    SuccessEvent(response);
                                }
                            }, 
                            function(response){
                                if (typeof (FailedEvent) != 'undefined') {
                                    FailedEvent(response);
                                }
                            });
                    });
                }
            });

        }
    }

} ());


// Load the SDK Asynchronously
(function(d){
    var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
    if (d.getElementById(id)) {return;}
    js = d.createElement('script'); js.id = id; js.async = true;
    js.src = "//connect.facebook.net/zh_TW/all.js";
    ref.parentNode.insertBefore(js, ref);
}(document));