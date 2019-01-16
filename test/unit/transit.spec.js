"use strict";

const { protectReject } = require("./utils");
const ServiceBroker = require("../../src/service-broker");
const Context = require("../../src/context");
const Transit = require("../../src/transit");
const FakeTransporter = require("../../src/transporters/fake");
const E = require("../../src/errors");
const P = require("../../src/packets");
const { Transform } = require("stream");

const transitOptions = { packetLogFilter: [], disableReconnect: false };

describe("Test Transporter constructor", () => {

	const broker = new ServiceBroker({ logger: false });
	const transporter = new FakeTransporter();

	it("create instance", () => {
		let transit = new Transit(broker, transporter, transitOptions);
		expect(transit).toBeDefined();
		expect(transit.opts).toBe(transitOptions);
		expect(transit.logger).toBeDefined();
		expect(transit.nodeID).toBe(broker.nodeID);
		expect(transit.instanceID).toBe(broker.instanceID);
		expect(transit.tx).toBe(transporter);

		expect(transit.pendingRequests).toBeInstanceOf(Map);
		expect(transit.pendingReqStreams).toBeInstanceOf(Map);
		expect(transit.pendingResStreams).toBeInstanceOf(Map);

		expect(transit.stat).toEqual({
			packets: {
				sent: {
					count: 0,
					bytes: 0
				},
				received: {
					count: 0,
					bytes: 0
				}
			}
		});

		expect(transit.connected).toBe(false);
		expect(transit.disconnecting).toBe(false);
		expect(transit.isReady).toBe(false);
	});

	it("create instance with options", () => {
		let opts = { id: 5 };
		let transit = new Transit(broker, transporter, opts);
		expect(transit.opts).toBe(opts);
	});

	it("should call transporter.init", () => {
		transporter.init = jest.fn();
		let transit = new Transit(broker, transporter, transitOptions);

		expect(transporter.init).toHaveBeenCalledTimes(1);
		expect(transporter.init).toHaveBeenCalledWith(transit, jasmine.any(Function), jasmine.any(Function));
	});
});

describe("Test Transit.connect", () => {

	const broker = new ServiceBroker({ logger: false });
	const transporter = new FakeTransporter();
	const transit = new Transit(broker, transporter, transitOptions);

	transporter.connect = jest.fn(() => Promise.resolve());

	it("should call transporter connect", () => {
		let p = transit.connect().catch(protectReject).then(() => {
			expect(transporter.connect).toHaveBeenCalledTimes(1);

			expect(transit.__connectResolve).toBeDefined();
		});

		transit.__connectResolve();

		return p;
	});

	/* not working
	it("should recall transporter connect if failed", () => {
		let clock = lolex.install();
		transporter.connect = jest.fn()
			.mockImplementationOnce(() => Promise.reject())
			.mockImplementationOnce(() => Promise.resolve());

		let p = transit.connect().then(() => {
			expect(transporter.connect).toHaveBeenCalledTimes(2);

			clock.uninstall();
		});

		clock.runAll();

		return p;
	});
	*/

});

describe("Test Transit.afterConnect", () => {

	const broker = new ServiceBroker({ logger: false, transporter: "Fake" });
	const transit = broker.transit;

	let resolver;

	broker.broadcastLocal = jest.fn();

	beforeEach(() => {
		resolver = jest.fn();
		transit.__connectResolve = resolver;
		transit.makeSubscriptions = jest.fn(() => Promise.resolve());
		transit.discoverNodes = jest.fn(() => Promise.resolve());
	});

	it("should call makeSubscriptions & discoverNodes", () => {
		return transit.afterConnect().catch(protectReject).then(() => {
			expect(transit.makeSubscriptions).toHaveBeenCalledTimes(1);
			expect(transit.discoverNodes).toHaveBeenCalledTimes(1);
			expect(resolver).toHaveBeenCalledTimes(1);
			expect(transit.__connectResolve).toBeNull();
			expect(transit.connected).toBe(true);
			expect(broker.broadcastLocal).toHaveBeenCalledTimes(1);
			expect(broker.broadcastLocal).toHaveBeenCalledWith("$transporter.connected", { wasReconnect: false });
		});
	});

	it("should call only discoverNodes if was reconnected", () => {
		broker.broadcastLocal.mockClear();

		return transit.afterConnect(true).catch(protectReject).then(() => {
			expect(transit.makeSubscriptions).toHaveBeenCalledTimes(0);
			expect(transit.discoverNodes).toHaveBeenCalledTimes(1);
			expect(resolver).toHaveBeenCalledTimes(1);
			expect(transit.__connectResolve).toBeNull();
			expect(transit.connected).toBe(true);
			expect(broker.broadcastLocal).toHaveBeenCalledTimes(1);
			expect(broker.broadcastLocal).toHaveBeenCalledWith("$transporter.connected", { wasReconnect: true });
		});
	});

});

describe("Test Transit.disconnect", () => {

	const broker = new ServiceBroker({ logger: false, transporter: "Fake" });
	const transit = broker.transit;
	const transporter = transit.tx;

	transit.sendDisconnectPacket = jest.fn(() => Promise.resolve());
	broker.broadcastLocal = jest.fn();

	beforeAll(() => transit.connect().then(() => transit.ready()));

	it("should call transporter disconnect & sendDisconnectPacket", () => {
		transporter.disconnect = jest.fn(() => {
			expect(transit.disconnecting).toBe(true);
			return Promise.resolve();
		});
		broker.broadcastLocal.mockClear();
		expect(transit.connected).toBe(true);
		expect(transit.isReady).toBe(true);
		expect(transit.disconnecting).toBe(false);
		return transit.disconnect().catch(protectReject).then(() => {
			expect(transporter.disconnect).toHaveBeenCalledTimes(1);
			expect(transit.sendDisconnectPacket).toHaveBeenCalledTimes(1);

			expect(broker.broadcastLocal).toHaveBeenCalledTimes(1);
			expect(broker.broadcastLocal).toHaveBeenCalledWith("$transporter.disconnected", { graceFul: true });

			expect(transit.connected).toBe(false);
			expect(transit.isReady).toBe(false);
			expect(transit.disconnecting).toBe(false);
		});
	});

});

describe("Test Transit.ready", () => {

	const broker = new ServiceBroker({ logger: false });
	const transporter = new FakeTransporter();
	const transit = new Transit(broker, transporter, transitOptions);

	transit.sendNodeInfo = jest.fn(() => Promise.resolve());

	it("should not call sendNodeInfo if not connected", () => {
		expect(transit.isReady).toBe(false);
		expect(transit.connected).toBe(false);

		transit.ready();

		expect(transit.sendNodeInfo).toHaveBeenCalledTimes(0);
		expect(transit.isReady).toBe(false);
	});

	it("should call sendNodeInfo if connected", () => {
		transit.connected = true;
		expect(transit.isReady).toBe(false);

		transit.ready();

		expect(transit.sendNodeInfo).toHaveBeenCalledTimes(1);
		expect(transit.isReady).toBe(true);
	});

});

describe("Test Transit.sendDisconnectPacket", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	transit.publish = jest.fn(() => Promise.resolve());

	it("should call publish with correct params", () => {
		return transit.sendDisconnectPacket().catch(protectReject).then(() => {
			expect(transit.publish).toHaveBeenCalledTimes(1);
			expect(transit.publish).toHaveBeenCalledWith(jasmine.any(P.Packet));
			const packet = transit.publish.mock.calls[0][0];
			expect(packet.type).toBe(P.PACKET_DISCONNECT);
			expect(packet.payload).toEqual({});
		});
	});

});

describe("Test Transit.makeSubscriptions", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	transit.tx.makeSubscriptions = jest.fn(() => Promise.resolve());

	it("should call makeSubscriptions of transporter with all topics", () => {
		return transit.makeSubscriptions().catch(protectReject).then(() => {
			expect(transit.tx.makeSubscriptions).toHaveBeenCalledTimes(1);
			expect(transit.tx.makeSubscriptions).toHaveBeenCalledWith([
				{ "cmd": "EVENT",	"nodeID": "node1" },
				{ "cmd": "REQ",		"nodeID": "node1" },
				{ "cmd": "RES",		"nodeID": "node1" },
				{ "cmd": "DISCOVER" },
				{ "cmd": "DISCOVER",	"nodeID": "node1" },
				{ "cmd": "INFO" },
				{ "cmd": "INFO",		"nodeID": "node1" },
				{ "cmd": "DISCONNECT" },
				{ "cmd": "HEARTBEAT" },
				{ "cmd": "PING" },
				{ "cmd": "PING",		"nodeID": "node1" },
				{ "cmd": "PONG",		"nodeID": "node1" }
			]);
		});
	});

});

