"use strict";

var logger = require("winston");
var fs = require("fs");
var Seq = require("seq");
var ES = require("elasticsearch");
var config = require("./config");

var createMapping = function(cb) {
  fs.readFile("./data/es/mapping.json", "utf8", function(err, data) {
    if (err) {
      return cb(err);
    }

    var es = new ES.Client({ hosts: config.hosts, apiVersion: config.apiVersion });

    Seq()
      .seq(function() {
        var self = this;
        es.indices.exists({
          index: config.index
        }, function(err, response) {
          if (err) {
            return self(err);
          }

          self(null, response);
        });        
      })
      .seq(function(exists) {
        if (exists) {
          var self = this;
          es.indices.delete({
            index: config.index
          }, function(err, response) {
            if (err) {
              return self(err);
            }

            logger.info("Index already exists, then delete it");
          });
        }

        this(null);
      })
      .seq(function() {
        var self = this;
        es.indices.create({
          index: config.index,
          body: JSON.parse(data)
        }, function(err, response) {
          if (err) {
            return self(err);
          }

          logger.info("Mapping is created");
          self(null);
        });                  
      })
      .seq(function() {
        // Finish this process
        cb(null);
      })
      .catch(function(err) {
        // Throw error to upper level
        return cb(err);
      });
  });
}

module.exports.createMapping = createMapping;