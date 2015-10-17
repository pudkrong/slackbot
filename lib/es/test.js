"use strict";

var logger = require("winston");
var fs = require("fs");
var _ = require("underscore");
var ES = require("elasticsearch");
var config = require("./config");

var es = new ES.Client({ hosts: config.hosts, apiVersion: config.apiVersion });
es.search({
  index: config.index,
  body: {
    size: 100,
    query: {
      filtered: {
        filter: {
          bool: {
            must:[
              {
                term: {
                  "eyeColor": "green"
                }
              }
            ]
          }
        }
      }
    }
  }
}, function(err, data) {
  logger.info("data => %j", data);

});