describe("Test Transit.messageHandler", () => {

	let broker;
	let transit;

	// transit.subscribe = jest.fn();

	beforeEach(() => {
		broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
		transit = broker.transit;
	});

	it("should throw Error if msg not valid", () => {
		expect(transit.stat.packets.received).toEqual({ count: 0, bytes: 0 });
		expect(transit.messageHandler("EVENT")).toBe(false);
	});

	it("should throw Error if no version", () => {
		expect(transit.messageHandler("EVENT", { payload: {} })).toBe(false);
	});

	it("should throw Error if version mismatch", () => {
		expect(transit.messageHandler("EVENT", { payload: { ver: "1" } })).toBe(false);
	});

	it("should not throw Error if version mismatch & disableVersionCheck is true", () => {
		transit.opts.disableVersionCheck = true;
		expect(transit.messageHandler("EVENT", { payload: { ver: "1" } })).toBe(true);
	});

	it("should call broker.fatal if nodeID is same but instanceID is different", () => {
		broker.fatal = jest.fn();
		transit.messageHandler("INFO", { payload: { ver: "4", sender: "node1", instanceID: "abcdef" } });
		expect(broker.fatal).toHaveBeenCalledTimes(1);
	});

	it("should skip own packets", () => {
		broker.fatal = jest.fn();
		const res = transit.messageHandler("INFO", { payload: { ver: "4", sender: "node1", instanceID: broker.instanceID } });
		expect(res).toBeUndefined();
		expect(broker.fatal).toHaveBeenCalledTimes(0);
	});

	it("should call _requestHandler if topic is 'REQ' ", () => {
		transit._requestHandler = jest.fn();

		let payload = { ver: "4", sender: "remote", action: "posts.find", id: "123", params: { limit: 5 }, meta: { b: 100 }, parentID: "555", level: 5, metrics: true, requestID: "123456", timeout: 567 };
		transit.messageHandler("REQ", { payload });

		expect(transit._requestHandler).toHaveBeenCalledTimes(1);
		expect(transit._requestHandler).toHaveBeenCalledWith(payload);
	});

	it("should call _requestHandler if topic is 'REQ' && sender is itself", () => {
		transit._requestHandler = jest.fn();

		let payload = { ver: "4", sender: broker.nodeID, action: "posts.find", id: "123", params: { limit: 5 }, meta: { b: 100 }, parentID: "555", level: 5, metrics: true, requestID: "123456", timeout: 567 };
		transit.messageHandler("REQ", { payload });

		expect(transit._requestHandler).toHaveBeenCalledTimes(1);
		expect(transit._requestHandler).toHaveBeenCalledWith(payload);
	});

	it("should call _responseHandler if topic is 'RES' ", () => {
		transit._responseHandler = jest.fn();

		let payload = { ver: "4", sender: "remote", id: "12345" };
		transit.messageHandler("RES", { payload });

		expect(transit._responseHandler).toHaveBeenCalledTimes(1);
		expect(transit._responseHandler).toHaveBeenCalledWith(payload);
	});

	it("should call _responseHandler if topic is 'RES' && sender is itself", () => {
		transit._responseHandler = jest.fn();

		let payload = { ver: "4", sender: broker.nodeID, id: "12345" };
		transit.messageHandler("RES", { payload });

		expect(transit._responseHandler).toHaveBeenCalledTimes(1);
		expect(transit._responseHandler).toHaveBeenCalledWith(payload);
	});

	it("should call __eventHandler if topic is 'EVENT' ", () => {
		transit._eventHandler = jest.fn();

		let payload = { ver: "4", sender: "remote", event: "user.created", data: "John Doe" };
		transit.messageHandler("EVENT", { payload });

		expect(transit._eventHandler).toHaveBeenCalledTimes(1);
		expect(transit._eventHandler).toHaveBeenCalledWith(payload);
	});

	it("should call __eventHandler if topic is 'EVENT' && sender is itself", () => {
		transit._eventHandler = jest.fn();

		let payload = { ver: "4", sender: broker.nodeID, event: "user.created", data: "John Doe" };
		transit.messageHandler("EVENT", { payload });

		expect(transit._eventHandler).toHaveBeenCalledTimes(1);
		expect(transit._eventHandler).toHaveBeenCalledWith(payload);
	});

	it("should call sendNodeInfo if topic is 'DISCOVER' ", () => {
		broker.registry.nodes.processNodeInfo = jest.fn();
		transit.sendNodeInfo = jest.fn();

		let payload = { ver: "4", sender: "remote" };
		transit.messageHandler("DISCOVER", { payload });
		expect(transit.sendNodeInfo).toHaveBeenCalledTimes(1);
		expect(transit.sendNodeInfo).toHaveBeenCalledWith("remote");
	});

	it("should call broker.registry.nodes.processNodeInfo if topic is 'INFO' ", () => {
		broker.registry.processNodeInfo = jest.fn();

		let payload = { ver: "4", sender: "remote", services: [] };
		transit.messageHandler("INFO", { payload });

		expect(broker.registry.processNodeInfo).toHaveBeenCalledTimes(1);
		expect(broker.registry.processNodeInfo).toHaveBeenCalledWith(payload);
	});

	it("should call broker.registry.disconnected if topic is 'DISCONNECT' ", () => {
		broker.registry.nodeDisconnected = jest.fn();

		let payload = { ver: "4", sender: "remote" };
		transit.messageHandler("DISCONNECT", { payload });

		expect(broker.registry.nodeDisconnected).toHaveBeenCalledTimes(1);
		expect(broker.registry.nodeDisconnected).toHaveBeenCalledWith(payload);
	});

	it("should call broker.registry.nodeHeartbeat if topic is 'HEARTBEAT' ", () => {
		broker.registry.nodeHeartbeat = jest.fn();

		let payload = { ver: "4", sender: "remote", cpu: 100 };
		transit.messageHandler("HEARTBEAT", { payload });

		expect(broker.registry.nodeHeartbeat).toHaveBeenCalledTimes(1);
		expect(broker.registry.nodeHeartbeat).toHaveBeenCalledWith(payload);
	});

	it("should call broker.registry.nodes.heartbeat if topic is 'PING' ", () => {
		transit.sendPong = jest.fn();

		let payload = { ver: "4", sender: "remote", time: 1234567 };
		transit.messageHandler("PING", { payload });

		expect(transit.sendPong).toHaveBeenCalledTimes(1);
		expect(transit.sendPong).toHaveBeenCalledWith(payload);
	});

	it("should call broker.registry.nodes.heartbeat if topic is 'PONG' ", () => {
		transit.processPong = jest.fn();

		let payload = { ver: "4", sender: "remote", time: 1234567, arrived: 7654321 };
		transit.messageHandler("PONG", { payload });

		expect(transit.processPong).toHaveBeenCalledTimes(1);
		expect(transit.processPong).toHaveBeenCalledWith(payload);
	});

	it("should skip processing if sender is itself", () => {
		transit.sendPong = jest.fn();

		let payload = { ver: "4", sender: broker.nodeID, time: 1234567 };
		transit.messageHandler("PING", { payload });

		expect(transit.sendPong).toHaveBeenCalledTimes(0);
	});
});

describe("Test Transit._eventHandler", () => {
	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;
	broker.emitLocalServices = jest.fn();

	it("should not create packet if broker is not started yet", () => {
		broker.emitLocalServices.mockClear();
		broker.started = false;
		transit._eventHandler({
			event: "user.created",
			data: { a: 5 },
			groups: ["users"],
			sender: "node-1",
			broadcast: true
		});

		expect(broker.emitLocalServices).toHaveBeenCalledTimes(0);
	});

	it("should create packet", () => {
		broker.emitLocalServices.mockClear();
		broker.started = true;
		transit._eventHandler({
			event: "user.created",
			data: { a: 5 },
			groups: ["users"],
			sender: "node-1",
			broadcast: true
		});

		expect(broker.emitLocalServices).toHaveBeenCalledTimes(1);
		expect(broker.emitLocalServices).toHaveBeenCalledWith("user.created", { "a": 5 }, ["users"], "node-1", true);
	});

});

