var logger = require("winston");
var fs = require("fs");
var _ = require("underscore");
var ES = require("elasticsearch");
var config = require("./config");

var loadData = function(cb) {
  fs.readFile("./data/es/data.json", "utf8", function(err, data) {
    if (err) {
      return cb(err);
    }

    var esData = parseData(data);

    var es = new ES.Client({ hosts: config.hosts, apiVersion: config.apiVersion });
    es.bulk({
      body: esData
    }, function(err, response) {
      if (err) {
        return cb(err);
      }

      logger.info("Data is created.");

      cb(null);
    });
  });
}

var parseData = function(data) {
  logger.info("Prepare bulk data to inject into ES");

  var json = JSON.parse(data).reverse();
  var result = [];

  // Transform data
  _.each(json, function(d, i) {
    var id = d._id;
    d.location = {
      lat: parseFloat(d.latitude),
      lon: parseFloat(d.longitude)
    };
    delete d.latitude;
    delete d.longitude;
    delete d._id;

    result.push({
      index: { _index: config.index, _type: config.type, _id: id }
    });
    result.push(d);
  });

  return result;
}

module.exports.loadData = loadData;