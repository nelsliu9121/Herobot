'use strict'

// Description:
//   Facebook Feed
//
// Configuration:
//   HUBOT_TELEGRAM_FACEBOOK_FEED_INTERVAL: optional, defaults to 120000 (2 minutes)
//
// Author:
//   Yonsh Lin <yonsh@live.com>

var request = require('request');
var jsdom = require('jsdom');
var jquery = 'https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js';

var roomDataPath = 'github.nelsliu9121.herobot/facebook-feed/rooms';
var facebookURL = 'https://facebook.com';
var facebookMobileURL = 'https://m.facebook.com';
var logPrefix = "Facebook Feed: "
var messagePrefix = "*Facebook Feed:*\n\n"

var Subscription = (function() {
  function Subscription(room, page, name, lastLink, imageOnly) {
    this.room = room;
    this.page = page;
    this.name = name || '';
    this.lastLink = lastLink || '';
    this.imageOnly = imageOnly || false;
  }

  function scrape(body, selectors, callback) {
    return jsdom.env(body, [jquery], function(errors, window) {
      var selector;
      return callback((function() {
        var results = [];
        for (var i = 0; i < selectors.length; i++) {
          selector = selectors[i];
          results.push(window.$(selector));
        }
        return results;
      })());
    });
  }

  function getParameters(url) {
    var queryDict = {};
    var strs = url.split('?');
    if (strs.length > 1) {
      strs[1].split('&').forEach(function(item) {
        var kv = item.split('=');
        queryDict[kv[0]] = kv[1];
      });
    }

    return queryDict;
  }

  Subscription.prototype.fetch = function(robot) {
    var self = this;
    var url = facebookMobileURL + '/' + self.page;
    return request({
      url: url,
      headers: {
        'User-Agent': 'hubot'
      }
    }, function(err, res, body) {
      if (err) {
        robot.logger.warning(logPrefix + "Errors getting url: " + url);
        return false;
      }

      var selectors = ['title'];
      for (var i = 1; i <= 5; i++) {
        selectors.push('#recent div div div:nth-child(' + i + ') div:nth-child(2) div:nth-child(2) a');
      }

      return scrape(body, selectors, function(result) {
        var roomId = self.room.id;
        if (result[1].text().trim() !== '') {
          self.name = result[0].text().trim();
          var newPostIndex = result.length - 1;
          for (var i = 1; i < result.length; i++) {
            var link = result[i].attr('href');
            var path = link.split('?')[0];
            var subPaths = path.split('/');

            if (subPaths[1] === self.page) {
              if (subPaths.length > 2) {
                if (subPaths[2] === 'photos') {
                  link = path;
                  result[i].postType = 'photo';
                }
              }
            } else if (subPaths[1] === 'story.php') {
              var params = getParameters(link);
              link = '/' + self.page + '/posts/' + params['story_fbid'];
              result[i].postType = 'story';
            }

            result[i].link = link;

            if (self.lastLink === link) {
              newPostIndex = i - 1;
            }
          }

          for (var i = newPostIndex; i >= 1; i--) {
            if (self.imageOnly && result[i].postType != 'photo') {
              continue;
            }

            var link = result[i].link;
            robot.logger.info('Sending message to room: ' + roomId);
            robot.emit(
              'telegram:invoke',
              'sendMessage', {
                chat_id: roomId,
                text: '[' + self.name + '](' + facebookURL + link + ')',
                parse_mode: 'Markdown',
                disable_notification: true
              }, function (error, response) {
                if (error) {
                  robot.logger.error(error);
                }
                robot.logger.debug(response);
            });
          }

          self.lastLink = result[1].link;

          return true;
        } else {
          robot.logger.warning(logPrefix + "Can't find page " + self.page);
          self.room.removeSubscription(self.page);
          robot.logger.info('Sending message to room: ' + roomId);
          robot.emit(
            'telegram:invoke',
            'sendMessage', {
              chat_id: roomId,
              text: messagePrefix + "Unable to find `" + self.page + "`. Unsubscribed.",
              parse_mode: 'Markdown'
            }, function (error, response) {
              if (error) {
                robot.logger.error(error);
              }
              robot.logger.debug(response);
          });
          return false;
        }
      });
    });
  };

  return Subscription;
})();

var Room = (function() {
  function Room(id, subscriptions) {
    this.id = id;
    this.subscriptions = subscriptions || new Map();
  }

  Room.prototype.addSubscription = function(page) {
    if (this.subscriptions.has(page)) {
      return null;
    }

    var subscription = new Subscription(this, page);
    this.subscriptions.set(page, subscription);
    return subscription;
  };

  Room.prototype.removeSubscription = function(page) {
    this.subscriptions.delete(page);
  }

  return Room;
})();

