# SitterBook Node.js Server

## iOS app to find baby-sitters or children to sit through facebook friends

The app connects you through the facebook api. Currently we connect you with friends and friends of friends as well as app users.

The connections are ordered on degree of connection. First degree are prioritized over second degree friends.
We give a score to the strength of the connection from how many mutual friends you have.
We add to the score for users who recently used the app and we match the schedules of both users.

We only facilitate the possibility to connect with a sitter or with the parents of a child to sit. We do not handle any compensation or background check. Please only connect with people you trust.


## Technology

We use Node.js, firebase and Swift.

### Node.js 
The backend was based on the NodeJS Library for Facebook by Thuzi LLC <pshrestha@thuzi.com> (https://github.com/Thuzi)

** app.js ** is the heart of the server.

### Firebase
Our Firebase database acts as an API between the client and the server. When user logs in the lastLogin field is updated and a listener on the server refreshes that user's connection data.

### Swift
The client is an iOS app written in Swift.





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