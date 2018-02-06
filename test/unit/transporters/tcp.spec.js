const ServiceBroker = require("../../../src/service-broker");
const Transit = require("../../../src/transit");
const P = require("../../../src/packets");
const E = require("../../../src/errors");
const { protectReject } = require("../utils");

// const lolex = require("lolex");
jest.mock("../../../src/transporters/tcp/tcp-reader");

let TcpReader = require("../../../src/transporters/tcp/tcp-reader");
TcpReader.mockImplementation(() => {
	return {
		listen: jest.fn()
	};
});

jest.mock("../../../src/transporters/tcp/tcp-writer");
let TcpWriter = require("../../../src/transporters/tcp/tcp-writer");
TcpWriter.mockImplementation(() => {
	let callbacks = {};
	return {
		on: jest.fn((name, cb) => {
			callbacks[name] = cb;
		}),
	__callbacks: callbacks
	};
});

jest.mock("../../../src/transporters/tcp/udp-broadcaster");
let UdpServer = require("../../../src/transporters/tcp/udp-broadcaster");
UdpServer.mockImplementation(() => {
	let callbacks = {};
	return {
		on: jest.fn((name, cb) => {
			callbacks[name] = cb;
		}),
		__callbacks: callbacks,
		bind: jest.fn()
	};
});

const TcpTransporter = require("../../../src/transporters/tcp");

describe("Test TcpTransporter constructor", () => {

	it("check constructor", () => {
		let transporter = new TcpTransporter();
		expect(transporter).toBeDefined();
		expect(transporter.opts).toEqual({
			udpDiscovery: true,
			udpReuseAddr: true,
			maxUdpDiscovery: 0,
			multicastHost: "230.0.0.0",
			multicastPort: 4445,
			multicastTTL: 1,
			multicastPeriod: 5,
			port: null,
			urls: null,
			useHostname: true,
			gossipPeriod: 2,
			maxConnections: 32,
			maxPacketSize: 1 * 1024 * 1024
		});
		expect(transporter.connected).toBe(false);
		expect(transporter.hasBuiltInBalancer).toBe(false);

		expect(transporter.reader).toBeNull();
		expect(transporter.writer).toBeNull();
		expect(transporter.udpServer).toBeNull();
		expect(transporter.gossipTimer).toBeNull();
	});

	// it("check constructor with string param", () => {
	// 	let transporter = new TcpTransporter("nats://localhost");
	// 	expect(transporter.opts).toEqual();
	// });

	it("check constructor with options", () => {
		let opts = { udpDiscovery: false, port: 5555 };
		let transporter = new TcpTransporter(opts);
		expect(transporter.opts).toEqual({
			udpDiscovery: false,
			udpReuseAddr: true,
			maxUdpDiscovery: 0,
			multicastHost: "230.0.0.0",
			multicastPort: 4445,
			multicastTTL: 1,
			multicastPeriod: 5,
			port: 5555,
			urls: null,
			useHostname: true,
			gossipPeriod: 2,
			maxConnections: 32,
			maxPacketSize: 1 * 1024 * 1024
		});
	});

});


describe("Test TcpTransporter init", () => {
	const broker = new ServiceBroker({ transporter: "fake" });
	const transporter = new TcpTransporter({});

	it("check init", () => {
		expect(broker.registry.nodes.disableHeartbeatChecks).toBe(false);
		transporter.init(broker.transit, jest.fn(), jest.fn());

		expect(broker.registry.nodes.disableHeartbeatChecks).toBe(true);
		expect(transporter.registry).toBe(broker.registry);
		expect(transporter.nodes).toBe(broker.registry.nodes);
	});

});