module.exports = function(robot) {
  var linkDelay = 30;
  var firstTime = true;
  var rooms;

  function save() {
    var data = [];
    for (var room of rooms.values()) {
      var roomData = [];
      roomData.push(room.id);
      var subscriptions = [];
      for (var subscription of room.subscriptions.values()) {
        var subscriptionData = [];
        subscriptionData.push(subscription.page);
        subscriptionData.push(subscription.name);
        subscriptionData.push(subscription.lastLink);
        subscriptionData.push(subscription.imageOnly);
        subscriptions.push(subscriptionData);
      }
      roomData.push(subscriptions);
      data.push(roomData);
    }
    robot.brain.set(roomDataPath, data);
    robot.brain.save();
  }

  function load() {
    rooms = new Map();
    var data = robot.brain.get(roomDataPath);
    if (data != null) {
      for (var i = 0; i < data.length; i++) {
        var roomData = data[i];
        var room = new Room(roomData[0], new Map());
        rooms.set(room.id, room);
        for (var j = 0; j < roomData[1].length; j++) {
          var subscriptionData = roomData[1][j];
          var subscription = new Subscription(room, subscriptionData[0], subscriptionData[1], subscriptionData[2], subscriptionData[3]);
          room.subscriptions.set(subscription.page, subscription);
        }
      }
    }
  }

  function checkSubscriptions() {
    for (var room of rooms.values()) {
      for (var subscription of room.subscriptions.values()) {
        subscription.fetch(robot);
      }
    }

    setTimeout(save, 5000);
  }

  function sendMessage(res, msg) {
    var roomId = res.message.room;
    robot.logger.info('Sending message to room: ' + roomId);
    robot.emit(
      'telegram:invoke',
      'sendMessage', {
        chat_id: roomId,
        text: msg,
        parse_mode: 'Markdown'
      }, function (error, response) {
        if (error) {
          robot.logger.error(error);
        }
        robot.logger.debug(response);
    });
  }

  function subscribePage(res, page, imageOnly) {
    var id = res.message.room;
    var room = rooms.get(id);

    if (room == undefined) {
      room = new Room(id);
      rooms.set(id, room);
    }

    var subscription = room.addSubscription(page);
    if (subscription != null) {
      sendMessage(res, messagePrefix + 'Subscribing to `' + page + '`.');
      subscription.imageOnly = imageOnly;
      subscription.fetch(robot);
      setTimeout(save, 5000);
    }
  }

  function unsubscribePage(res, page) {
    var room = rooms.get(res.message.room);

    if (room == undefined) {
      return;
    }

    room.removeSubscription(page);
    sendMessage(res, messagePrefix + 'Unsubscribed from `' + page + '`.');
  }

  function showSubscriptions(res) {
    var room = rooms.get(res.message.room);

    var msg = messagePrefix + 'Subscriptions:'

    if (room != undefined) {
      for (var subscription of room.subscriptions.values()) {
        msg += '\n' + subscription.page + ' - ' + subscription.name;
        if (subscription.imageOnly) {
          msg += ' (image only)';
        }
      }
    }

    sendMessage(res, msg);
  }

  function unsubscribeAll(res) {
    rooms.delete(res.message.room);
    sendMessage(res, messagePrefix + 'Unsubscribed from all subscriptions.');
  }

  function sendUsage(res) {
    sendMessage(res, '*Facebook Feed Usage:*\n\n' +
                     '`/fbfeed subscribe [page] [-i]`\n' +
                     '      Subscribe to `[page]`. (Optional: -i fetch image only)\n' +
                     '      Example: `/fbfeed subscribe kobeengineer -i`\n\n' +
                     '`/fbfeed unsubscribe [page]`\n' +
                     '      Unsubscribe from `[page]`.\n\n' +
                     '`/fbfeed showSubscriptions`\n' +
                     '      Show current subscriptions.\n\n' +
                     '`/fbfeed unsubscribeAll`\n' +
                     '      Unsubscribe from all subscriptions.');
  }

  robot.brain.on('loaded', function() {
    if (!firstTime) {
      return;
    }

    firstTime = false;
    load();

    checkSubscriptions();
    setInterval(checkSubscriptions, process.env.HUBOT_TELEGRAM_FACEBOOK_FEED_INTERVAL || 120000);

    robot.respond(/fbfeed(.*)/i, function(res) {
      var args = res.match[1].split(' ');
      if (args.length > 2) {
        args[1] = args[1].toLowerCase();
        switch (args[1]) {
          case "subscribe":
            subscribePage(res, args[2], args[3] && args[3].toLowerCase() == '-i');
            break;
          case "unsubscribe":
            unsubscribePage(res, args[2]);
            break;
          default:
            sendUsage(res);
            break;
        }
      } else if (args.length > 1) {
        args[1] = args[1].toLowerCase();
        switch (args[1]) {
          case "showsubscriptions":
            showSubscriptions(res);
            break;
          case "unsubscribeall":
            unsubscribeAll(res);
            break;
          default:
            sendUsage(res);
            break;
        }
      } else {
        sendUsage(res);
      }
    });
  });
}
