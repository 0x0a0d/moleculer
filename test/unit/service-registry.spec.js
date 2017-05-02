"use strict";

const ServiceRegistry = require("../../src/service-registry");
const ServiceBroker = require("../../src/service-broker");

describe("Test constructor", () => {

	it("should create instance with default options", () => {
		let registry = new ServiceRegistry();
		expect(registry).toBeDefined();
		expect(registry.opts).toEqual({"preferLocal": true, "strategy": ServiceRegistry.STRATEGY_ROUND_ROBIN});
		expect(registry.actions).toBeInstanceOf(Map);
	});

	it("should create instance with options", () => {
		let opts = {
			preferLocal: false,
			strategy: ServiceRegistry.STRATEGY_RANDOM
		};
		let registry = new ServiceRegistry(opts);
		expect(registry).toBeDefined();
		expect(registry.opts).toEqual({"preferLocal": false, "strategy": ServiceRegistry.STRATEGY_RANDOM});
	});

});

describe("Test registry.init", () => {
	const broker = new ServiceBroker();

	it("should set broker to local var", () => {
		let registry = new ServiceRegistry();
		registry.init(broker);
		expect(registry.broker).toBe(broker);
	});

});

describe("Test registry.register", () => {
	const broker = new ServiceBroker({ internalActions: false });
	const registry = broker.serviceRegistry;

	let action = {
		name: "posts.find",
		handler: jest.fn()
	};

	it("should set local action and create an EndpointList", () => {
		expect(registry.actions.size).toBe(0);
		const res = registry.register(null, action);
		expect(res).toBe(true);
		expect(registry.actions.size).toBe(1);

		let endpoint = registry.findAction("posts.find");
		expect(endpoint).toBeInstanceOf(ServiceRegistry.EndpointList);
		expect(endpoint.count()).toBe(1);
	});

	it("should set local action but not create a new EndpointList", () => {
		const res = registry.register(null, action);
		expect(res).toBe(false);
		expect(registry.actions.size).toBe(1);
	});

	it("should set remote action but not create a new EndpointList", () => {
		const res = registry.register("server-2", action);
		expect(res).toBe(true);
		expect(registry.actions.size).toBe(1);

		let endpoint = registry.findAction("posts.find");
		expect(endpoint.count()).toBe(2);
	});

});

describe("Test registry.deregister", () => {
	const broker = new ServiceBroker({ internalActions: false });
	const registry = broker.serviceRegistry;

	let action = {
		name: "posts.find",
		handler: jest.fn()
	};

	registry.register(null, action);
	registry.register("server-2", action);

	it("should count endpoint equals 2", () => {
		let endpoint = registry.findAction("posts.find");
		expect(endpoint.count()).toBe(2);
	});

	it("should remove 'server-2' endpoint from list", () => {
		registry.deregister("server-2", action);
		let endpoint = registry.findAction("posts.find");
		expect(endpoint.count()).toBe(1);
	});

});

describe("Test registry.findAction", () => {
	const broker = new ServiceBroker({ internalActions: false });
	const registry = broker.serviceRegistry;

	let action = {
		name: "posts.find",
		handler: jest.fn()
	};

	it("should returns undefined if action is not exist", () => {
		let endpoint = registry.findAction("posts.find");
		expect(endpoint).toBeUndefined();
	});

	it("should return the endpoint if action is exist", () => {
		registry.register("server-2", action);
		let endpoint = registry.findAction("posts.find");
		expect(endpoint).toBeDefined();
	});

});

describe("Test registry.hasAction", () => {
	const broker = new ServiceBroker({ internalActions: false });
	const registry = broker.serviceRegistry;

	let action = {
		name: "posts.find",
		handler: jest.fn()
	};

	it("should returns false if action is not exist", () => {
		let res = registry.hasAction("posts.find");
		expect(res).toBe(false);
	});

	it("should return the res if action is exist", () => {
		registry.register("server-2", action);
		let res = registry.hasAction("posts.find");
		expect(res).toBe(true);
	});

});

