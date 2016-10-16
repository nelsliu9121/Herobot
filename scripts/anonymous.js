// Description:
//   Anonymously send post to certain room
//
// Configuration:
//   HUBOT_TELEGRAM_ANONYMOUS_ROOM_ID: required, target room id

var roomId = process.env.HUBOT_TELEGRAM_ANONYMOUS_ROOM_ID;

if (roomId != null) {
  module.exports = function(robot) {
    var flag = [];   // 0: None, 1: Sticker

    robot.listen(function(msg) {
      return flag[msg.user.id] != null && flag[msg.user.id] != 0;
    }, function(res) {
      switch (flag[res.message.user.id]) {
        case 1:
          try {
            var sticker = res.message.message.sticker.file_id;

            robot.emit(
              'telegram:invoke',
              'sendSticker', {
                chat_id: roomId,
                sticker: sticker,
              }, function (error, response) {
                if (error) {
                  robot.logger.error(error);
                }
                robot.logger.debug(response);
            });

          } catch (err) {
            console.log(err);
            res.send("Anonymous Sticker: Error, please try again.");
          } finally {
            flag[res.message.user.id] = 0;
          }
          break;
      }
    });

    robot.respond(/anon /i, function(res){
      if (roomId === res.message.room) {
        return;
      }

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

    robot.respond(/anonsticker/i, function(res){
      if (roomId === res.message.room) {
        return;
      }

      flag[res.message.user.id] = 1;

      res.send("Anonymous Sticker: OK, please send a sticker to me.")

    });
  }
}
