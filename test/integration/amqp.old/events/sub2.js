/* eslint-disable no-console */

const { ServiceBroker } = require("../../../..");

const broker = new ServiceBroker({
	nodeID: "event-sub2-nodeID",
	logger: console,
	transporter: process.env.AMQP_URI || "amqp://guest:guest@localhost:5672",
});

broker.createService({
	name: "aService",
	events: {
		"hello.world": function() {
			console.log("Subscriber2 received the event.");
		},
	}
});

setTimeout(() => process.exit(1), 10000);

broker.start();
