"use strict";

let Promise	= require("bluebird");
let ServiceBroker = require("../../src/service-broker");

let broker = new ServiceBroker({ logger: console, validation: true, metrics: true });
broker.loadService(__dirname + "/../../benchmark/user.service");
broker.loadService(__dirname + "/../metrics.service");

broker.start();

console.log(" --- CALL ---");
//broker.call("users.empty").then(res => console.log(res));
broker.call("users.validate", { id: "5" }, { timeout: 1000, retryCount: 1, fallbackResponse: "Hello"}).then(res => console.log(res));
