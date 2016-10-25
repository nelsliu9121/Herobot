# Description:
#   Tell Hubot to send a user a link to lmgtfy.com
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   hubot lmgtfy <optional @username> <some query>
#
# Author:
#   phlipper

module.exports = (robot) ->
	robot.respond /lmgtfy?\s?(?:@(\w*))? (.*)/i, (res) ->
		if res.match[1]
			res.emit "telegram:invoke", "sendMessage",
				chat_id: "@#{res.match[1]}"
				text: "http://lmgtfy.com/?q=#{escape(res.match[2])}"
		else
			res.send "http://lmgtfy.com/?q=#{escape(res.match[2])}"