/* old
describe("Test Transit._requestHandler", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter(), trackContext: true });
	const transit = broker.transit;
	broker.started = true;

	transit.sendResponse = jest.fn(() => Promise.resolve());
	transit._handleIncomingRequestStream = jest.fn(() => false);

	let handler = jest.fn(() => Promise.resolve([1, 5, 8]));
	let ep = {
		id: broker.nodeID,
		local: true,
		action: {
			name: "posts.find",
			service: {
				name: "posts",
				_addActiveContext: jest.fn()
			},
			handler
		}
	};

	it("should call handler & sendResponse with result", () => {
		broker._getLocalActionEndpoint = jest.fn(() => ep);

		let payload = { ver: "4", sender: "remote", action: "posts.find", id: "123", params: { limit: 5 }, meta: { b: 100 }, parentID: "555", level: 5, metrics: true, requestID: "123456", timeout: 567, stream: false };

		return transit._requestHandler(payload).catch(protectReject).then(() => {

			expect(handler).toHaveBeenCalledTimes(1);
			const ctx = handler.mock.calls[0][0];
			expect(handler).toHaveBeenCalledWith(ctx);

			expect(transit._handleIncomingRequestStream).toHaveBeenCalledTimes(1);
			expect(transit._handleIncomingRequestStream).toHaveBeenCalledWith(payload);

			// Check context props
			expect(ctx).toBeInstanceOf(Context);
			expect(ctx.id).toBe("123");
			expect(ctx.parentID).toBe("555");
			expect(ctx.requestID).toBe("123456");
			expect(ctx.action.name).toBe("posts.find");
			expect(ctx.params).toEqual({ limit: 5 });
			expect(ctx.meta).toEqual({ b: 100 });
			expect(ctx.metrics).toBe(true);
			expect(ctx.level).toBe(5);
			expect(ctx.options.timeout).toBe(567);

			expect(transit.sendResponse).toHaveBeenCalledTimes(1);
			expect(transit.sendResponse).toHaveBeenCalledWith("remote", "123", { b: 100 }, [1, 5, 8], null);
		});
	});

	it("should call handler & sendResponse with error", () => {
		transit.sendResponse.mockClear();
		transit._handleIncomingRequestStream.mockClear();
		handler = jest.fn(() => Promise.reject(new E.ValidationError("Not valid params")));
		ep.action.handler = handler;
		broker.options.requestTimeout = 2600;

		let payload = { ver: "4", sender: "remote", action: "posts.create", id: "123", params: { title: "Hello" }, meta: { b: 100 } };
		return transit._requestHandler(payload).then(protectReject).catch(() => {

			expect(handler).toHaveBeenCalledTimes(1);
			const ctx = handler.mock.calls[0][0];
			expect(handler).toHaveBeenCalledWith(ctx);

			expect(transit._handleIncomingRequestStream).toHaveBeenCalledTimes(0);

			// Check context props
			expect(ctx).toBeInstanceOf(Context);
			expect(ctx.id).toBe("123");
			expect(ctx.params).toEqual({ "title": "Hello" });
			expect(ctx.meta).toEqual({ b: 100 });
			expect(ctx.options.timeout).toBe(2600);

			expect(transit.sendResponse).toHaveBeenCalledTimes(1);
			expect(transit.sendResponse).toHaveBeenCalledWith("remote", "123", { b: 100 }, null, jasmine.any(E.ValidationError));
		});
	});

	it("should call sendResponse with error if no endpoint", () => {
		transit.sendResponse.mockClear();
		broker._getLocalActionEndpoint = jest.fn(() => { throw new E.ServiceNotFoundError("posts.find", broker.nodeID); });
		broker._handleRemoteRequest = jest.fn(() => Promise.reject(new E.ValidationError("Not valid params")));

		let payload = { ver: "4", sender: "remote", action: "posts.create", id: "123", params: { title: "Hello" }, meta: { b: 100 } };
		return transit._requestHandler(payload).then(protectReject).catch(() => {

			expect(broker._handleRemoteRequest).toHaveBeenCalledTimes(0);
			expect(transit.sendResponse).toHaveBeenCalledTimes(1);
			expect(transit.sendResponse).toHaveBeenCalledWith("remote", "123", { b: 100 }, null, jasmine.any(E.ServiceNotFoundError));
		});
	});

	it("should not call sendResponse if it is a stream chunk", () => {
		handler.mockClear();
		broker._getLocalActionEndpoint.mockClear();
		broker._handleRemoteRequest.mockClear();
		transit.sendResponse.mockClear();
		transit._handleIncomingRequestStream = jest.fn(() => null);

		let payload = { ver: "4", sender: "remote", action: "posts.create", id: "123", params: { title: "Hello" }, meta: { b: 100 }, stream: true, seq: 3 };
		return transit._requestHandler(payload).then(protectReject).catch(() => {

			expect(handler).toHaveBeenCalledTimes(0);

			expect(transit._handleIncomingRequestStream).toHaveBeenCalledTimes(1);
			expect(transit._handleIncomingRequestStream).toHaveBeenCalledWith(payload);

			expect(broker._handleRemoteRequest).toHaveBeenCalledTimes(0);
			expect(transit.sendResponse).toHaveBeenCalledTimes(0);
		});
	});

	it("should call sendResponse with error if broker stopped", () => {
		broker.started = false;

		broker._getLocalActionEndpoint.mockClear();
		broker._handleRemoteRequest.mockClear();
		transit.sendResponse.mockClear();

		let payload = { ver: "4", sender: "remote", action: "posts.create", id: "123", params: { title: "Hello" }, meta: { b: 100 } };
		return transit._requestHandler(payload).then(protectReject).catch(() => {
			expect(broker._getLocalActionEndpoint).toHaveBeenCalledTimes(0);
			expect(broker._handleRemoteRequest).toHaveBeenCalledTimes(0);
			expect(transit.sendResponse).toHaveBeenCalledTimes(1);
			expect(transit.sendResponse).toHaveBeenCalledWith("remote", "123", { b: 100 }, null, jasmine.any(E.ServiceNotAvailableError));
		});
	});

});
*/
describe("Test Transit._requestHandler", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;
	transit._handleIncomingRequestStream = jest.fn();
	const ep = {
		action: {
			handler: jest.fn(() => Promise.resolve())
		}
	};
	broker._getLocalActionEndpoint = jest.fn(() => ep);
	transit.sendResponse = jest.fn(() => Promise.resolve());

	let id = "12345";

	it("should send back error if broker is not started yet", () => {
		broker.started = false;
		return transit._requestHandler({
			sender: "node2",
			id,
			meta: { a: 5 },
			action: "posts.find"
		}).catch(protectReject).then(() => {
			expect(transit.sendResponse).toHaveBeenCalledTimes(1);
			expect(transit.sendResponse).toHaveBeenCalledWith("node2", id, { a: 5 }, null, expect.any(Error));
			expect(transit._handleIncomingRequestStream).toHaveBeenCalledTimes(0);
			broker.started = true;
		});
	});

	it("should not call sendResponse if stream chunk is received", () => {
		transit.sendResponse.mockClear();
		transit._handleIncomingRequestStream = jest.fn(() => null);
		const payload = {
			sender: "node2",
			id,
			meta: { a: 5 },
			action: "posts.find",
			stream: true,
			seq: 4
		};

		return transit._requestHandler(payload).catch(protectReject).then(() => {
			expect(transit.sendResponse).toHaveBeenCalledTimes(0);
			expect(transit._handleIncomingRequestStream).toHaveBeenCalledTimes(1);
			expect(transit._handleIncomingRequestStream).toHaveBeenCalledWith(payload);
		});

	});

	it("should call sendResponse with data", () => {
		transit.sendResponse.mockClear();
		transit._handleIncomingRequestStream.mockClear();

		let data = { id: 5, name: "John" };
		ep.action.handler = jest.fn(() => Promise.resolve(data));

		const payload = {
			sender: "node2",
			id,
			meta: { a: 5 },
			action: "posts.find",
			params: { name: "John" },
			parentID: "00000",
			requestID: "12345-54321",
			level: 3,
			metrics: true,
			timeout: 230
		};

		return transit._requestHandler(payload).catch(protectReject).then(() => {
			expect(transit._handleIncomingRequestStream).toHaveBeenCalledTimes(0);

			expect(transit.broker._getLocalActionEndpoint).toHaveBeenCalledTimes(1);
			expect(transit.broker._getLocalActionEndpoint).toHaveBeenCalledWith("posts.find");

			expect(ep.action.handler).toHaveBeenCalledTimes(1);
			expect(ep.action.handler).toHaveBeenCalledWith(expect.any(Context));
			const ctx = ep.action.handler.mock.calls[0][0];

			expect(ctx).toBeInstanceOf(Context);
			expect(ctx.id).toBe(id);
			expect(ctx.endpoint).toBe(ep);
			expect(ctx.action).toBe(ep.action);
			expect(ctx.params).toEqual({ name: "John" });
			expect(ctx.parentID).toBe("00000");
			expect(ctx.requestID).toBe("12345-54321");
			expect(ctx.meta).toEqual({ a: 5 });
			expect(ctx.level).toBe(3);
			expect(ctx.metrics).toBe(true);
			expect(ctx.nodeID).toBe("node2");
			expect(ctx.options.timeout).toBe(230);

			expect(transit.sendResponse).toHaveBeenCalledTimes(1);
			expect(transit.sendResponse).toHaveBeenCalledWith("node2", id, { a: 5 }, data, null);
		});
	});

	it("should call sendResponse with error", () => {
		transit.sendResponse.mockClear();
		broker._getLocalActionEndpoint.mockClear();
		const pass = { streaming: true };
		transit._handleIncomingRequestStream = jest.fn(() => pass);

		let err = new Error("Something went wrong");
		ep.action.handler = jest.fn(() => Promise.reject(err));

		const payload = {
			sender: "node2",
			id,
			meta: { a: 5 },
			action: "posts.find",
			parentID: "00000",
			requestID: "12345-54321",
			level: 3,
			stream: false,
			metrics: true,
			timeout: 230
		};

		return transit._requestHandler(payload).catch(protectReject).then(() => {
			expect(transit._handleIncomingRequestStream).toHaveBeenCalledTimes(1);
			expect(transit._handleIncomingRequestStream).toHaveBeenCalledWith(payload);

			expect(transit.broker._getLocalActionEndpoint).toHaveBeenCalledTimes(1);
			expect(transit.broker._getLocalActionEndpoint).toHaveBeenCalledWith("posts.find");

			expect(ep.action.handler).toHaveBeenCalledTimes(1);
			expect(ep.action.handler).toHaveBeenCalledWith(expect.any(Context));
			const ctx = ep.action.handler.mock.calls[0][0];

			expect(ctx).toBeInstanceOf(Context);
			expect(ctx.id).toBe(id);
			expect(ctx.endpoint).toBe(ep);
			expect(ctx.action).toBe(ep.action);
			expect(ctx.params).toEqual({ streaming: true });
			expect(ctx.parentID).toBe("00000");
			expect(ctx.requestID).toBe("12345-54321");
			expect(ctx.meta).toEqual({ a: 5 });
			expect(ctx.level).toBe(3);
			expect(ctx.metrics).toBe(true);
			expect(ctx.nodeID).toBe("node2");
			expect(ctx.options.timeout).toBe(230);

			expect(transit.sendResponse).toHaveBeenCalledTimes(1);
			expect(transit.sendResponse).toHaveBeenCalledWith("node2", id, { a: 5 }, null, err);
		});
	});
});

