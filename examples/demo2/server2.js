"use strict";

let _ = require("lodash");
let chalk = require("chalk");

let { delay } = require("../../src/utils");

let ServiceBroker = require("../../src/service-broker");
let NatsTransporter = require("../../src/transporters/nats");

// Create broker
let broker = new ServiceBroker({
	nodeID: "server-2",
	transporter: new NatsTransporter(),
	logger: console
});

require("../user.service")(broker);

broker.start();
let c = 1;

Promise.resolve()
/*.then(delay(1000))
.then(() => {
	let startTime = Date.now();
	
	broker.call("posts.find").then((posts) => {
		console.log("[server-2] Posts: ", posts.length, ", Time:", Date.now() - startTime, "ms");
	})
	.catch(err => console.error(err));
})*/
.then(() => {
	setInterval(() => {
		broker.emit("TEST2", { a: c++ });
		if (c >= 5) {
			//process.exit();
		}

	}, 5000);
});
