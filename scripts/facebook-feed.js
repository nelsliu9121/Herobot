'use strict'

/**
 * Facebook Feed
 * TODO: Option - Custom pages
 * TODO: Option - Only fetch posts with images
 */

var request = require('request');
var jsdom = require('jsdom');
var jquery = 'https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js'

module.exports = function(robot) {
  var linkDelay = 30;

  function scrape(body, selectors, callback) {
    return jsdom.env(body, [jquery], function(errors, window) {
      var selector;
      return callback((function() {
        var i, len, results1;
        results1 = [];
        for (i = 0, len = selectors.length; i < len; i++) {
          selector = selectors[i];
          results1.push(window.$(selector));
        }
        return results1;
      })());
    });
  }

  function fetchPage(msg) {
    var url = 'https://m.facebook.com/kobeengineer/';
    return request({
      url: url,
      headers: {
        'User-Agent': 'hubot'
      }
    }, function(err, res, body) {
      if (err) {
        console.log("Errors getting url: " + url);
        return;
      }
      return scrape(body, ['#recent div div:first div:nth-child(2) div:nth-child(2) a', 'dl.about-section dd:nth-child(2)'], function(result) {
        if (result[0] !== '') {
          robot.logger.info('Sending message to room: ' + msg.message.room);
          return robot.emit(
            'telegram:invoke',
            'sendMessage', {
              chat_id: msg.message.room,
              text: '[link](https://facebook.com' + result[0].attr('href') + ')',
              parse_mode: 'Markdown'
            }, function (error, response) {
              if (error) {
                robot.logger.error(error);
              }
              robot.logger.debug(response);
          });
        } else if (result[1] !== '') {

        } else {
          return robot.logger.warning("Errors scraping url: " + url);
        }
      });
    });
  }

  robot.hear(/fetch/i, fetchPage);
}
