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
		text = "http://lmgtfy.com/?q=#{escape(res.match[2])}"
		text += "\n@#{res.match[1]}, let me Google that for you." if res.match[1]

		res.send text
