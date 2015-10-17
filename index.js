"use strict";

var Bot = require("./lib/slack/bot");
var logger = require("winston");

logger.level = "debug";

var bot = new Bot();
bot.run();