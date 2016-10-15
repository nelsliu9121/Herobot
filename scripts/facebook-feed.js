'use strict'

/**
 * Facebook Feed
 * TODO: Check false pages
 * TODO: Option - Only fetch posts with images
 * TODO: Fetch multiple posts
 * TODO: Save instance
 * TODO: Remove subscription, show all subscriptions, remove room
 */

var request = require('request');
var jsdom = require('jsdom');
var jquery = 'https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js';

var facebookURL = 'https://facebook.com';
var facebookMobileURL = 'https://m.facebook.com';

var Subscription = (function() {
  function Subscription(room, page) {
    this.room = room;
    this.page = page;
    this.name = '';
    this.lastLink = '';
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
        console.log("Errors getting url: " + url);
        return false;
      }
      return scrape(body, ['#recent div div div:nth-child(1) div:nth-child(2) div:nth-child(2) a', 'title'], function(result) {
        if (result[0] != null) {
          self.name = result[1].text().trim();
          var link = result[0].attr('href');
          var roomId = self.room.id;
          var path = link.split('?')[0];
          var subPaths = path.split('/');

          if (subPaths[1] === self.page) {
            if (subPaths.length > 2) {
              if (subPaths[2] === 'photos') {
                link = path;
              }
            }
          } else if (subPaths[1] === 'story.php') {
            var params = getParameters(link);
            link = '/' + self.page + '/posts/' + params['story_fbid'];
          } else {
            return false;
          }

          if (self.lastLink !== link) {
            self.lastLink = link;
            robot.logger.info('Sending message to room: ' + roomId);
            robot.emit(
              'telegram:invoke',
              'sendMessage', {
                chat_id: roomId,
                text: '[' + self.name + '](' + facebookURL + link + ')',
                parse_mode: 'Markdown'
              }, function (error, response) {
                if (error) {
                  robot.logger.error(error);
                }
                robot.logger.debug(response);
            });
            return true;
          }
          return false;
        } else {
          robot.logger.warning("Errors scraping url: " + url);
          return false;
        }
      });
    });
  };

  return Subscription;
})();

var Room = (function() {
  function Room(id) {
    this.id = id;
    this.subscriptions = new Map();
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
  var rooms = new Map();

  function subscribePage(res, page) {
    var id = res.message.room;
    var room = rooms.get(id);

    if (room == undefined) {
      room = new Room(id);
      rooms.set(id, room);
    }

    var subscription = room.addSubscription(page);
    if (subscription != null) {
      subscription.fetch(robot);
    }
  }

  function checkSubscriptions() {
    for (var room of rooms.values()) {
      for (var subscription of room.subscriptions.values()) {
        subscription.fetch(robot);
      }
    }
  }

  setInterval(checkSubscriptions, 30000);

  robot.hear(/fbfeed (.*)/i, function(res) {
    var args = res.match[1].split(' ');
    if (args[0] === "subscribe") {
      if (args.length > 1) {
        subscribePage(res, args[1]);
      }
    }
  });
}
