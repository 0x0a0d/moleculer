"use strict";

let _ = require("lodash");

let ServiceBroker = require("../../src/service-broker");
let NatsTransporter = require("../../src/transporters/nats");

// Create broker
let broker = new ServiceBroker({
	nodeID: process.argv[2] || "client",
	transporter: new NatsTransporter(process.env.NATS_SERVER),
	//logger: console
});

//broker.loadService(__dirname + "/../math.service");

broker.start();

console.log("Client started. nodeID:", broker.nodeID, " PID:", process.pid);

function work() {
	let payload = { a: _.random(0, 100), b: _.random(0, 100) };
	broker.call("math.add", payload)
	.then(res => {
		//console.info(`${payload.a} + ${payload.b} = ${res}`);
		setImmediate(work);
	});		
}

setTimeout(() => { 
	let startTime = Date.now();
	work();

	setInterval(() => {
		if (broker._callCount > 0) {
			let rps = broker._callCount / ((Date.now() - startTime) / 1000);
			console.log(broker.nodeID, ":", rps.toFixed(0), "req/s");
			broker._callCount = 0;
			startTime = Date.now();
		}
	}, 1000);

}, 1000);
