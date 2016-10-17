// Description:
//   Anonymously send post to certain room
//
// Configuration:
//   HUBOT_TELEGRAM_ANONYMOUS_ROOM_ID: required, target room id

var roomId = process.env.HUBOT_TELEGRAM_ANONYMOUS_ROOM_ID;
var botName = process.env.TELEGRAM_BOT_NAME;
var botNameLength = botName ? botName.length : 0;

if (roomId != null) {
  module.exports = function(robot) {
    var flag = [];   // 0: None, 1: Sticker, 2: Markdown

    function purifyMessage(msg) {
      return msg.substring(botNameLength + 1);
    }

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
                sticker: sticker
              }, function (error, response) {
                if (error) {
                  robot.logger.error(error);
                }
                robot.logger.debug(response);
            });

          } catch (err) {
            console.log(err);
            res.send("Anonymous Sticker: Error, please try again.");
          }
          break;
        case 2:
          try {
            var text = purifyMessage(res.message.text);

            robot.emit(
              'telegram:invoke',
              'sendMessage', {
                chat_id: roomId,
                text: text,
                parse_mode: 'Markdown'
              }, function (error, response) {
                if (error) {
                  robot.logger.error(error);
                }
                robot.logger.debug(response);
            });

          } catch (err) {
            console.log(err);
            res.send("Anonymous MarkDown Message: Error, please try again.");
          }
          break;
      }
      flag[res.message.user.id] = 0;
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

    robot.respond(/anonmarkdown/i, function(res){
      if (roomId === res.message.room) {
        return;
      }

      flag[res.message.user.id] = 2;

      robot.emit(
        'telegram:invoke',
        'sendMessage', {
          chat_id: res.message.room,
          text: "Anonymous MarkDown Message: OK, please send a MarkDown message.\n\n" +
                "*bold text*\n" +
                "_italic text_\n" +
                "[text](http://www.example.com/)\n" +
                "`inline fixed-width code`\n" +
                "```text\n" +
                "pre-formatted fixed-width code block\n" +
                "```",
          disable_web_page_preview: 'true'
        }, function (error, response) {
          if (error) {
            robot.logger.error(error);
          }
          robot.logger.debug(response);
      });

    });
  }
}
