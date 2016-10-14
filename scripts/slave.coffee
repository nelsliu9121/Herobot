# Description:
#   A slave who is only loyal to Master Yonsh.
#

module.exports = (robot) ->
  robot.respond /slave/i, (res) ->
  	res.send(
      if res.message.user.name is "YonshLin"
        "Your wish is my command, Master #{res.message.user.first_name}"
      else
        "YOU'RE NOT MY MASTER, WORM!"
    )
