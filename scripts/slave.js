/**
 * A slave who is only loyal to Master Yonsh.
 */

module.exports = function(robot) {
  robot.respond(/slave/i, function(res){
    var msg;
    if (res.message.user.name === "YonshLin") {
      msg = "Your wish is my command, Master " + res.message.user.first_name + ".";
    } else {
      msg = "YOU'RE NO MASTER OF MINE, WORM!";
    }

    res.send(msg);
  });
}
