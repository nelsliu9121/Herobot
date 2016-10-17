// Description:
//   A slave who is only loyal to Master Yonsh.

module.exports = function(robot) {
	robot.brain.on("loaded", function(){
		if (robot.brain.data.master_database == undefined) {
			robot.brain.data.master_database = {
				"YonshLin": "Master Yonsh",
				"nelsliu": "Lord"
			};
		}
	});

	robot.respond(/slave/i, function(res){
		var msg;
		if (res.message.user.name === "YonshLin") {
			msg = "Your wish is my command, Master @" + res.message.user.first_name + ".";
		} else {
			msg = "YOU'RE NO MASTER OF MINE, WORM!";
		}

		res.send(msg);
	});

	robot.respond(/summon/i, function(res){
		var master = robot.brain.data.master_database[res.message.user.name] || "Master";

		res.send("How may I be at your service, " + master + "?");
	});

	robot.respond(/call me\s+(\w+)?/i, function(res){
		if (res.match[1]) {
			robot.brain.data.master_database[res.message.user.name] = res.match[1];
			res.send("Yes, I will call you "+ res.match[1] + " from now on.");
		} else {
			var master = robot.brain.data.master_database[res.message.user.name] || "Master";
			res.send("I do not know what to call you but " + master + ".");
		}
	});

	robot.respond(/punish/i, function (res) {
		var master = robot.brain.data.master_database[res.message.user.name] || "Master";
		res.send("Oh please " + master + ", please punish me.");
	});
}
