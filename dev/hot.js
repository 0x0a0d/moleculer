/* eslint-disable no-console */

"use strict";

let ServiceBroker = require("../src/service-broker");

// Create broker
let broker = new ServiceBroker({
	nodeID: "hot-" + process.pid,
	transporter: "amqp://192.168.0.181:5672",
	logger: console,
	//logLevel: "debug",
	hotReload: true
});

broker.start().then(() => {

	/*
	let svc;
	setTimeout(() => {
		console.log("Create math service...");

		// Create a new service after 5s
		svc = broker.createService({
			name: "math",
			actions: {
				add(ctx) {
					return Number(ctx.params.a) + Number(ctx.params.b);
				},
			}
		});

	}, 5000);

	setTimeout(() => {
		console.log("Destroy math service...");

		// Destroy a created service after 10s
		svc = broker.getService("math");
		broker.destroyService(svc);

	}, 10000);
	*/

	broker.loadService("./examples/hot.service.js");
	//broker.loadService("./examples/math.service.js");
	//broker.loadService("./examples/user.service.js");

	broker.repl();
});