describe("Test Transit._handleIncomingRequestStream", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;
	broker.started = true;

	describe("Test with non-stream data", () => {
		const payload = { ver: "4", sender: "remote", action: "posts.import", id: "123" };

		it("should return false", () => {
			const pass = transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: false, seq: 0 }));
			expect(pass).toBe(false);
		});

		it("should return false", () => {
			const pass = transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: false }));
			expect(pass).toBe(false);
		});

		it("should return false", () => {
			const pass = transit._handleIncomingRequestStream(payload);
			expect(pass).toBe(false);
		});
	});

	describe("Test with sequential chunks", () => {
		let STORE = [];
		const payload = { ver: "4", sender: "remote", action: "posts.import", id: "123" };

		it("should create new stream", () => {
			const pass = transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 0 }));
			expect(pass).toBeInstanceOf(Transform);
			pass.on("data", data => STORE.push(data.toString()));
			pass.on("error", () => STORE.push("-- ERROR --"));
			pass.on("end", () => STORE.push("-- END --"));
		});

		it("should add chunks", () => {
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 1, params: "CHUNK-1" }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 2, params: "CHUNK-2" }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 3, params: "CHUNK-3" }))).toBeNull();
			expect(STORE).toEqual([
				"CHUNK-1",
				"CHUNK-2",
				"CHUNK-3"
			]);
		});

		it("should close the stream", () => {
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: false, seq: 4 }))).toBeNull();
			return broker.Promise.delay(100).then(() => {
				expect(STORE).toEqual([
					"CHUNK-1",
					"CHUNK-2",
					"CHUNK-3",
					"-- END --"
				]);

			});
		});
	});

	describe("Test with sequential chunks & error", () => {
		let STORE = [];
		const payload = { ver: "4", sender: "remote", action: "posts.import", id: "123" };
		const errorHandler = jest.fn(() => STORE.push("-- ERROR --"));

		it("should create new stream", () => {
			const pass = transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 0 }));
			expect(pass).toBeInstanceOf(Transform);
			pass.on("data", data => STORE.push(data.toString()));
			pass.on("error", errorHandler);
			pass.on("end", () => STORE.push("-- END --"));
		});

		it("should add chunks", () => {
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 1, params: "CHUNK-1" }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 2, params: "CHUNK-2" }))).toBeNull();
			expect(STORE).toEqual([
				"CHUNK-1",
				"CHUNK-2"
			]);
		});

		it("should got error", () => {
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: false, seq: 3, meta: { $streamError: { name: "MoleculerError", message: "Some stream error" } } }))).toBeNull();
			return broker.Promise.delay(100).then(() => {
				expect(STORE).toEqual([
					"CHUNK-1",
					"CHUNK-2",
					"-- ERROR --",
					"-- END --"
				]);

				expect(errorHandler).toHaveBeenCalledTimes(1);
				expect(errorHandler.mock.calls[0][0]).toBeInstanceOf(E.MoleculerError);
			});
		});
	});

	describe("Test with random order inside chunks", () => {
		let STORE = [];
		const payload = { ver: "4", sender: "remote", action: "posts.import", id: "123" };

		it("should create new stream", () => {
			const pass = transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 0 }));
			expect(pass).toBeInstanceOf(Transform);
			pass.on("data", data => STORE.push(data.toString()));
			pass.on("error", () => STORE.push("-- ERROR --"));
			pass.on("end", () => STORE.push("-- END --"));
		});

		it("should reorder chunks", () => {
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 1, params: "CHUNK-1" }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 4, params: "CHUNK-4" }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 3, params: "CHUNK-3" }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 2, params: "CHUNK-2" }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 6, params: "CHUNK-6" }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 5, params: "CHUNK-5" }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: false, seq: 7 }))).toBeNull();

			return broker.Promise.delay(100).then(() => {
				expect(STORE).toEqual([
					"CHUNK-1",
					"CHUNK-2",
					"CHUNK-3",
					"CHUNK-4",
					"CHUNK-5",
					"CHUNK-6",
					"-- END --"
				]);
			});
		});
	});

	describe("Test with wrong first & last chunks orders", () => {
		let STORE = [];
		const payload = { ver: "4", sender: "remote", action: "posts.import", id: "124" };

		it("should create new stream", () => {
			const pass = transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 1, params: "CHUNK-1" }));
			expect(pass).toBeInstanceOf(Transform);
			pass.on("data", data => STORE.push(data.toString()));
			pass.on("error", () => STORE.push("-- ERROR --"));
			pass.on("end", () => STORE.push("-- END --"));
		});

		it("should reorder chunks", () => {
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 0 }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 4, params: "CHUNK-4" }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 3, params: "CHUNK-3" }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 2, params: "CHUNK-2" }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: false, seq: 7 }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 6, params: "CHUNK-6" }))).toBeNull();
			expect(transit._handleIncomingRequestStream(Object.assign({}, payload, { stream: true, seq: 5, params: "CHUNK-5" }))).toBeNull();

			return broker.Promise.delay(100).then(() => {
				expect(STORE).toEqual([
					"CHUNK-1",
					"CHUNK-2",
					"CHUNK-3",
					"CHUNK-4",
					"CHUNK-5",
					"CHUNK-6",
					"-- END --"
				]);
			});
		});
	});
});