describe("Test TcpTransporter connect & disconnect & reconnect", () => {
	let broker = new ServiceBroker();
	let transit = new Transit(broker);
	let msgHandler = jest.fn();
	let transporter;

	beforeEach(() => {
		transporter = new TcpTransporter({ port: 1234 });
		transporter.init(transit, msgHandler);

		transporter.startTcpServer = jest.fn();
		transporter.startUdpServer = jest.fn();
		transporter.startTimers = jest.fn();
		transporter.stopTimers = jest.fn();
	});

	it("check connect", () => {
		transporter.onConnected = jest.fn(() => Promise.resolve());

		let p = transporter.connect().catch(protectReject).then(() => {
			expect(transporter.connected).toBe(true);
			expect(transporter.startTcpServer).toHaveBeenCalledTimes(1);
			expect(transporter.startUdpServer).toHaveBeenCalledTimes(1);
			expect(transporter.startTimers).toHaveBeenCalledTimes(1);

			expect(broker.registry.nodes.localNode.port).toBe(1234);

			expect(transporter.onConnected).toHaveBeenCalledTimes(1);
		});


		return p;
	});

	it("check disconnect", () => {
		transporter.reader = { close: jest.fn() };
		transporter.writer = { close: jest.fn() };
		transporter.udpServer = { close: jest.fn() };

		return transporter.connect().catch(protectReject).then(() => {
			transporter.disconnect();
			expect(transporter.connected).toBe(false);
			expect(transporter.stopTimers).toHaveBeenCalledTimes(1);
			expect(transporter.reader.close).toHaveBeenCalledTimes(1);
			expect(transporter.writer.close).toHaveBeenCalledTimes(1);
			expect(transporter.udpServer.close).toHaveBeenCalledTimes(1);
		});
	});

});

describe("Test TcpTransporter getLocalNodeInfo & getNodeInfo", () => {
	let broker = new ServiceBroker();
	let transit = new Transit(broker);
	let msgHandler = jest.fn();
	let transporter = new TcpTransporter({ port: 1234 });
	transporter.init(transit, msgHandler);

	it("should return nodes.localNode", () => {
		expect(transporter.getLocalNodeInfo()).toBe(transporter.nodes.localNode);
	});

	it("should return with selected node", () => {
		let node = {};
		transporter.nodes.get = jest.fn(() => node);
		expect(transporter.getNodeInfo("node-2")).toBe(node);
		expect(transporter.nodes.get).toHaveBeenCalledTimes(1);
		expect(transporter.nodes.get).toHaveBeenCalledWith("node-2");
	});

});


describe("Test TcpTransporter subscribe & publish", () => {
	let transporter;

	beforeEach(() => {
		transporter = new TcpTransporter();
		transporter.init(new Transit(new ServiceBroker({ namespace: "TEST", nodeID: "node-123" })));

		transporter.writer = {
			send: jest.fn(() => Promise.resolve())
		};

		transporter.startTcpServer = jest.fn();
		transporter.startUdpServer = jest.fn();
		transporter.startTimers = jest.fn();
		transporter.stopTimers = jest.fn();

		transporter.serialize = jest.fn(() => "json data");

		return transporter.connect();
	});


	it("should send packet with target", () => {

		const packet = new P.Packet(P.PACKET_EVENT, "node2", {});
		return transporter.publish(packet)
			.catch(protectReject).then(() => {
				expect(transporter.writer.send).toHaveBeenCalledTimes(1);
				expect(transporter.writer.send).toHaveBeenCalledWith(
					"node2",
					1,
					Buffer.from("json data")
				);

				expect(transporter.serialize).toHaveBeenCalledTimes(1);
				expect(transporter.serialize).toHaveBeenCalledWith(packet);
			});
	});

	it("should call disconnect if can't send packet", () => {
		transporter.serialize.mockClear();
		transporter.writer.send = jest.fn(() => Promise.reject());
		transporter.nodes.disconnected = jest.fn();

		const packet = new P.Packet(P.PACKET_EVENT, "node2", {});
		return transporter.publish(packet)
			.then(protectReject).catch(() => {
				expect(transporter.writer.send).toHaveBeenCalledTimes(1);
				expect(transporter.writer.send).toHaveBeenCalledWith(
					"node2",
					1,
					Buffer.from("json data")
				);

				expect(transporter.nodes.disconnected).toHaveBeenCalledTimes(1);
				expect(transporter.nodes.disconnected).toHaveBeenCalledWith("node2", true);
			});
	});

	it("should not send without target", () => {
		transporter.serialize.mockClear();
		transporter.writer.send.mockClear();

		const packet = new P.Packet(P.PACKET_EVENT, null, {});
		return transporter.publish(packet)
			.catch(protectReject).then(() => {
				expect(transporter.writer.send).toHaveBeenCalledTimes(0);
				expect(transporter.serialize).toHaveBeenCalledTimes(0);
			});
	});

	it("should not send declined packets", () => {
		transporter.serialize.mockClear();
		transporter.writer.send.mockClear();

		const packet = new P.Packet(P.PACKET_DISCOVER);
		return transporter.publish(packet)
			.catch(protectReject).then(() => {
				expect(transporter.writer.send).toHaveBeenCalledTimes(0);
				expect(transporter.serialize).toHaveBeenCalledTimes(0);
			});
	});

});

