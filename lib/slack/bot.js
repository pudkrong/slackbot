"use strict";

var SlackBot = require("slackbots");
var defaultConfig = require("./config");
var util = require("util");
var _ = require("underscore");
var logger = require("winston");
var ES = require("elasticsearch");
var esConfig = require("../es/config");

var Bot = function(config) {
  var self = this;
  this.config = _.extend(config || {}, {
      token: defaultConfig.token,
      name: defaultConfig.name
    }, {
      es: esConfig 
    });

  this.run = function(){
    Bot.super_.call(this, this.config);

    this.on("start", this.onStart);
    this.on("message", this.onMessage);
  };

  // Private methods 
  // Check message type
  var isChatMessage = function(msg) {
    return ((msg.type === "message") && (msg.text));
  };

  // C == Public channel
  // D == Direct message
  // Reference:: https://api.slack.com/rtm
  var isPublicChannel = function(msg) {
    return ((typeof(msg.channel) === "string") && msg.channel.match(/^C/));
  };

  var getChannelById = function(id) {
    var channel = self.channels.filter(function(channel) {
      return channel.id === id;
    });

    return channel[0];
  };

  // TODO::PUD Should we find the better solution than regex
  var parseCommands = function(msg) {
    var result = msg.text.match(/(\w+)+/g);

    if (result[0].toLowerCase() !== "siri") return;

    var command = result[1].toLowerCase();
    var args = result.splice(2);

    switch(command) {
      case "near":
        commandNear(args, msg);
        break;
      case "search": 
        commandSearch(args, msg);
        break;
    }
  };

  var commandNear = function(args, msg) {
    logger.info("near command", {args: args, msg: msg});
    
    //TODO::PUD This location should come from client i.e. mobile location
    var location = {
      lat: 12.7121625,
      lon: 101.1673986
    };

    //TODO::PUD In production, we should keep DSL in file because it is easier
    //to manage
    var dsl = {
      size: 100,
      query: {
        filtered: {
          filter: {
            geo_distance: {
              distance: args[0],
              location: location
            }
          }
        }
      }
    };

    self.es.search({
      index: self.config.es.index,
      body: dsl
    }, function(err, data) {
      if (err) {
        logger.error("Near command error", { error: err });

        var channel = getChannelById(msg.channel);
        self.postMessageToChannel(channel.name, 
          "Please check syntax.",
          { as_user: true }
        );

        return;
      }

      var friends = [];
      var channel = getChannelById(msg.channel);
      if (data.hits.total == 0) {
        self.postMessageToChannel(channel.name,
          "Cannot find anyone around you.",
          { as_user: true }
        );
      } else {
        _.each(data.hits.hits, function(item) {
          friends.push(item._source.name.first + " " + item._source.name.last);
        });

        self.postMessageToChannel(channel.name,
          "We have found " + data.hits.total + " friends around you => " + friends.join(", "),
          { as_user: true }
        );
      }
    });
  };

  var commandSearch = function(args, msg) {
    logger.info("search commmand", {args: args, msg: msg});

    var dsl = {
      size: 100,
      query: {
        filtered: {
          query: {
            multi_match: {
              type: "cross_fields",
              query: args,
              operator: "and",
              fields: [
                "tags",
                "about",
                "address",
                "company",
                "name.first",
                "name.last",
                "email"
              ]
            }
          }
        }
      }
    };

    self.es.search({
      index: self.config.es.index,
      body: dsl
    }, function(err, data) {
      if (err) {
        logger.error("Search command error", { error: err });

        var channel = getChannelById(msg.channel);
        self.postMessageToChannel(channel.name, 
          "Please check syntax.",
          { as_user: true }
        );

        return;
      }

      var channel = getChannelById(msg.channel);
      if (data.hits.total == 0) {
        self.postMessageToChannel(channel.name,
          "Found nothing",
          { as_user: true }
        );
      } else {
        var reply = "We have found " + data.hits.total + " friends\n\n";
        
        _.each(data.hits.hits, function(item, index) {
          var data = item._source;
          reply += "No. " + (index + 1) + "\n";
          reply += "Name: " + data.name.first + " " + data.name.last + "\n";
          reply += "Email: " + data.email + "\n";
          reply += "Address: " + data.address + "\n";
          reply += "Company: " + data.company + "\n";
          reply += "About: " + data.about + "\n\n";
        });
        self.postMessageToChannel(channel.name, reply, { as_user: true });
      }
    });    
  }
  // End::Private methods

  // Event is fired when socket is started
  this.onStart = function() {
    // Keep es client object into its 
    this.es = new ES.Client({ 
      hosts: this.config.es.hosts, 
      apiVersion: this.config.es.apiVersion 
    });

    this.myname = _.filter(this.users, function(u) {
        return u.name == this.config.name;
      }, this)[0];

    logger.info("Hi, my name is %s", this.myname.real_name);
  };

  // Event is fired when message is coming
  this.onMessage = function(msg) {
    logger.info("message has arrived!", { msg: msg });

    if (isChatMessage(msg) && isPublicChannel(msg)) {
      parseCommands(msg);
    }
  }
}

// Inherrit from original SlackBot
util.inherits(Bot, SlackBot);

module.exports = Bot;
