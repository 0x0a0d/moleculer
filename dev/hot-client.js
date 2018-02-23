"use strict";

let ServiceBroker = require("../src/service-broker");

// Create broker
let broker = new ServiceBroker({
	nodeID: "client-" + process.pid,
	transporter: "NATS",
	logger: console
});

//broker.loadService("./examples/math.service.js");

let c = 0;
broker.start().then(() => {

	setInterval(() => {
		broker.call("test.hello")
			.then(res => broker.logger.info("Result:", res))
			.catch(err => broker.logger.warn(err.message));


		broker.emit("test.event", ++c);
	}, 1000);

});