describe("Test TcpTransporter nodes functions", () => {
	let broker = new ServiceBroker({ namespace: "TEST", nodeID: "node-123" });
	let transit = new Transit(broker);
	let transporter;

	beforeEach(() => {
		transporter = new TcpTransporter();
		transporter.init(transit);

		transporter.startTcpServer = jest.fn();
		transporter.startUdpServer = jest.fn();
		transporter.startTimers = jest.fn();
		transporter.stopTimers = jest.fn();

		return transporter.connect();
	});

	it("should create an offline node", () => {
		expect(transporter.nodes.toArray().length).toBe(1);

		const node = transporter.addOfflineNode("node-123", "10.20.30.40", 12345);
		expect(node.id).toBe("node-123");
		expect(node.local).toBe(false);
		expect(node.hostname).toBe("10.20.30.40");
		expect(node.ipList).toEqual(["10.20.30.40"]);
		expect(node.port).toBe(12345);
		expect(node.available).toBe(false);
		expect(node.when).toBe(0);
		expect(node.offlineSince).toBeDefined();

		expect(transporter.getNode("node-123")).toBe(node);
	});

	it("check getNodeAddress method", () => {
		const node = transporter.addOfflineNode("node-123", "10.20.30.40", 12345);
		node.udpAddress = "udp-address";
		node.hostname = "server-host";

		expect(transporter.getNodeAddress(node)).toBe("udp-address");

		node.udpAddress = null;
		expect(transporter.getNodeAddress(node)).toBe("server-host");

		transporter.opts.useHostname = false;
		expect(transporter.getNodeAddress(node)).toBe("10.20.30.40");

		transporter.opts.useHostname = true;
		node.hostname = null;
		expect(transporter.getNodeAddress(node)).toBe("10.20.30.40");

		node.ipList = [];
		expect(transporter.getNodeAddress(node)).toBeNull();
	});
});


describe("Test TcpTransporter startTcpServer", () => {
	let broker = new ServiceBroker({ namespace: "TEST", nodeID: "node-123" });
	let transit = new Transit(broker);
	let transporter;

	beforeEach(() => {
		transporter = new TcpTransporter();
		transporter.init(transit);
	});

	it("check startTcpServer", () => {
		transporter.startTcpServer();

		expect(TcpWriter).toHaveBeenCalledTimes(1);
		expect(TcpWriter).toHaveBeenCalledWith(transporter, transporter.opts);

		expect(TcpReader).toHaveBeenCalledTimes(1);
		expect(TcpReader).toHaveBeenCalledWith(transporter, transporter.opts);

		expect(transporter.writer.on).toHaveBeenCalledTimes(1);
		expect(transporter.writer.on).toHaveBeenCalledWith("error", jasmine.any(Function));

		expect(transporter.reader.listen).toHaveBeenCalledTimes(1);
		expect(transporter.reader.listen).toHaveBeenCalledWith();
	});

	it("check writer error handler", () => {
		transporter.startTcpServer();
		transporter.nodes.disconnected = jest.fn();

		transporter.writer.__callbacks.error(null, "node-2");

		expect(transporter.nodes.disconnected).toHaveBeenCalledTimes(1);
		expect(transporter.nodes.disconnected).toHaveBeenCalledWith("node-2", false);
	});

});

