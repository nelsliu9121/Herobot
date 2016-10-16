# Description:
#   A script for creating and recalling wishlist by asking the slaves
#
#   Example:
#     hubot makewish Look at me! I'm on TV
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   hubot addquote <phrase or body of text>
#
# Author:
#   Nelson Liu
class Wish
	constructor: (@id, @wish, @wisher) ->
		@fulfiller = undefined
		@fulfilled = false

	fulfill: (fulfiller) ->
		@fulfiller = fulfiller
		@fulfilled = true

	toString: ->
		template = "[#{@id}] #{@wish} by #{@wisher}"
		template += "\u2713" if @fulfilled
		return template

module.exports = (robot) ->
	robot.brain.on "loaded", =>
		robot.brain.data.wish_database = {
			next_id: 0,
			wishes: []
		} if robot.brain.data.wish_database is undefined

	robot.hear /wish make\s?(.*)?$/i, (res) ->
		if res.match[1]
			for wish in robot.brain.data.wish_database.wishes
				if wish.wish == res.match[1]
					res.send "You made the wish already."
					return

			wishId = robot.brain.data.wish_database.next_id++
			robot.brain.data.wish_database.wishes.push(new Wish wishId, res.match[1], res.message.user.name)
			res.send "Your wish will be fulfilled."
		else
			res.send "Please make you wish again, Master."

	robot.hear /wish remove (\d+)?/i, (res) ->
		isHit = false
		for wish, i in robot.brain.data.wish_database.wishes
			if wish.id is parseInt(res.match[1])
				robot.brain.data.wish_database.wishes.splice i, 1
				res.send "Wish is removed, Master."
				isHit = true
				break

		res.send "There's no wish." unless isHit

	robot.hear /wish list/i, (res) ->
		for wish in robot.brain.data.wish_database.wishes
			res.send wish.toString()

	robot.hear /wish fulfill (\d+)?/i, (res) ->
		isHit = false
		for wish in robot.brain.data.wish_database.wishes
			if wish.id is parseInt(res.match[1])
				if wish.fulfilled is true
					res.send "The wish is already fulfilled."
					break

				wish.fulfill res.message.user.name
				res.send wish.wisher + ", your wish is fulfilled by " + res.message.user.name
				isHit = true
				break

		res.send "There's no wish to fulfill." unless isHit
