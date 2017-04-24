"use strict";

let { delay } = require("../../src/utils");

let ServiceBroker = require("../../src/service-broker");
let NatsTransporter = require("../../src/transporters/nats");
let Serializer = require("../../src/serializers/protobuf");

// Create broker
let broker = new ServiceBroker({
	nodeID: process.argv[2] || "server-2",
	transporter: new NatsTransporter(),
	logger: console,
	logLevel: "info",
	serializer: new Serializer()
});

//broker.loadService(__dirname + "/../post.service");
broker.loadService(__dirname + "/../user.service");


broker.start();
let c = 1;

broker.on("TEST1", a => {
	console.log("TEST1 event received:", a);
});

Promise.resolve()
.then(delay(1000))
.then(() => {
	let startTime = Date.now();
	
	broker.call("posts.find").then((posts) => {
		broker.logger.info("[server-2] Posts: ", posts.length, ", Time:", Date.now() - startTime, "ms");
	})
	.catch(err => broker.logger.error(err));
})

.then(() => {
	setInterval(() => {
		broker.emit("TEST2", { a: c++ });
		if (c >= 5) {
			//process.exit();
		}

	}, 10 * 1000);
});