describe("Test Transit._createErrFromPayload", () => {
	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	it("should create original error from payload", () => {
		const err = transit._createErrFromPayload({
			name: "ServiceNotFoundError",
			code: 404,
			type: "SERVICE_NOT_FOUND",
			data: { a: 5 },
			retryable: true,
			nodeID: "node-1234",
			stack: "error stack"
		});

		expect(err).toBeInstanceOf(E.MoleculerError);
		expect(err).toBeInstanceOf(E.ServiceNotFoundError);
		expect(err.name).toBe("ServiceNotFoundError");
		expect(err.code).toBe(404);
		expect(err.type).toBe("SERVICE_NOT_FOUND");
		expect(err.data).toEqual({ a: 5 });
		expect(err.retryable).toBe(true);
		expect(err.nodeID).toBe("node-1234");
		expect(err.stack).toBe("error stack");
	});

	it("should create original error from payload with other sender", () => {
		const err = transit._createErrFromPayload({
			name: "ServiceNotFoundError",
			code: 404,
			type: "SERVICE_NOT_FOUND",
			data: { a: 5 },
			retryable: true,
			stack: "error stack"
		}, "node-999");

		expect(err).toBeInstanceOf(E.MoleculerError);
		expect(err).toBeInstanceOf(E.ServiceNotFoundError);
		expect(err.name).toBe("ServiceNotFoundError");
		expect(err.code).toBe(404);
		expect(err.type).toBe("SERVICE_NOT_FOUND");
		expect(err.data).toEqual({ a: 5 });
		expect(err.retryable).toBe(true);
		expect(err.nodeID).toBe("node-999");
		expect(err.stack).toBe("error stack");
	});

	it("should create a common error from payload", () => {
		const err = transit._createErrFromPayload({
			name: "MyCustomError",
			code: 456,
			type: "NOTHING",
			data: { b: 5 },
			retryable: true,
			nodeID: "node-1234",
			stack: "error stack"
		});

		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe("MyCustomError");
		expect(err.code).toBe(456);
		expect(err.type).toBe("NOTHING");
		expect(err.data).toEqual({ b: 5 });
		expect(err.retryable).toBe(true);
		expect(err.nodeID).toBe("node-1234");
		expect(err.stack).toBe("error stack");
	});
});

describe("Test Transit._responseHandler", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;
	transit._handleIncomingResponseStream = jest.fn();

	let id = "12345";

	it("should not call resolve or reject if pending req is not exists", () => {
		let req = { resolve: jest.fn(), reject: jest.fn() };
		let payload = { ver: "4", sender: "remote", id };

		transit._responseHandler(payload);
		expect(req.resolve).toHaveBeenCalledTimes(0);
		expect(req.reject).toHaveBeenCalledTimes(0);

		expect(transit._handleIncomingResponseStream).toHaveBeenCalledTimes(0);
	});

	it("should call resolve with data", () => {
		let data = { id: 5, name: "John" };
		let req = {
			action: { name: "posts.find" },
			ctx: { nodeID: null },
			resolve: jest.fn(() => Promise.resolve()),
			reject: jest.fn(() => Promise.resolve())
		};
		transit.pendingRequests.set(id, req);

		let payload = { ver: "4", sender: "remote", id, success: true, data, stream: false };
		transit._responseHandler(payload);
		expect(req.resolve).toHaveBeenCalledTimes(1);
		expect(req.resolve).toHaveBeenCalledWith(data);
		expect(req.reject).toHaveBeenCalledTimes(0);
		expect(req.ctx.nodeID).toBe("remote");

		expect(transit.pendingRequests.size).toBe(0);
		expect(transit._handleIncomingResponseStream).toHaveBeenCalledTimes(1);
		expect(transit._handleIncomingResponseStream).toHaveBeenCalledWith(payload, req);
	});

	it("should call reject with error", () => {
		transit._handleIncomingResponseStream.mockClear();

		let err;
		let req = {
			action: { name: "posts.find" },
			ctx: { nodeID: null },
			resolve: jest.fn(),
			reject: jest.fn(e => err = e)
		};
		transit.pendingRequests.set(id, req);

		let payload = { ver: "4", sender: "remote", id, success: false, error: {
			name: "ValidationError",
			code: 422,
			retryable: true,
			data: { a: 5 },
			stack: "STACK-TRACE"
		} };

		transit._responseHandler(payload);

		expect(transit._handleIncomingResponseStream).toHaveBeenCalledTimes(0);

		expect(req.reject).toHaveBeenCalledTimes(1);
		expect(req.reject).toHaveBeenCalledWith(err);
		expect(req.resolve).toHaveBeenCalledTimes(0);
		expect(req.ctx.nodeID).toBe("remote");

		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(E.ValidationError);
		expect(err.name).toBe("ValidationError");
		expect(err.code).toBe(422);
		expect(err.retryable).toBe(true);
		expect(err.data).toEqual({ a: 5 });
		expect(err.stack).toBe("STACK-TRACE");
		expect(err.nodeID).toBe("remote");

		expect(transit.pendingRequests.size).toBe(0);

	});

	it("should call reject with custom error", () => {
		transit._handleIncomingResponseStream.mockClear();

		let err;
		let req = {
			action: { name: "posts.find" },
			ctx: { nodeID: null },
			resolve: jest.fn(),
			reject: jest.fn(e => err = e)
		};
		transit.pendingRequests.set(id, req);

		let payload = { ver: "4", sender: "remote", id, success: false, error: {
			name: "MyCustomError",
			code: 456,
			retryable: true,
			data: { a: 5 },
			stack: "MY-STACK-TRACE"
		} };

		transit._responseHandler(payload);

		expect(transit._handleIncomingResponseStream).toHaveBeenCalledTimes(0);

		expect(req.reject).toHaveBeenCalledTimes(1);
		expect(req.reject).toHaveBeenCalledWith(err);
		expect(req.resolve).toHaveBeenCalledTimes(0);
		expect(req.ctx.nodeID).toBe("remote");

		expect(err).toBeInstanceOf(Error);
		expect(err.name).toBe("MyCustomError");
		expect(err.code).toBe(456);
		expect(err.retryable).toBe(true);
		expect(err.data).toEqual({ a: 5 });
		expect(err.stack).toBe("MY-STACK-TRACE");
		expect(err.nodeID).toBe("remote");

		expect(transit.pendingRequests.size).toBe(0);

	});


	it("should not call resolve if stream chunk is received", () => {
		transit._handleIncomingResponseStream = jest.fn(() => true);

		let req = {
			action: { name: "posts.find" },
			ctx: { nodeID: null },
			resolve: jest.fn(() => Promise.resolve()),
			reject: jest.fn(() => Promise.resolve())
		};
		transit.pendingRequests.set(id, req);

		let payload = { ver: "4", sender: "remote", id, success: true, stream: true, seq: 5 };
		transit._responseHandler(payload);

		expect(transit._handleIncomingResponseStream).toHaveBeenCalledTimes(1);
		expect(transit._handleIncomingResponseStream).toHaveBeenCalledWith(payload, req);

		expect(req.resolve).toHaveBeenCalledTimes(0);
		expect(req.reject).toHaveBeenCalledTimes(0);
		expect(transit.pendingRequests.size).toBe(1);
	});
});

