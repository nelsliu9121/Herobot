// Description:
//   Anonymously send post to certain room
//
// Configuration:
//   HUBOT_TELEGRAM_ANONYMOUS_ROOM_ID: required, target room id

var roomId = process.env.HUBOT_TELEGRAM_ANONYMOUS_ROOM_ID;

if (roomId != null) {
  module.exports = function(robot) {
    robot.respond(/anon /i, function(res){
      var msg = res.message.text;
      msg = msg.substring(msg.indexOf("anon ") + 5);

      if (msg !== '') {
        robot.emit(
          'telegram:invoke',
          'sendMessage', {
            chat_id: roomId,
            text: msg,
          }, function (error, response) {
            if (error) {
              robot.logger.error(error);
            }
            robot.logger.debug(response);
        });
      }

    });
  }
}
