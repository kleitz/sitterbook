// POINTS
// ===================================
// areFriends
	var areFriends = 40;
// lastSeen
	var lastSeenMax = 50,
			maxTime = 13;
// schedMatchPoints
	var oneMatch = 100,
			multiMatch = 150;
// mutualFriendsPoints
	var mfMultiplier = 1,
			maxMf = 50;
// ===================================
// Make sure the total includes the maximum number of points
var maxPoints = areFriends + lastSeenMax + multiMatch + (maxMf * mfMultiplier);
// ===================================

exports.maxPoints = maxPoints;
exports.areFriends = areFriends;
exports.lastSeen = function (lastLogin) {
  // "2016-01-19 21:06:11 +0000"
  var msLastLogin = Date.parse(lastLogin);
  var timeNow = Date.now();
  var timeDiff = timeNow - msLastLogin;
  var ms2days = 86400000,
      ms2hours = 3600000,
      ms2minutes = 60000,
      ms2seconds = 1000;
  var diffdays = Math.floor(timeDiff / ms2days);
  var diffhours = Math.floor((timeDiff % ms2days) / ms2hours);
  var diffminutes = Math.floor((timeDiff % ms2hours) / ms2minutes);
  var diffseconds = Math.floor((timeDiff % ms2minutes) / ms2seconds);
  console.log("Time since last seen:", diffdays, "days,", diffhours, "hours,", diffminutes, "minutes,", diffseconds, "seconds.");
  var score;
  if (diffdays >= maxTime) {
    score = 0;
  } else if (diffdays === 0) {
    score = lastSeenMax;
  } else { // timeDiff between 1 - 14 days
    score = Math.floor((1 - (Math.log(timeDiff / ms2days) / Math.log(maxTime))) * lastSeenMax); // points go from lastSeenMax - 0
  };
  console.log("Score:", score);
  return score;
};
exports.schedMatchPoints = function (schedMatches) {
  var points = 0;
  // change these numbers to balance the cnxScore. One schedule match gives the first value, more matches gives a fix additional amount
  if (schedMatches === 1) { 
    points = oneMatch;
  } else if (schedMatches > 1) {
    points = multiMatch;
  };
  console.log("Adding", points.toString(), "points to the cnxScore due to", schedMatches.toString(), "schedule matches.");
  return points;
};
exports.mutualFriendsPoints = function (numberOfMutual) {
  var points = 0;
  if (numberOfMutual > 0) {
    points = numberOfMutual * mfMultiplier;
  }
  if (numberOfMutual > maxMf) {
    points = maxMf * mfMultiplier;
  }
  console.log("Adding", points, "points for", numberOfMutual,  "mutual friends");
  return points;
};




