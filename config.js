
var config = { };

config.rootUrl  = process.env.ROOT_URL                  || 'http://localhost:3000/';

config.facebook = {
    appId:          process.env.FACEBOOK_APPID          || '844890948956498',
    appSecret:      process.env.FACEBOOK_APPSECRET      || '336b4d1b13438d0bed0bfd00eba2fc98',
    appNamespace:   process.env.FACEBOOK_APPNAMESPACE   || 'SFSitteriOS',
    redirectUri:    process.env.FACEBOOK_REDIRECTURI    ||  config.rootUrl + 'login/callback'
};

module.exports = config;

