# SitterBook Node.js Server


The app needs a **config.js** file with the following information: 
```
var config = { };

config.rootUrl  = process.env.ROOT_URL                  || 'http://localhost:3000/';

config.facebook = {
    appId:          process.env.FACEBOOK_APPID          || {APP_ID},
    appSecret:      process.env.FACEBOOK_APPSECRET      || {APP_SECRET},
    appNamespace:   process.env.FACEBOOK_APPNAMESPACE   || 'SFSitteriOS',
    redirectUri:    process.env.FACEBOOK_REDIRECTURI    ||  config.rootUrl + 'login/callback'
};

module.exports = config;
```