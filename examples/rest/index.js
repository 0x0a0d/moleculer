"use strict";

let _ = require("lodash");
let path = require("path");
let glob = require("glob");

let ServiceBroker = require("../../src/service-broker");
let MemoryCacher = require("../../src/cachers").Memory;

// Create broker
let broker = new ServiceBroker({
	cacher: new MemoryCacher(),
	nodeID: "server",
	logger: console,
	metrics: false
});

broker.loadServices(path.join(__dirname, ".."));
broker.start();