describe("Test Transit._handleIncomingResponseStream", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;
	broker.started = true;

	describe("Test with non-stream data", () => {
		const payload = { ver: "4", sender: "remote", id: "123" };
		let req = {
			action: { name: "posts.find" },
			ctx: { nodeID: null },
			resolve: jest.fn(() => Promise.resolve()),
			reject: jest.fn(() => Promise.resolve())
		};
		transit.pendingRequests.set("123", req);

		it("should return false", () => {
			const pass = transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: false, seq: 0 }), req);
			expect(pass).toBe(false);
		});

		it("should return false", () => {
			const pass = transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: false }), req);
			expect(pass).toBe(false);
		});

		it("should return false", () => {
			const pass = transit._handleIncomingResponseStream(payload, req);
			expect(pass).toBe(false);
		});
	});

	describe("Test with sequential chunks", () => {
		let STORE = [];
		const payload = { ver: "4", sender: "remote", id: "124", success: true };
		let req = {
			action: { name: "posts.find" },
			ctx: { nodeID: null },
			resolve: jest.fn(() => Promise.resolve()),
			reject: jest.fn(() => Promise.resolve())
		};
		transit.pendingRequests.set("124", req);

		it("should create new stream", () => {
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 0 }), req)).toBe(true);
			expect(req.resolve).toHaveBeenCalledTimes(1);
			const pass = req.resolve.mock.calls[0][0];
			expect(pass).toBeInstanceOf(Transform);
			pass.on("data", data => STORE.push(data.toString()));
			pass.on("error", () => STORE.push("-- ERROR --"));
			pass.on("end", () => STORE.push("-- END --"));
		});

		it("should add chunks", () => {
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 1, data: "CHUNK-1" }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 2, data: "CHUNK-2" }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 3, data: "CHUNK-3" }), req)).toBe(true);
			expect(STORE).toEqual([
				"CHUNK-1",
				"CHUNK-2",
				"CHUNK-3"
			]);
		});

		it("should close the stream", () => {
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: false, seq: 4 }), req)).toBe(true);
			return broker.Promise.delay(100).then(() => {
				expect(STORE).toEqual([
					"CHUNK-1",
					"CHUNK-2",
					"CHUNK-3",
					"-- END --"
				]);

			});
		});
	});

	describe("Test with sequential chunks & error", () => {
		let STORE = [];
		const payload = { ver: "4", sender: "remote", id: "125", success: true };
		let req = {
			action: { name: "posts.find" },
			ctx: { nodeID: null },
			resolve: jest.fn(() => Promise.resolve()),
			reject: jest.fn(() => Promise.resolve())
		};
		const errorHandler = jest.fn(() => STORE.push("-- ERROR --"));
		transit.pendingRequests.set("125", req);

		it("should create new stream", () => {
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 0 }), req)).toBe(true);
			expect(req.resolve).toHaveBeenCalledTimes(1);
			const pass = req.resolve.mock.calls[0][0];
			expect(pass).toBeInstanceOf(Transform);
			pass.on("data", data => STORE.push(data.toString()));
			pass.on("error", errorHandler);
			pass.on("end", () => STORE.push("-- END --"));
		});

		it("should add chunks", () => {
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 1, data: "CHUNK-1" }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 2, data: "CHUNK-2" }), req)).toBe(true);
			expect(STORE).toEqual([
				"CHUNK-1",
				"CHUNK-2"
			]);
		});

		it("should got error", () => {
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { success: false, stream: false, seq: 3, error: { name: "MoleculerError", message: "Some stream error" } }), req)).toBe(true);
			return broker.Promise.delay(100).then(() => {
				expect(STORE).toEqual([
					"CHUNK-1",
					"CHUNK-2",
					"-- ERROR --",
					"-- END --"
				]);

				expect(errorHandler).toHaveBeenCalledTimes(1);
				expect(errorHandler.mock.calls[0][0]).toBeInstanceOf(E.MoleculerError);
			});
		});
	});

	describe("Test with random order inside chunks", () => {
		let STORE = [];
		const payload = { ver: "4", sender: "remote", id: "126", success: true };
		let req = {
			action: { name: "posts.find" },
			ctx: { nodeID: null },
			resolve: jest.fn(() => Promise.resolve()),
			reject: jest.fn(() => Promise.resolve())
		};
		transit.pendingRequests.set("126", req);
		const errorHandler = jest.fn(() => STORE.push("-- ERROR --"));

		it("should create new stream", () => {
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 0 }), req)).toBe(true);
			expect(req.resolve).toHaveBeenCalledTimes(1);
			const pass = req.resolve.mock.calls[0][0];
			expect(pass).toBeInstanceOf(Transform);
			pass.on("data", data => STORE.push(data.toString()));
			pass.on("error", errorHandler);
			pass.on("end", () => STORE.push("-- END --"));
		});

		it("should reorder chunks", () => {
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 1, data: "CHUNK-1" }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 4, data: "CHUNK-4" }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 3, data: "CHUNK-3" }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 2, data: "CHUNK-2" }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 6, data: "CHUNK-6" }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 5, data: "CHUNK-5" }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: false, seq: 7 }), req)).toBe(true);

			return broker.Promise.delay(100).then(() => {
				expect(STORE).toEqual([
					"CHUNK-1",
					"CHUNK-2",
					"CHUNK-3",
					"CHUNK-4",
					"CHUNK-5",
					"CHUNK-6",
					"-- END --"
				]);
			});
		});
	});

	describe("Test with wrong first & last chunks orders", () => {
		let STORE = [];
		const payload = { ver: "4", sender: "remote", id: "127", success: true };
		let req = {
			action: { name: "posts.find" },
			ctx: { nodeID: null },
			resolve: jest.fn(() => Promise.resolve()),
			reject: jest.fn(() => Promise.resolve())
		};
		transit.pendingRequests.set("127", req);
		const errorHandler = jest.fn(() => STORE.push("-- ERROR --"));

		it("should create new stream", () => {
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 1, data: "CHUNK-1" }), req)).toBe(true);
			expect(req.resolve).toHaveBeenCalledTimes(1);
			const pass = req.resolve.mock.calls[0][0];
			expect(pass).toBeInstanceOf(Transform);
			pass.on("data", data => STORE.push(data.toString()));
			pass.on("error", errorHandler);
			pass.on("end", () => STORE.push("-- END --"));
		});

		it("should reorder chunks", () => {
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 0 }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 4, data: "CHUNK-4" }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 3, data: "CHUNK-3" }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 2, data: "CHUNK-2" }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: false, seq: 7 }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 6, data: "CHUNK-6" }), req)).toBe(true);
			expect(transit._handleIncomingResponseStream(Object.assign({}, payload, { stream: true, seq: 5, data: "CHUNK-5" }), req)).toBe(true);

			return broker.Promise.delay(100).then(() => {
				expect(STORE).toEqual([
					"CHUNK-1",
					"CHUNK-2",
					"CHUNK-3",
					"CHUNK-4",
					"CHUNK-5",
					"CHUNK-6",
					"-- END --"
				]);
			});
		});
	});
});

describe("Test Transit.request", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;
	transit._sendRequest = jest.fn((ctx, resolve, reject) => resolve());

	let ctx = new Context(broker, { action: { name: "users.find" } });
	ctx.nodeID = "remote";
	ctx.params = { a: 5 };
	ctx.meta = {
		user: {
			id: 5,
			roles: [ "user" ]
		}
	},
	ctx.options.timeout = 500;
	ctx.id = "12345";
	ctx.requestID = "1111";

	it("should create packet", () => {
		return transit.request(ctx).catch(protectReject).then(() => {
			expect(transit._sendRequest).toHaveBeenCalledTimes(1);
			expect(transit._sendRequest).toHaveBeenCalledWith(ctx, expect.any(Function), expect.any(Function));
		});
	});

	it("should throw error if queue is full", () => {
		transit.pendingRequests = { size: 100 };
		transit.opts.maxQueueSize = 100;
		return transit.request(ctx).then(protectReject).catch(err => {
			expect(err).toBeInstanceOf(E.QueueIsFullError);
			expect(err.data.action).toBe("users.find");
			expect(err.data.nodeID).toBe("node1");
			expect(err.data.size).toBe(100);
			expect(err.data.limit).toBe(100);
		});
	});

});