describe("Test TcpTransporter startUdpServer", () => {
	let broker = new ServiceBroker({ namespace: "TEST", nodeID: "node-123" });
	let transit = new Transit(broker);
	let transporter;

	beforeEach(() => {
		transporter = new TcpTransporter();
		transporter.init(transit);
	});

	it("check startUdpServer", () => {
		transporter.startUdpServer();

		expect(UdpServer).toHaveBeenCalledTimes(1);
		expect(UdpServer).toHaveBeenCalledWith(transporter, transporter.opts);

		expect(transporter.udpServer.on).toHaveBeenCalledTimes(1);
		expect(transporter.udpServer.on).toHaveBeenCalledWith("message", jasmine.any(Function));

		expect(transporter.udpServer.bind).toHaveBeenCalledTimes(1);
		expect(transporter.udpServer.bind).toHaveBeenCalledWith();
	});

	it("check UDP server message handler if new node", () => {
		transporter.startUdpServer();
		transporter.nodes.get = jest.fn(() => null);
		const node = {};
		transporter.addOfflineNode = jest.fn(() => node);

		transporter.udpServer.__callbacks.message("node-2", "10.20.30.40", 12345);

		expect(node.udpAddress).toBe("10.20.30.40");

		expect(transporter.nodes.get).toHaveBeenCalledTimes(1);
		expect(transporter.nodes.get).toHaveBeenCalledWith("node-2");

		expect(transporter.addOfflineNode).toHaveBeenCalledTimes(1);
		expect(transporter.addOfflineNode).toHaveBeenCalledWith("node-2", "10.20.30.40", 12345);
	});

	it("check UDP server message handler if offline node", () => {
		transporter.startUdpServer();

		const node = { ipList: [], available: false };
		transporter.nodes.get = jest.fn(() => node);
		transporter.addOfflineNode = jest.fn(() => node);

		transporter.udpServer.__callbacks.message("node-2", "10.20.30.40", 12345);

		expect(node.hostname).toBe("10.20.30.40");
		expect(node.ipList).toEqual(["10.20.30.40"]);
		expect(node.port).toBe(12345);
		expect(node.udpAddress).toBe("10.20.30.40");

		expect(transporter.nodes.get).toHaveBeenCalledTimes(1);
		expect(transporter.nodes.get).toHaveBeenCalledWith("node-2");

		expect(transporter.addOfflineNode).toHaveBeenCalledTimes(0);
	});

	it("check UDP server message handler if available node", () => {
		transporter.startUdpServer();

		const node = { ipList: [], available: true, hostname: "old", port: 1000 };
		transporter.nodes.get = jest.fn(() => node);
		transporter.addOfflineNode = jest.fn(() => node);

		transporter.udpServer.__callbacks.message("node-2", "10.20.30.40", 12345);

		expect(node.hostname).toBe("old");
		expect(node.ipList).toEqual([]);
		expect(node.port).toBe(1000);
		expect(node.udpAddress).toBe("10.20.30.40");

		expect(transporter.nodes.get).toHaveBeenCalledTimes(1);
		expect(transporter.nodes.get).toHaveBeenCalledWith("node-2");

		expect(transporter.addOfflineNode).toHaveBeenCalledTimes(0);
	});

});

