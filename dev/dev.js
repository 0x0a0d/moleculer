/* eslint-disable no-console */

"use strict";

let ServiceBroker = require("../src/service-broker");
let { MoleculerError } = require("../src/errors");

let broker1 = new ServiceBroker({
	nodeID: "node1",
	logger: true,
	logLevel: "debug",
	requestTimeout: 5000,
	requestRetry: 3,
	transporter: "NATS",
	cacher: "redis://localhost",
	serializer: "JSON",
	circuitBreaker: {
		enabled: true
	},
	registry: {
		//preferLocal: false
	}
});

//broker1.loadService("./examples/math.service");
//broker1.loadService("./examples/silent.service");
//broker1.loadService("./examples/post.service");

let broker2 = new ServiceBroker({
	nodeID: "node2",
	logger: true,
	logLevel: "info",
	transporter: "NATS",
	cacher: {
		type: "Redis",
		options: {
			redis: { 
				host: "localhost",
				database: 3
			}
		}
	},
	serializer: "JSON",
	statistics: true
});
/*
broker2.createService({
	name: "devil",
	actions: {
		danger(ctx) {
			throw new MoleculerError("Run!", 666, null, { a: 100 });
		}
	}
});*/
//broker2.loadService("./examples/math.service");
//broker2.loadService("./examples/file.service");
broker2.loadService("./examples/test.service");
broker2.loadService("./examples/user.service");
broker2.loadService("./examples/user.v1.service");


broker1.Promise.resolve()
	.then(() => broker1.start())
	.then(() => broker2.start())
	.delay(500)
	.then(() => broker1.call("$node.actions", { onlyLocal: true }, { nodeID: "node2" }))
	//.then(res => console.log(res))
	.catch(err => console.log(err))
	.then(() => broker1.repl());
