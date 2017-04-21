let ServiceBroker = require("../../src/service-broker");

describe("Test Service handlers", () => {

	let createdHandler = jest.fn();
	let startedHandler = jest.fn();
	let stoppedHandler = jest.fn();
	let eventHandler = jest.fn();

	let broker = new ServiceBroker();

	broker.createService({
		name: "posts",

		created: createdHandler,
		started: startedHandler,
		stopped: stoppedHandler,

		events: {
			"user.*": eventHandler
		}
	});

	it("should called created handler", () => {
		expect(createdHandler).toHaveBeenCalledTimes(1);
	});		

	it("should called created handler", () => {
		broker.start();
		expect(startedHandler).toHaveBeenCalledTimes(1);
	});		

	it("should called event handler", () => {
		broker.emit("user.created", { id: 1, name: "John" });
		expect(eventHandler).toHaveBeenCalledTimes(1);
		expect(eventHandler).toHaveBeenCalledWith({ id: 1, name: "John" }, undefined, "user.created");
	});		

	it("should called created handler", () => {
		broker.stop();
		expect(stoppedHandler).toHaveBeenCalledTimes(1);
	});		
});
