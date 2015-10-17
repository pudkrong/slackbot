var logger = require("winston");
var Seq = require("seq");
var esMapping = require("./lib/es/mapping");
var esLoadData =require("./lib/es/loadData");

logger.level = "debug";

Seq()
  .seq(function() {
    esMapping.createMapping(this);
  })
  .seq(function() {
    esLoadData.loadData(this);
  })
  .catch(function(err) {
    logger.error(err);
  });