describe("Test TcpTransporter startUdpServer", () => {
	let broker = new ServiceBroker({ namespace: "TEST", nodeID: "node-123" });
	let transit = new Transit(broker);
	let transporter;

	beforeEach(() => {
		transporter = new TcpTransporter();
		transporter.init(transit);
	});

	it("check startTimers", () => {
		expect(transporter.gossipTimer).toBeNull();
		transporter.startTimers();
		expect(transporter.gossipTimer).toBeDefined();
	});

	it("check startTimers", () => {
		transporter.startTimers();
		expect(transporter.gossipTimer).toBeDefined();
		transporter.stopTimers();
		expect(transporter.gossipTimer).toBeNull();
	});

});

describe("Test Gossip methods", () => {
	let broker = new ServiceBroker({ namespace: "TEST", nodeID: "node-1" });
	let transit = new Transit(broker);
	let transporter;

	beforeEach(() => {
		transporter = new TcpTransporter();
		transporter.init(transit);
	});

	describe("Test onIncomingMessage", () => {

		it("should call processGossipHello", () => {
			const msg = {};
			transporter.processGossipHello = jest.fn();

			transporter.onIncomingMessage(P.PACKET_GOSSIP_HELLO, msg);

			expect(transporter.processGossipHello).toHaveBeenCalledTimes(1);
			expect(transporter.processGossipHello).toHaveBeenCalledWith(msg);
		});

		it("should call processGossipRequest", () => {
			const msg = {};
			transporter.processGossipRequest = jest.fn();

			transporter.onIncomingMessage(P.PACKET_GOSSIP_REQ, msg);

			expect(transporter.processGossipRequest).toHaveBeenCalledTimes(1);
			expect(transporter.processGossipRequest).toHaveBeenCalledWith(msg);
		});

		it("should call processGossipResponse", () => {
			const msg = {};
			transporter.processGossipResponse = jest.fn();

			transporter.onIncomingMessage(P.PACKET_GOSSIP_RES, msg);

			expect(transporter.processGossipResponse).toHaveBeenCalledTimes(1);
			expect(transporter.processGossipResponse).toHaveBeenCalledWith(msg);
		});

		it("should call incomingMessage", () => {
			const msg = {};
			transporter.incomingMessage = jest.fn();

			transporter.onIncomingMessage(P.PACKET_REQUEST, msg);
			expect(transporter.incomingMessage).toHaveBeenCalledTimes(1);
			expect(transporter.incomingMessage).toHaveBeenCalledWith(P.PACKET_REQUEST, msg);

			transporter.onIncomingMessage(P.PACKET_EVENT, msg);
			expect(transporter.incomingMessage).toHaveBeenCalledTimes(2);
			expect(transporter.incomingMessage).toHaveBeenCalledWith(P.PACKET_EVENT, msg);
		});

	});

	describe("Test sendHello", () => {

		it("should throw error if nodeID is unknown", () => {
			transporter.getNode = jest.fn();

			return transporter.sendHello("node-xy").then(protectReject).catch(err => {
				expect(err).toBeInstanceOf(E.MoleculerServerError);
				expect(err.message).toBe("Missing node info for 'node-xy'");
			});
		});

		it("should publish a HELLO packet", () => {
			transporter.getNode = jest.fn(() => ({
				id: "node-2"
			}));
			transporter.publish = jest.fn();
			transporter.getNodeAddress = jest.fn(() => "node-1-host");

			transporter.sendHello("node-2");

			expect(transporter.publish).toHaveBeenCalledTimes(1);
			expect(transporter.publish).toHaveBeenCalledWith({
				type: "GOSSIP_HELLO",
				target: "node-2",
				payload: {
					host: "node-1-host",
					port: null
				}
			});
		});

	});

	describe("Test processGossipHello", () => {

		it("should create as offline node", () => {
			transporter.addOfflineNode = jest.fn();
			transporter.nodes.get = jest.fn();
			transporter.deserialize = jest.fn(() => ({
				payload: {
					sender: "node-2",
					host: "node-2-host",
					port: 5555
				}
			}));

			transporter.processGossipHello("message");

			expect(transporter.deserialize).toHaveBeenCalledTimes(1);
			expect(transporter.deserialize).toHaveBeenCalledWith(P.PACKET_GOSSIP_REQ, "message");

			expect(transporter.nodes.get).toHaveBeenCalledTimes(1);
			expect(transporter.nodes.get).toHaveBeenCalledWith("node-2");

			expect(transporter.addOfflineNode).toHaveBeenCalledTimes(1);
			expect(transporter.addOfflineNode).toHaveBeenCalledWith("node-2", "node-2-host", 5555);
		});

		it("should not create as offline node if already exists", () => {
			transporter.addOfflineNode = jest.fn();
			transporter.nodes.get = jest.fn(() => ({}));
			transporter.deserialize = jest.fn(() => ({
				payload: {
					sender: "node-2",
					host: "node-2-host",
					port: 5555
				}
			}));

			transporter.processGossipHello("message");

			expect(transporter.nodes.get).toHaveBeenCalledTimes(1);
			expect(transporter.nodes.get).toHaveBeenCalledWith("node-2");

			expect(transporter.addOfflineNode).toHaveBeenCalledTimes(0);
		});

	});

	describe("Test sendGossipRequest", () => {
		const nodes = [
			{ id: "node-1", when: 1000, cpu: 10, cpuWhen: 1010, local: true },
			{ id: "node-2", when: 2000, cpu: 20, cpuWhen: 2020 },
			{ id: "node-3", when: 3000, cpu: 30, cpuWhen: 3030 },
			{ id: "node-4", when: 4000, offlineSince: 4040 },
			{ id: "node-5", when: 5000, offlineSince: 5050 },
		];
		beforeEach(() => {
			transporter.sendGossipToRandomEndpoint = jest.fn();
			transporter.nodes.toArray = jest.fn(() => nodes);
		});

		it("should not call sendGossipToRandomEndpoint if no remote node", () => {
			transporter.nodes.toArray = jest.fn(() => [nodes[0]]);
			transporter.sendGossipRequest();

			expect(transporter.sendGossipToRandomEndpoint).toHaveBeenCalledTimes(0);
		});

		it("should sendGossipToRandomEndpoint a GOSSIP_REQ packet to online node", () => {
			Math.random = jest.fn(() => 100);
			transporter.sendGossipRequest();

			expect(transporter.sendGossipToRandomEndpoint).toHaveBeenCalledTimes(1);
			expect(transporter.sendGossipToRandomEndpoint).toHaveBeenCalledWith({
				online: {
					"node-1": [1000, 1010, 10],
					"node-2": [2000, 2020, 20],
					"node-3": [3000, 3030, 30]
				},
				offline: {
					"node-4": [4000, 4040],
					"node-5": [5000, 5050]
				}
			}, [nodes[1], nodes[2]]);
		});

		it("should sendGossipToRandomEndpoint a GOSSIP_REQ packet to offline node", () => {
			Math.random = jest.fn(() => 0);
			transporter.sendGossipRequest();

			expect(transporter.sendGossipToRandomEndpoint).toHaveBeenCalledTimes(2);
			expect(transporter.sendGossipToRandomEndpoint).toHaveBeenCalledWith({
				online: {
					"node-1": [1000, 1010, 10],
					"node-2": [2000, 2020, 20],
					"node-3": [3000, 3030, 30]
				},
				offline: {
					"node-4": [4000, 4040],
					"node-5": [5000, 5050]
				}
			}, [nodes[1], nodes[2]]);
			expect(transporter.sendGossipToRandomEndpoint).toHaveBeenCalledWith({
				online: {
					"node-1": [1000, 1010, 10],
					"node-2": [2000, 2020, 20],
					"node-3": [3000, 3030, 30]
				},
				offline: {
					"node-4": [4000, 4040],
					"node-5": [5000, 5050]
				}
			}, [nodes[3], nodes[4]]);
		});

	});
});