describe("Test registry.hasAction", () => {
	const broker = new ServiceBroker({ internalActions: false });
	const registry = broker.serviceRegistry;

	let action = {
		name: "posts.find",
		cache: true,
		custom: 5,
		handler: jest.fn()
	};

	it("should returns empty list", () => {
		expect(registry.getLocalActions()).toEqual({});
	});

	it("should return empty list because only remote endpoint registered", () => {
		registry.register("server-2", action);
		expect(registry.getLocalActions()).toEqual({});
	});

	it("should return action list", () => {
		registry.register(null, action);
		expect(registry.getLocalActions()).toEqual({"posts.find": {"cache": true, "custom": 5, "name": "posts.find"}});
	});

});

describe("Test EndpointList constructor", () => {
	const broker = new ServiceBroker();

	it("should create instance with default options", () => {
		let list = new ServiceRegistry.EndpointList(broker);
		expect(list).toBeDefined();
		expect(list.list).toBeDefined();
		expect(list.opts).toEqual({"preferLocal": true, "strategy": ServiceRegistry.STRATEGY_ROUND_ROBIN});
		expect(list.counter).toBe(0);
		expect(list.localEndpoint).toBeNull();
		expect(list.count()).toBe(0);
		expect(list.hasLocal()).toBe(false);
	});

	it("should create instance with options", () => {
		let opts = {
			preferLocal: false,
			strategy: ServiceRegistry.STRATEGY_RANDOM
		};
		let list = new ServiceRegistry.EndpointList(broker, opts);
		expect(list).toBeDefined();
		expect(list.opts).toEqual({"preferLocal": false, "strategy": ServiceRegistry.STRATEGY_RANDOM});
	});

});

describe("Test EndpointList add methods", () => {
	const broker = new ServiceBroker();
	let list = new ServiceRegistry.EndpointList(broker);

	let obj1 = { a: 1 };
	let obj2 = { b: 2 };
	let obj3 = { c: 3 };

	it("should add items and not found local item", () => {
		expect(list.add("node1", obj1)).toBe(true); // remote
		expect(list.add("node2", obj2)).toBe(true); // remote

		expect(list.count()).toBe(2);
		expect(list.hasLocal()).toBe(false);
		expect(list.counter).toBe(0);
	});

	it("should add & found local item", () => {
		list.add(null, obj3); // local

		expect(list.localEndpoint).toBeDefined();
		expect(list.localEndpoint.action).toBe(obj3);
		expect(list.count()).toBe(3);
		expect(list.hasLocal()).toBe(true);
		expect(list.counter).toBe(0);
	});

	it("should re-add remote item", () => {
		expect(list.add("node1", obj1)).toBe(false); // remote

		expect(list.count()).toBe(3);
		expect(list.hasLocal()).toBe(true);
		expect(list.counter).toBe(0);
	});

});

describe("Test EndpointList get methods with round-robin", () => {
	const broker = new ServiceBroker();
	let list = new ServiceRegistry.EndpointList(broker, {
		strategy: ServiceRegistry.STRATEGY_ROUND_ROBIN
	});

	let obj1 = { a: 1 };
	let obj2 = { b: 2 };
	let obj3 = { c: 3 };

	list.add("node1", obj1);
	list.add("node2", obj2);
	list.add("node3", obj3);

	it("should return items", () => {
		let ep = list.get();
		expect(ep.action).toBe(obj1);
		expect(list.counter).toBe(1);
		
		ep = list.get();
		expect(ep.action).toBe(obj2);
		expect(list.counter).toBe(2);

		ep = list.get();
		expect(ep.action).toBe(obj3);
		expect(list.counter).toBe(3);

		ep = list.get();
		expect(ep.action).toBe(obj1);
		expect(list.counter).toBe(1);

	});

});

