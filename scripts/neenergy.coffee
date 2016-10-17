instagram = require("instagram-node-lib")

module.exports = (robot) ->
	robot.respond /neenergy/i, (msg) ->
		authenticate(msg)

		instagram.tags.recent
			name: "neenergy"
			count: 1
			complete: (data) ->
				for item in data
					msg.send item['images']['standard_resolution']['url']

authenticate = (msg) ->
	config =
		client_key:     process.env.HUBOT_INSTAGRAM_CLIENT_KEY
		client_secret:  process.env.HUBOT_INSTAGRAM_ACCESS_KEY

	unless config.client_key
		msg.send "Please set the HUBOT_INSTAGRAM_CLIENT_KEY environment variable."
		return
	unless config.client_secret
		msg.send "Please set the HUBOT_INSTAGRAM_ACCESS_TOKEN environment variable."
		return
	instagram.set('client_id', config.client_key)
	instagram.set('client_secret', config.client_secret)
