
var express   = require('express'),
    FB        = require('fb'),
    http      = require('http'),
    path      = require('path'),
    crypto    = require('crypto'),

    Firebase  = require("firebase"),
    ref       = new Firebase("https://sitterbookapi.firebaseio.com"),
    userRef   = new Firebase("https://sitterbookapi.firebaseio.com/users"),

    config    = require('./config');

var app = express();

console.log("app:", app);

if(!config.facebook.appId || !config.facebook.appSecret) {
    throw new Error('facebook appId and appSecret required in config.js');
}

app.configure(function() {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'ejs');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.cookieParser());
    app.use(express.cookieSession({ secret: 'secret'}));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
    app.use(express.errorHandler());
});

app.get('/', function(req, res) {
  res.render('index');
});


var sitters = {};
var parents = {};
var dontRunOnStart = true;
var dontRunOnStartCounter = 0;
var stockImage = "http://decaturilmoms.com/wp-content/uploads/2011/06/babysitter.jpg";

userRef.once('value', function (snapshot) {
  console.log("all users count:", snapshot.key().length);
  dontRunOnStartCounter = snapshot.key().length;
  userRef.on('child_added', function (snapshot) {
    childRef = snapshot.ref();
    childRef.child('lastLogin').on("value", onChange);
  });
});


function onChange(snapshot) {
  if (dontRunOnStart) {
    console.log("Setting up Firebase listeners for each user:", dontRunOnStartCounter);
    if (dontRunOnStartCounter < 2) {
      dontRunOnStart = false;
    } else {
      dontRunOnStartCounter -= 1;
    };
  } else {
    var childRef = snapshot.ref();
    var currentUser = childRef.parent();
    var currentUserID = currentUser.key();
    var currentUserRef = currentUser.ref();
    var currentUserID,
        currentUserData;
    currentUserRef.once('value', function (snapshotUser){
      currentUserData = snapshotUser.val();
      currentUserID = snapshotUser.key();
    }, function (errorObject) {
      console.log("Couldn't get all users: " + errorObject.code);
    });
    console.log("=========================================================");
    console.log("=========================================================");
    console.log("CurrentUser:", currentUserData.userName, "id:", currentUserID);
    var userIDs = [];
    var allUsers;
    userRef.once("value", function(users){
      allUsers = users;
    }, function (errorObject) {
      console.log("Couldn't get all users: " + errorObject.code);
    });
    if (currentUserData.parent) { // find sitters
      console.log("=== Finding Sitters ===");
      sitters[currentUserID] = {};
      currentUserRef.update({sitterList: ""}); // delete old list
      allUsers.forEach(function(user) {
        var userID = user.key();
        var userData = user.val();
        var userZips = userData.zip.split(",");
        if (userID !== currentUserID && userData.sitter === true && userZips.indexOf(currentUserData.parent) > -1) {
          userIDs.push(userID);
          sitters[currentUserID][userID] = {userName: userData.userName || "baby-sitter", profileImgUrl: userData.profileImgUrl || stockImage};
        };
      });
      match(currentUserID, currentUserData.token, userIDs, true);
    } else { // find parents
      console.log("=== Finding Parents ===", currentUserID);
      parents[currentUserID] = {};
      console.log("parents", parents);
      currentUserRef.update({parentList: ""}); // delete old list
      if (typeof currentUserData.zip !== 'undefined') {
        currentSitterZips = currentUserData.zip.split(',');
        allUsers.forEach(function(user) {
          var userID = user.key();
          var userData = user.val();
          if (userID !== currentUserID && currentSitterZips.indexOf(userData.parent) > -1) {
            userIDs.push(userID);
            parents[currentUserID][userID] = {userName: userData.userName || "parent", profileImgUrl: userData.profileImgUrl || stockImage};
          };
        });
        match(currentUserID, currentUserData.token, userIDs, false);
      };
    };
  };
}

function match(currentUserID, token, matchingIDs, lookingForSitters) {
  console.log("Looking for sitters?", lookingForSitters);
  console.log("All IDs:", matchingIDs);
  matchingIDs.forEach(function(user){ 
    if (lookingForSitters) {
      areFriends(currentUserID, user, token, lookingForSitters);
    } else {
      areFriends(user, currentUserID, token, lookingForSitters);
    };
  });
}

function areFriends(parentID, sitterID, token, lookingForSitters) {
  if (lookingForSitters) { // looking for sitters
    var are_friends_API_call = "/" + parentID + "/friends/" + sitterID;
  } else { // looking for parents
    var are_friends_API_call = "/" + sitterID + "/friends/" + parentID;
  };
  FB.api(are_friends_API_call, {
    access_token: token
  }, function (response) {
    if (response && !response.error && response.data.length) {
      if (lookingForSitters) {
        sitters[parentID][sitterID].degree = 1;
      } else {
        parents[sitterID][parentID].degree = 1;
      };
      mutualFriends_first(parentID, sitterID, token, lookingForSitters);
    } else { // not first degree friends
      if (lookingForSitters) {
        sitters[parentID][sitterID].degree = 2;
      } else {
        parents[sitterID][parentID].degree = 2;
      }; 
      mutualFriends_second(parentID, sitterID, token, lookingForSitters);
    };
  });
}


