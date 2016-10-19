# Description:
#   Hubot that does not take french easily, and it's gonna make you pay for it.
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   hubot accuse @user -
#   (hear) french word
#
# Author:
#   github.com/nelsliu9121
#

frenchwords = [
	"fuck"
]

module.exports = (robot) ->
	frenchExp = new RegExp("["+frenchwords.join(",")+"]", "i")

	robot.brain.on "loaded", =>
		if robot.brain.data.swear_jar_database is undefined
			robot.brain.data.swear_jar_database = {
				collective: 0,
				checkbooks: []
			}

	robot.hear frenchExp, (res) ->
		check = (Math.random() * 10).toFixed(2)
		robot.brain.data.swear_jar_database.checkbooks[res.message.user.name].push
			name: res.message.user.name
			amount: parseFloat(check)

		robot.emit 'telegram:invoke', 'sendMessage',
			chat_id: res.message.room
			text: "#{res.message.user.name} is charged with $#{check}."
			reply_to_message_id: res.message.id
			parse_mode: 'string'

	robot.respond /accuse\s(@[a-zA-Z0-9\_])/, (res) ->
		res.reply "我知道了，@#{res.match[1]}壞壞！"
		res.send "@#{res.match[1]}！"
