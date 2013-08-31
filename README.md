patw's jQuery Facebook JS SDK Library
========================

Facebook JavaScript SDK Library plugin for jQuery


Download
---
Current version: 1.2 ( Released under the MIT License | GitHub )

Tested in: jQuery 1.8.3 in Chrome.


Usage
---
You need to include jquery.min.js (at least 1.7.2 version) first, and then add these code:

```javascript
$(function() {
	// AppID
	PatwFB.appId = '360261570721073';
	// Init
	PatwFB.init();
	// scope. reference: https://developers.facebook.com/docs/reference/api/permissions/
	PatwFB.scope = "publish_stream,user_likes,email,user_photos,read_stream";
});
```

Demo
---
http://labs.patw.idv.tw/facebookjs/

https://apps.facebook.com/patwjslibrary/