describe("Test EndpointList nextAvailable methods with preferLocal", () => {
	const broker = new ServiceBroker();
	let list = new ServiceRegistry.EndpointList(broker, {
		preferLocal: true,
		strategy: ServiceRegistry.STRATEGY_ROUND_ROBIN
	});

	let obj0 = { a: 0 };
	let obj1 = { a: 1 };
	let obj2 = { b: 2 };
	let obj3 = { c: 3 };

	it("should return null if list is empty", () => {
		let ep = list.nextAvailable();
		expect(ep).toBeNull();
	});

	it("should return the first item if list is contains one item", () => {
		list.add("node1", obj1);

		let ep = list.nextAvailable();
		expect(ep.action).toBe(obj1);

		ep = list.nextAvailable();
		expect(ep.action).toBe(obj1);
	});

	it("should return the local item if list is contains local item", () => {
		list.add(null, obj0);

		let ep = list.nextAvailable();
		expect(ep.action).toBe(obj0);

		ep = list.nextAvailable();
		expect(ep.action).toBe(obj0);
	});

	it("should return the remote item if the local item is unavailable", () => {
		list.list[1].state = ServiceRegistry.CIRCUIT_OPEN;

		let ep = list.nextAvailable();
		expect(ep.action).toBe(obj1);

		ep = list.nextAvailable();
		expect(ep.action).toBe(obj1);
	});

	it("should return the remote items if list is NOT contains local item", () => {
		list.removeByNode(null);
		list.add("node2", obj2);
		list.add("node3", obj3);

		let ep = list.nextAvailable();
		expect(ep.action).toBe(obj2);

		ep = list.nextAvailable();
		expect(ep.action).toBe(obj3);

		ep = list.nextAvailable();
		expect(ep.action).toBe(obj1);
	});

	it("should skip the unavailable items", () => {
		list.removeByNode(null);
		list.add("node2", obj2);
		list.add("node3", obj3);

		list.list[1].state = ServiceRegistry.CIRCUIT_OPEN;

		let ep = list.nextAvailable();
		expect(ep.action).toBe(obj3);

		// obj2 skipped

		ep = list.nextAvailable();
		expect(ep.action).toBe(obj1);

		ep = list.nextAvailable();
		expect(ep.action).toBe(obj3);
	});

	it("should returns null if every endpoints are unavailable", () => {
		list.list[0].state = ServiceRegistry.CIRCUIT_OPEN;
		list.list[1].state = ServiceRegistry.CIRCUIT_OPEN;
		list.list[2].state = ServiceRegistry.CIRCUIT_OPEN;

		let ep = list.nextAvailable();
		expect(ep).toBeNull();

		ep = list.nextAvailable();
		expect(ep).toBeNull();
	});

});

describe("Test EndpointList getAction method", () => {
	const broker = new ServiceBroker();
	let list = new ServiceRegistry.EndpointList(broker);

	let obj1 = { a: 1 };
	let obj2 = { b: 2 };
	let obj3 = { c: 3 };

	it("should return null", () => {
		expect(list.getAction()).toBeNull();
		expect(list.count()).toBe(0);
	});

	it("should return items", () => {
		list.add("node1", obj1);
		list.add("node2", obj2);
		list.add("node3", obj3);

		expect(list.count()).toBe(3);
		expect(list.getAction()).toBe(obj1);
		expect(list.getAction()).toBe(obj2);
		expect(list.getAction()).toBe(obj3);
	});

});

describe("Test EndpointList getLocalEndpoint & hasLocal methods", () => {
	const broker = new ServiceBroker();
	let list = new ServiceRegistry.EndpointList(broker);

	let obj1 = { a: 1 };
	let obj2 = { b: 2 };
	let obj3 = { c: 3 };

	it("should return null", () => {
		expect(list.hasLocal()).toBe(false);
		expect(list.getLocalEndpoint()).toBeNull();
	});

	it("should return the local endpoint", () => {
		list.add("node1", obj1);
		list.add("node2", obj2);
		list.add(null, obj3);

		expect(list.hasLocal()).toBe(true);
		expect(list.getLocalEndpoint().action).toBe(obj3);
		expect(list.getLocalEndpoint().action).toBe(obj3);
	});

	it("should return null after remove", () => {
		list.removeByNode(null);

		expect(list.hasLocal()).toBe(false);
		expect(list.getLocalEndpoint()).toBeNull();
	});

});

describe("Test EndpointList removeByAction & removeByNode methods", () => {
	const broker = new ServiceBroker();
	let list = new ServiceRegistry.EndpointList(broker);

	let obj1 = { a: 1 };
	let obj2 = { b: 2 };
	let obj3 = { c: 3 };

	it("should not throw Error", () => {
		list.removeByAction();
		list.removeByNode();
	});

	it("should remove item by action", () => {
		list.add("node1", obj1);
		list.add("node2", obj2);
		list.add(null, obj3);

		expect(list.count()).toBe(3);

		let item = list.get();
		list.removeByAction(obj2);

		expect(list.count()).toBe(2);
	});

	it("should remove item by nodeID", () => {
		expect(list.count()).toBe(2);

		list.removeByNode(null);
		expect(list.count()).toBe(1);

		list.removeByNode("node1");
		expect(list.count()).toBe(0);
	});

});