// : _sendRequest

describe("Test Transit.sendBroadcastEvent", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	transit.publish = jest.fn(() => Promise.resolve());

	it("should call publish with correct params and without groups", () => {
		const user = { id: 5, name: "Jameson" };
		transit.sendBroadcastEvent("node2", "user.created", user);
		expect(transit.publish).toHaveBeenCalledTimes(1);
		const packet = transit.publish.mock.calls[0][0];
		expect(packet).toBeInstanceOf(P.Packet);
		expect(packet.type).toBe(P.PACKET_EVENT);
		expect(packet.target).toBe("node2");
		expect(packet.payload.event).toBe("user.created");
		expect(packet.payload.data).toBe(user);
		expect(packet.payload.groups).toBeUndefined();
		expect(packet.payload.broadcast).toBe(true);
	});

	it("should call publish with correct params and with groups", () => {
		transit.publish.mockClear();
		const user = { id: 5, name: "Jameson" };
		transit.sendBroadcastEvent("node2", "user.created", user, ["mail", "payment"]);
		expect(transit.publish).toHaveBeenCalledTimes(1);
		const packet = transit.publish.mock.calls[0][0];
		expect(packet).toBeInstanceOf(P.Packet);
		expect(packet.type).toBe(P.PACKET_EVENT);
		expect(packet.target).toBe("node2");
		expect(packet.payload.event).toBe("user.created");
		expect(packet.payload.data).toBe(user);
		expect(packet.payload.groups).toEqual(["mail", "payment"]);
		expect(packet.payload.broadcast).toBe(true);
	});

});

describe("Test Transit.sendBalancedEvent", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	transit.publish = jest.fn(() => Promise.resolve());

	it("should call publish with correct params", () => {
		const user = { id: 5, name: "Jameson" };
		transit.sendBalancedEvent("user.created", user, {
			"node-2": ["users", "payments"],
			"node-4": ["mail"]
		});
		expect(transit.publish).toHaveBeenCalledTimes(2);

		const packet1 = transit.publish.mock.calls[0][0];
		expect(packet1).toBeInstanceOf(P.Packet);
		expect(packet1.type).toBe(P.PACKET_EVENT);
		expect(packet1.target).toBe("node-2");
		expect(packet1.payload.event).toBe("user.created");
		expect(packet1.payload.data).toBe(user);
		expect(packet1.payload.groups).toEqual(["users", "payments"]);
		expect(packet1.payload.broadcast).toBe(false);

		const packet2 = transit.publish.mock.calls[1][0];
		expect(packet2).toBeInstanceOf(P.Packet);
		expect(packet2.type).toBe(P.PACKET_EVENT);
		expect(packet2.target).toBe("node-4");
		expect(packet2.payload.event).toBe("user.created");
		expect(packet2.payload.data).toBe(user);
		expect(packet2.payload.groups).toEqual(["mail"]);
		expect(packet2.payload.broadcast).toBe(false);
	});

});

describe("Test Transit.sendEventToGroups", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	transit.publish = jest.fn(() => Promise.resolve());

	it("should call publish with groups", () => {
		transit.publish.mockClear();
		const user = { id: 5, name: "Jameson" };
		transit.sendEventToGroups("user.created", user, ["users", "mail"]);
		expect(transit.publish).toHaveBeenCalledTimes(1);
		const packet = transit.publish.mock.calls[0][0];
		expect(packet).toBeInstanceOf(P.Packet);
		expect(packet.type).toBe(P.PACKET_EVENT);
		expect(packet.target).toBeNull();
		expect(packet.payload.event).toBe("user.created");
		expect(packet.payload.data).toBe(user);
		expect(packet.payload.groups).toEqual(["users", "mail"]);
		expect(packet.payload.broadcast).toBe(false);
	});
});

describe("Test Transit.removePendingRequest", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	const id = "12345";

	transit.pendingRequests.set(id, {});
	transit.pendingReqStreams.set(id, {});
	transit.pendingResStreams.set(id, {});

	it("should remove pending request from maps", () => {
		transit.removePendingRequest(id);

		expect(transit.pendingRequests.size).toBe(0);
		expect(transit.pendingReqStreams.size).toBe(0);
		expect(transit.pendingResStreams.size).toBe(0);
	});
});

describe("Test Transit.removePendingRequestByNodeID", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	transit.publish = jest.fn(() => Promise.resolve());

	const resolve = jest.fn();
	const reject = jest.fn();
	const ep = { action: { name: "users.create" }, node: { id: "node1" } };
	const ctx = new Context(broker, ep);
	ctx.id = 1;
	ctx.nodeID = "node2";

	const resolve2 = jest.fn();
	const reject2 = jest.fn();
	const ctx2 = new Context(broker, ep);
	ctx.id = 2;
	ctx2.nodeID = "node3";

	it("should add to pendingRequest list", () => {
		expect(transit.pendingRequests.size).toBe(0);

		transit._sendRequest(ctx, resolve, reject);
		expect(transit.pendingRequests.size).toBe(1);

		transit._sendRequest(ctx2, resolve2, reject2);
		expect(transit.pendingRequests.size).toBe(2);
	});

	it("should not remove if call with other nodeID", () => {
		transit.removePendingRequestByNodeID("node1");
		expect(transit.pendingRequests.size).toBe(2);
	});

	it("should reject pending orders by nodeID", () => {
		transit.removePendingRequestByNodeID("node2");
		expect(transit.pendingRequests.size).toBe(1);
		expect(resolve).toHaveBeenCalledTimes(0);
		expect(resolve2).toHaveBeenCalledTimes(0);
		expect(reject).toHaveBeenCalledTimes(1);
		expect(reject).toHaveBeenCalledWith(jasmine.any(E.RequestRejectedError));
	});

	it("should reject pending orders by nodeID #2", () => {
		transit.removePendingRequestByNodeID("node3");
		expect(transit.pendingRequests.size).toBe(0);
		expect(resolve2).toHaveBeenCalledTimes(0);
		expect(reject2).toHaveBeenCalledTimes(1);
		expect(reject2).toHaveBeenCalledWith(jasmine.any(E.RequestRejectedError));
	});

});

// : _createPayloadErrorField
describe("Test Transit._createPayloadErrorField", () => {
	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	it("should create payload from Error", () => {
		const err = new E.MoleculerRetryableError("Something went wrong", 456, "CUSTOM", { a: 5 });
		err.stack = "custom stack";

		const res = transit._createPayloadErrorField(err);
		expect(res).toEqual({
			name: "MoleculerRetryableError",
			message: "Something went wrong",
			nodeID: "node1",
			code: 456,
			type: "CUSTOM",
			retryable: true,
			stack: "custom stack",
			data: { "a": 5 },
		});
	});
});

describe("Test Transit.sendResponse", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	transit.publish = jest.fn(() => Promise.resolve());

	const meta = { headers: ["header"] };
	it("should call publish with the data", () => {
		const data = { id: 1, name: "John Doe" };
		transit.sendResponse("node2", "12345", meta, data);
		expect(transit.publish).toHaveBeenCalledTimes(1);
		const packet = transit.publish.mock.calls[0][0];
		expect(packet).toBeInstanceOf(P.Packet);
		expect(packet.type).toBe(P.PACKET_RESPONSE);
		expect(packet.target).toBe("node2");
		expect(packet.payload.id).toBe("12345");
		expect(packet.payload.meta).toBe(meta);
		expect(packet.payload.success).toBe(true);
		expect(packet.payload.data).toBe(data);
	});

	it("should call publish with the error", () => {
		transit.publish.mockClear();
		transit.sendResponse("node2", "12345", meta, null, new E.ValidationError("Not valid params", "ERR_INVALID_A_PARAM", { a: "Too small" }));
		expect(transit.publish).toHaveBeenCalledTimes(1);
		const packet = transit.publish.mock.calls[0][0];
		expect(packet).toBeInstanceOf(P.Packet);
		expect(packet.type).toBe(P.PACKET_RESPONSE);
		expect(packet.target).toBe("node2");
		expect(packet.payload.id).toBe("12345");
		expect(packet.payload.meta).toBe(meta);
		expect(packet.payload.success).toBe(false);
		expect(packet.payload.data).toBeNull();
		expect(packet.payload.error).toBeDefined();
		expect(packet.payload.error.name).toBe("ValidationError");
		expect(packet.payload.error.message).toBe("Not valid params");
		expect(packet.payload.error.code).toBe(422);
		expect(packet.payload.error.type).toBe("ERR_INVALID_A_PARAM");
		expect(packet.payload.error.nodeID).toBe("node1");
		expect(packet.payload.error.data).toEqual({ a: "Too small" });
	});

});


