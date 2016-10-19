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
		if robot.brain.data.swearjar_database is undefined
			robot.brain.data.swearjar_database = {
				collective: 0,
				checkbooks: {}
			}

	newCheck = (who, amount) ->
		robot.brain.data.swearjar_database.checkbooks[who].push
			name: who
			amount: parseFloat(amount)
		robot.brain.save()

	robot.hear frenchExp, (res) ->
		check = (Math.random() * 10).toFixed(2)
		newCheck res.message.user.name, check

		robot.emit 'telegram:invoke', 'sendMessage',
			chat_id: res.message.room
			text: "@#{res.message.user.name}講髒話要罰你付#{check}元到髒話桶裡面！"
			reply_to_message_id: res.message.id

	robot.respond /swearjar accuse\s(@[a-zA-Z0-9\_]+)/, (res) ->
		check = (Math.random() * 10).toFixed(2)
		newCheck res.message.user.name, check
		res.reply "我知道了，@#{res.match[1]}壞壞！"
		res.send "@#{res.match[1]}！你講髒話要罰你付#{check}元到髒話桶裡面！"

	robot.respond /swearjar list\s?@([a-zA-Z0-9\_]+)/i, (res) ->
		for checkbook, name in robot.brain.data.swearjar_database.checkbooks
			balance = checkbook.reduce (prev, curr) -> prev.amount += curr.amount
			robot.emit 'telegram:invoke', 'sendMessage',
				chat_id: "@#{name}"
				text: "@#{name}：*#{balance}*元"
				parse_mode: "markdown"
