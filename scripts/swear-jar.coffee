# Description:
#   Hubot that does not take unspeakables easily, and it's gonna make you pay for it.
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   hubot swearjar accuse @user -
#   hubot swearjar list [@user] -
#   (hear) unspeakable word
#
# Author:
#   github.com/nelsliu9121
#

unspeakables = [
	"fuck",
	"dick",
	"幹你",
	"賤"
]

module.exports = (robot) ->
	robot.brain.on "loaded", =>
		if robot.brain.data.swearjar_database is undefined
			robot.brain.data.swearjar_database = {
				collective: 0,
				checkbooks: {},
				unspeakables: unspeakables
			}
		unspeakableExp = new RegExp(robot.brain.data.swearjar_database.unspeakables.join("|"), "i")

	newCheck = (who, amount) ->
		robot.brain.data.swearjar_database.checkbooks[who] = [] if robot.brain.data.swearjar_database.checkbooks[who] is undefined
		robot.brain.data.swearjar_database.checkbooks[who].push
			name: who
			amount: parseFloat(amount)
		robot.brain.data.swearjar_database.collective += parseFloat(amount)
		robot.brain.save()

	robot.hear unspeakableExp, (res) ->
		check = (Math.random() * 10).toFixed(2)
		newCheck res.message.user.name, check

		robot.emit 'telegram:invoke', 'sendMessage',
			chat_id: res.message.room
			text: "@#{res.message.user.name}講髒話要罰你付#{check}元到髒話桶裡面！"
			reply_to_message_id: res.message.id

	robot.respond /swearjar accuse\s(@.*)/, (res) ->
		check = (Math.random() * 10).toFixed(2)
		newCheck res.message.user.name, check
		res.reply "我知道了，@#{res.match[1]}壞壞！"
		res.send "@#{res.match[1]}！你講髒話要罰你付#{check}元到髒話桶裡面！"

	robot.respond /swearjar list\s?(.*)+?/i, (res) ->
		if res.match[1]
			checkbook = robot.brain.data.swearjar_database.checkbooks[res.match[1]]
			if checkbook is undefined
				balance = 0
			else
				balance = checkbook.reduce (prev, curr) -> prev.amount += curr.amount
		else
			for checkbook, name in robot.brain.data.swearjar_database.checkbooks
				balance = checkbook.reduce (prev, curr) -> prev.amount += curr.amount

		robot.emit 'telegram:invoke', 'sendMessage',
			chat_id: "@#{name}"
			text: "@#{name}：*#{balance}*元"
			parse_mode: "markdown"

	robot.respond /swearjar unspeakable\s(.+)?/i, (res) ->
		if res.match[1]
			existed = robot.brain.data.swearjar_database.unspeakables.findIndex (d) -> d is res.match[1]
			return res.reply "#{res.match[1]}已經在髒話收錄名單了" unless existed == -1

			robot.brain.data.swearjar_database.unspeakables.push res.match[1]
			robot.brain.save()
			res.reply "#{res.match[1]}已收錄"