describe("Test Transit.discoverNodes", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	transit.publish = jest.fn(() => Promise.resolve());

	it("should call publish with correct params", () => {
		transit.discoverNodes();
		expect(transit.publish).toHaveBeenCalledTimes(1);
		const packet = transit.publish.mock.calls[0][0];
		expect(packet).toBeInstanceOf(P.Packet);
		expect(packet.type).toBe(P.PACKET_DISCOVER);
		expect(packet.payload).toEqual({});
	});

});

describe("Test Transit.discoverNode", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	transit.publish = jest.fn(() => Promise.resolve());

	it("should call publish with correct params", () => {
		transit.discoverNode("node-2");
		expect(transit.publish).toHaveBeenCalledTimes(1);
		const packet = transit.publish.mock.calls[0][0];
		expect(packet).toBeInstanceOf(P.Packet);
		expect(packet.type).toBe(P.PACKET_DISCOVER);
		expect(packet.target).toBe("node-2");
		expect(packet.payload).toEqual({});
	});

});

describe("Test Transit.sendNodeInfo", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter(), internalServices: false });
	const transit = broker.transit;
	broker.getLocalNodeInfo = jest.fn(() => ({
		id: "node2",
		services: [],
		instanceID: "123456",
		metadata: {
			region: "eu-west1"
		}
	}));

	transit.tx.makeBalancedSubscriptions = jest.fn(() => Promise.resolve());
	transit.publish = jest.fn(() => Promise.resolve());

	it("should not call publish while not connected", () => {
		return transit.sendNodeInfo("node2").then(() => {
			expect(transit.publish).toHaveBeenCalledTimes(0);
			expect(broker.getLocalNodeInfo).toHaveBeenCalledTimes(0);
		});
	});

	it("should not call publish while not ready", () => {
		transit.connected = true;
		return transit.sendNodeInfo("node2").then(() => {
			expect(transit.publish).toHaveBeenCalledTimes(0);
			expect(broker.getLocalNodeInfo).toHaveBeenCalledTimes(0);
		});
	});

	it("should call publish with correct params if has nodeID", () => {
		transit.isReady = true;
		return transit.sendNodeInfo("node2").then(() => {
			expect(transit.tx.makeBalancedSubscriptions).toHaveBeenCalledTimes(0);
			expect(transit.publish).toHaveBeenCalledTimes(1);
			expect(broker.getLocalNodeInfo).toHaveBeenCalledTimes(1);
			const packet = transit.publish.mock.calls[0][0];
			expect(packet).toBeInstanceOf(P.Packet);
			expect(packet.type).toBe(P.PACKET_INFO);
			expect(packet.target).toBe("node2");
			expect(packet.payload.services).toEqual([]);
		});
	});

	it("should call publish with correct params if has no nodeID", () => {
		transit.publish.mockClear();
		broker.getLocalNodeInfo.mockClear();

		return transit.sendNodeInfo().then(() => {
			expect(transit.tx.makeBalancedSubscriptions).toHaveBeenCalledTimes(1);
			expect(transit.publish).toHaveBeenCalledTimes(1);
			expect(broker.getLocalNodeInfo).toHaveBeenCalledTimes(1);
			const packet = transit.publish.mock.calls[0][0];
			expect(packet).toBeInstanceOf(P.Packet);
			expect(packet.type).toBe(P.PACKET_INFO);
			expect(packet.target).toBe();
			expect(packet.payload).toEqual({
				"client": undefined,
				"config": undefined,
				"hostname": undefined,
				"instanceID": broker.instanceID,
				"ipList": undefined,
				"metadata": { "region": "eu-west1" },
				"seq": undefined,
				"services": []
			});
		});
	});

});

describe("Test Transit.sendPing", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node-1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	transit.publish = jest.fn(() => Promise.resolve());

	it("should call publish with correct params", () => {
		transit.sendPing("node-2");
		expect(transit.publish).toHaveBeenCalledTimes(1);
		const packet = transit.publish.mock.calls[0][0];
		expect(packet).toBeInstanceOf(P.Packet);
		expect(packet.type).toBe(P.PACKET_PING);
		expect(packet.target).toBe("node-2");
		expect(packet.payload).toEqual({ time: jasmine.any(Number), id: jasmine.any(String) });
	});

});

describe("Test Transit.sendPong", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node-1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	transit.publish = jest.fn(() => Promise.resolve());

	it("should call publish with correct params", () => {
		transit.sendPong({ sender: "node-2", time: 123456 });
		expect(transit.publish).toHaveBeenCalledTimes(1);
		const packet = transit.publish.mock.calls[0][0];
		expect(packet).toBeInstanceOf(P.Packet);
		expect(packet.type).toBe(P.PACKET_PONG);
		expect(packet.target).toBe("node-2");
		expect(packet.payload).toEqual({ time: 123456, arrived: jasmine.any(Number) });
	});

});

describe("Test Transit.processPong", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node-1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	broker.broadcastLocal = jest.fn();

	it("should call broadcastLocal with ping result", () => {
		let now = Date.now();
		transit.processPong({ sender: "node-2", arrived: now, time: now - 500 });

		expect(broker.broadcastLocal).toHaveBeenCalledTimes(1);
		expect(broker.broadcastLocal).toHaveBeenCalledWith("$node.pong", { "elapsedTime": jasmine.any(Number), "nodeID": "node-2", "timeDiff": jasmine.any(Number) });
	});

});

describe("Test Transit.sendHeartbeat", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;

	transit.publish = jest.fn(() => Promise.resolve());

	it("should call publish with correct params", () => {
		transit.sendHeartbeat({ cpu: 12 });
		expect(transit.publish).toHaveBeenCalledTimes(1);
		const packet = transit.publish.mock.calls[0][0];
		expect(packet).toBeInstanceOf(P.Packet);
		expect(packet.type).toBe(P.PACKET_HEARTBEAT);
		expect(packet.payload.cpu).toBe(12);
	});

});

describe("Test Transit.subscribe", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;
	const transporter = transit.tx;

	transporter.subscribe = jest.fn();

	it("should call transporter.subscribe", () => {
		transit.subscribe("REQ", "node-2");
		expect(transporter.subscribe).toHaveBeenCalledTimes(1);
		expect(transporter.subscribe).toHaveBeenCalledWith("REQ", "node-2");
	});

});

describe("Test Transit.publish", () => {

	const broker = new ServiceBroker({ logger: false, nodeID: "node1", transporter: new FakeTransporter() });
	const transit = broker.transit;
	const transporter = transit.tx;

	transporter.prepublish = jest.fn();
	broker.serializer.serialize = jest.fn(o => JSON.stringify(o));

	it("should call transporter.prepublish", () => {
		let packet = new P.Packet(P.PACKET_EVENT);
		transit.publish(packet);
		expect(transporter.prepublish).toHaveBeenCalledTimes(1);
		const p = transporter.prepublish.mock.calls[0][0];
		expect(p).toBe(packet);
	});

	it("should call transporter.prepublish after subscribing", () => {
		transporter.prepublish.mockClear();
		transit.stat.packets.sent = 0;
		let resolve;
		transit.subscribing = new Promise(r => resolve = r);

		let packet = new P.Packet(P.PACKET_EVENT);
		let p = transit.publish(packet);

		expect(transporter.prepublish).toHaveBeenCalledTimes(0);
		resolve();

		return p.catch(protectReject).then(() => {
			expect(transporter.prepublish).toHaveBeenCalledTimes(1);
			const p = transporter.prepublish.mock.calls[0][0];
			expect(p).toBe(packet);
		});
	});

});
