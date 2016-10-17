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
	constructor: (wish) ->
		@id = wish.id
		@wish = wish.wish
		@wisher = wish.wisher
		@fulfiller = wish.fulfiller
		@assignee = wish.assignee or wish.wisher
		@rejector = wish.rejector
		@fulfilled = wish.fulfilled
		@rejected = wish.rejected

	fulfill: (@fulfiller) ->
		@fulfilled = true

	assign: (assignee, actor) ->
		@assignee = assignee if @assignee is actor else false

	reject: (rejector) ->
		if @assignee is rejector
			@rejected = true
			@rejector = rejector
		else
			false

	toString: ->
		template = "[#{@id}] #{@wish} by @#{@wisher}"
		template += " \u2713 #{@fulfiller}" if @fulfilled
		template += " \u2717" if @rejected
		return template

module.exports = (robot) ->
	robot.brain.on "loaded", =>
		if robot.brain.data.wish_database is undefined
			robot.brain.data.wish_database = {
				next_id: 0,
				wishes: []
			}
		else
			wishes = []
			for wish in robot.brain.data.wish_database.wishes
				wishes.push new Wish(wish)
			robot.brain.data.wish_database.wishes = wishes

	robot.hear /make wish\s(.*)$/i, (res) ->
		if res.match[1]
			for wish in robot.brain.data.wish_database.wishes
				if wish.wish == res.match[1]
					res.send "You made the wish already."
					return
			wish = new Wish
				id: robot.brain.data.wish_database.next_id++
				wish: res.match[1]
				wisher: res.message.user.name
			robot.brain.data.wish_database.wishes.push wish
			robot.brain.save()
			res.send "Your wish will be fulfilled."
		else
			res.send "Please make you wish again, Master."

	robot.hear /take back wish\s(\d+)/i, (res) ->
		isHit = false
		for wish, i in robot.brain.data.wish_database.wishes
			if wish.id is parseInt(res.match[1])
				robot.brain.data.wish_database.wishes.splice i, 1
				robot.brain.save()
				res.send "Wish is removed, Master."
				isHit = true
				break
		res.send "There's no wish." unless isHit

	robot.hear /list wish(es)?/i, (res) ->
		for wish in robot.brain.data.wish_database.wishes
			res.send wish.toString()

	robot.hear /fulfill wish\s(\d+)/i, (res) ->
		isHit = false
		for wish in robot.brain.data.wish_database.wishes
			if wish.id is parseInt(res.match[1])
				if wish.fulfilled is true
					res.send "The wish is already fulfilled."
					isHit = true
					break
				wish.fulfill res.message.user.name
				robot.brain.save()
				res.send "@#{wish.wisher}, your wish is fulfilled by @#{res.message.user.name}"
				isHit = true
				break
		res.send "There's no wish to fulfill." unless isHit

	robot.hear /assign wish\s(\d+) to \@([A-Za-z0-9]+)/i, (res) ->
		isHit = false
		for wish in robot.brain.data.wish_database.wishes
			if wish.id is parseInt(res.match[1])
				wish.assign res.match[2]
				robot.brain.save()
				res.send "The wish will be fulfilled by @" + res.match[2]
				isHit = true
				break
		res.send "There's no such wish." unless isHit

	robot.hear /make promise to wish\s(\d+)/i, (res) ->
		isHit = false
		for wish in robot.brain.data.wish_database.wishes
			if wish.id is parseInt(res.match[1])
				wish.assign res.message.user.name
				robot.brain.save()
				res.send "@#{res.message.user.name} just make a promise to make @#{wish.wisher}'s wish come true."
				isHit = true
				break
		res.send "There's no such wish." unless isHit

	robot.hear /wish help\s?(\w+)?/i, (res) ->
		res.send """
			*wish help*
			*list wish(es)*
			*make wish* _wish_
			*take back wish #*
			*fulfill wish #*
			*assign wish # to @user*
			*make promise to wish #*
		"""