function mutualFriends_first(parentID, sitterID, token, lookingForSitters) {
  var ID = lookingForSitters ? sitterID : parentID; 
  FB.api("/" + ID, {
    "fields": "context.fields(all_mutual_friends)",
    access_token: token
  }, function (result) {
    if(!result || result.error) {
      console.log("mutual_friends call didn't succeed:", result.error);
    } else {
      console.log("==================================================");
      console.log("Mutual friends for:", lookingForSitters ? sitterID : parentID, lookingForSitters ? sitters[parentID][sitterID].userName : parents[sitterID][parentID].userName);
      var mutualFriends = result.context.all_mutual_friends.data;
      // mutualFriends.forEach(function(friend){
      //   console.log(friend.name);
      //   console.log(friend.picture.data.url);
      // });
      var numberOfMutual = result.context.all_mutual_friends.summary.total_count;
      if (lookingForSitters) {
        sitters[parentID][sitterID].numberOfMutual = numberOfMutual;
        sitters[parentID][sitterID].mutualFriends = mutualFriends;
        sitters[parentID][sitterID].cnxScore = numberOfMutual;
        console.log("first degree sitter-data:", sitters[parentID][sitterID]);
      } else {
        parents[sitterID][parentID].numberOfMutual = numberOfMutual;
        parents[sitterID][parentID].mutualFriends = mutualFriends;
        parents[sitterID][parentID].cnxScore = numberOfMutual;
        console.log("first degree parent-data:", parents[sitterID][parentID]);
      };
      setSitterList(parentID, sitterID, lookingForSitters); // update the firebase database
    };
  });
}

function mutualFriends_second(parentID, sitterID, token, lookingForSitters) {
  var hmac = crypto.createHmac('sha256', config.facebook.appSecret);
  hmac.update(token);
  appsecret_proof = hmac.digest('hex');
  console.log("appsecret_proof:", appsecret_proof);
  FB.api("/" + (lookingForSitters ? sitterID : parentID), {
    "fields": "context.fields(mutual_friends)",
    access_token: token,
    appsecret_proof: appsecret_proof
  }, function (result) {
    if(!result || result.error) {
      console.log("mutual_friends call didn't succeed:", result.error);
    } else {
      console.log("==================================================");
      console.log("Mutual friends for:", lookingForSitters ? sitterID : parentID, lookingForSitters ? sitters[parentID][sitterID].userName : parents[sitterID][parentID].userName);

      var mutualFriends = result.context.mutual_friends.data;
      // mutualFriends.forEach(function(friend){
      //   console.log(friend.name);
      // });
      var numberOfMutual = result.context.mutual_friends.summary.total_count;
      if (lookingForSitters) {
        sitters[parentID][sitterID].numberOfMutual = numberOfMutual;
        sitters[parentID][sitterID].cnxScore = numberOfMutual;
        sitters[parentID][sitterID].mutualFriends = mutualFriends;
        console.log("second degree sitter-data:", sitters[parentID][sitterID]);
      } else {
        parents[sitterID][parentID].numberOfMutual = numberOfMutual;
        parents[sitterID][parentID].cnxScore = numberOfMutual;
        parents[sitterID][parentID].mutualFriends = mutualFriends;
        console.log("second degree parent-data:", parents[sitterID][parentID]);
      };

      setSitterList(parentID, sitterID, lookingForSitters); // update the firebase database
    };
  });
}

function setSitterList(parentID, sitterID, lookingForSitters) {
  if (lookingForSitters) {
    sitterListRef = new Firebase("https://sitterbookapi.firebaseio.com/users/" + parentID + "/sitterList/" + sitterID);
    console.log(sitters[parentID][sitterID]);
    sitterListRef.update({
      userName: sitters[parentID][sitterID].userName,
      degree: sitters[parentID][sitterID].degree,
      cnxScore: sitters[parentID][sitterID].cnxScore,
      profileImgUrl: sitters[parentID][sitterID].profileImgUrl,
      numberOfMutual: sitters[parentID][sitterID].numberOfMutual,
      mutualFriends: sitters[parentID][sitterID].mutualFriends
    }); 
  } else {
    parentListRef = new Firebase("https://sitterbookapi.firebaseio.com/users/" + sitterID + "/parentList/" + parentID);
    console.log(parents[sitterID][parentID]);
    parentListRef.update({
      userName: parents[sitterID][parentID].userName,
      degree: parents[sitterID][parentID].degree,
      cnxScore: parents[sitterID][parentID].cnxScore,
      profileImgUrl: parents[sitterID][parentID].profileImgUrl,
      numberOfMutual: parents[sitterID][parentID].numberOfMutual,
      mutualFriends: parents[sitterID][parentID].mutualFriends
    }); 
  }
}

////////////////////////
//// my stuff above ////
////////////////////////

http.createServer(app).listen(app.get('port'), function() {
    console.log("Express server listening on port " + app.get('port'));
});
