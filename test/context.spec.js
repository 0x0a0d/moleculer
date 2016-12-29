"use strict";

let _ = require("lodash");
let Context = require("../src/context");
let ServiceBroker = require("../src/service-broker");

describe("Test Context", () => {

	it("test with empty opts", () => {

		let ctx = new Context();

		expect(ctx.id).toBeDefined();
		expect(ctx.requestID).toBeDefined();
		expect(ctx.requestID).toBe(ctx.id);
		expect(ctx.opts).toBeDefined();
		expect(ctx.parent).not.toBeDefined();
		expect(ctx.broker).not.toBeDefined();
		expect(ctx.action).not.toBeDefined();
		expect(ctx.logger).not.toBeDefined();
		expect(ctx.level).toBe(1);
		expect(ctx.params).toBeDefined();
		expect(ctx.params).toEqual({});

		expect(ctx.startTime).toBeDefined();
		expect(ctx.stopTime).toBeNull();
		expect(ctx.duration).toBe(0);

		let params = {
			a: 1
		};

		ctx.setParams(params);
		expect(ctx.params).not.toBe(params); // Cloned
		expect(ctx.params).toEqual(params);		
	});

	it("test with options", () => {

		let broker = new ServiceBroker({ metrics: true });
		broker.emit = jest.fn();

		let opts = {
			requestID: 123,
			parent: {
				id: "parent123"
			},
			broker,
			action: {},
			params: {
				b: 5
			}
		};
		let ctx = new Context(opts);

		expect(ctx.id).toBeDefined();
		expect(ctx.requestID).toBe(opts.requestID);
		expect(ctx.opts).toEqual(opts);
		expect(ctx.parent).toBeDefined();
		expect(ctx.broker).toBe(broker);
		expect(ctx.action).toBeDefined();
		expect(ctx.level).toBe(1);
		expect(ctx.params).toEqual({ b: 5 });

		expect(broker.emit).toHaveBeenCalledTimes(1);
		expect(broker.emit).toHaveBeenCalledWith("metrics.context.start", {"action": {"name": undefined}, "id": ctx.id, "parent": ctx.parent.id, "requestID": ctx.requestID, "time": ctx.startTime});
		broker.emit.mockClear();

		// Test call method
		broker.call = jest.fn();

		let p = { id: 5 };
		ctx.call("posts.find", p);

		expect(broker.call).toHaveBeenCalledTimes(1);
		expect(broker.call).toHaveBeenCalledWith("posts.find", p, ctx);

		// Test emit method

		let data = { id: 5 };
		ctx.emit("request.rest", data);

		expect(broker.emit).toHaveBeenCalledTimes(1);
		expect(broker.emit).toHaveBeenCalledWith("request.rest", data);

		broker.emit.mockClear();
		ctx.emit("request.rest", "string-data");
		expect(broker.emit).toHaveBeenCalledTimes(1);
		expect(broker.emit).toHaveBeenCalledWith("request.rest", "string-data");		
	});
});

describe("Test Child Context", () => {

	let parentCtx = new Context();

	let ctx = new Context({
		parent: parentCtx
	});

	it("test duration", () => {
		expect(ctx.parent).toBe(parentCtx);
		expect(parentCtx.duration).toBe(0);
		expect(ctx.duration).toBe(0);

		return new Promise((resolve) => {
			setTimeout(() => {
				ctx.closeContext();

				expect(ctx.stopTime).toBeGreaterThan(0);
				expect(ctx.duration).toBeGreaterThan(0);
				expect(parentCtx.duration).toBe(ctx.duration);

				resolve();
			}, 100);
			
		});
	});
});


describe("Test createSubContext", () => {

	let broker = new ServiceBroker();

	let opts = {
		id: 123,
		parent: {},
		broker,
		action: {},
		params: {
			b: 5
		}
	};
	let ctx = new Context(opts);

	it("test with empty params", () => {
		let subCtx = ctx.createSubContext();
		expect(subCtx).not.toBe(ctx);
		expect(subCtx.id).not.toBe(ctx.id);
		expect(subCtx.requestID).toBe(ctx.requestID);
		expect(subCtx.parent).toBe(ctx);
		expect(subCtx.broker).toBe(ctx.broker);
		expect(subCtx.action).toBe(ctx.action);
		expect(subCtx.params).toBeNull;
	});

	it("test with params", () => {
		let action2 = {};
		let params2 = { a: 11 };

		let subCtx = ctx.createSubContext(action2, params2);
		expect(subCtx).not.toBe(ctx);
		expect(subCtx.id).not.toBe(ctx.id);
		expect(subCtx.requestID).toBe(ctx.requestID);
		expect(subCtx.parent).toBe(ctx);
		expect(subCtx.broker).toBe(ctx.broker);
		expect(subCtx.action).toBe(action2);
		expect(subCtx.params).toEqual(params2);
	});
});

describe("Test result method", () => {
	let ctx = new Context();
	ctx.log =  jest.fn();
	ctx.closeContext = jest.fn();

	it("should call closeContext method and call then", () => {
		let response = { id: 5 };
		let p = ctx.result(response);
		expect(p).toBeDefined();
		expect(p.then).toBeDefined();
		return p.then((data) => {
			expect(ctx.closeContext).toHaveBeenCalledTimes(1);
			expect(data).toBe(response);
		});
	});
});

describe("Test error method", () => {
	let ctx = new Context();
	ctx.log =  jest.fn();
	ctx.closeContext = jest.fn();

	it("should call closeContext method and call the catch", () => {
		let error = new Error("Wrong things!");
		let p = ctx.error(error);
		expect(p).toBeDefined();
		expect(p.catch).toBeDefined();
		return p.catch((err) => {
			expect(ctx.closeContext).toHaveBeenCalledTimes(1);
			expect(err).toBe(error);
			expect(err.ctx).toBe(ctx);
		});
	});

	it("should create Error if pass a string param", () => {
		let p = ctx.error("Something went wrong!");
		expect(p).toBeDefined();
		expect(p.catch).toBeDefined();
		return p.catch((err) => {
			expect(err).toBeInstanceOf(Error);
			expect(err.ctx).toBe(ctx);
		});
	});	
});

describe("Test closeContext", () => {

	let broker = new ServiceBroker({ metrics: true });
	let ctx = new Context({ broker, parent: { id: 123 }, action: { name: "users.get" } });
	broker.emit = jest.fn();

	it("should call _metricFinish method", () => {		
		ctx.closeContext();

		expect(broker.emit).toHaveBeenCalledTimes(1);
		expect(broker.emit).toHaveBeenCalledWith("metrics.context.finish", {"action": {"name": "users.get"}, "duration": ctx.duration, "id": ctx.id, "parent": 123, "requestID": ctx.requestID, "time": ctx.stopTime});
	});
});