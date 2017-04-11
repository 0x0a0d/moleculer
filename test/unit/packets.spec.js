const ServiceBroker = require("../../src/service-broker");
const Transit = require("../../src/transit");
const FakeTransporter = require("../../src/transporters/fake");
const { ValidationError } = require("../../src/errors");

const P = require("../../src/packets");

describe("Test base Packet", () => {

	const transit = {
		nodeID: "node-1",
		serialize: jest.fn(),
		deserialize: jest.fn(msg => JSON.parse(msg))
	};

	it("create Packet without type", () => {
		let packet = new P.Packet(transit);
		expect(packet).toBeDefined();
		expect(packet.transit).toBe(transit);
		expect(packet.type).toBe(P.PACKET_UNKNOW);
		expect(packet.target).toBeUndefined();
		expect(packet.payload).toBeDefined();
		expect(packet.payload.sender).toBe("node-1");
	});

	it("create Packet with type & target", () => {
		let packet = new P.Packet(transit, P.PACKET_EVENT, "node-2");
		expect(packet).toBeDefined();
		expect(packet.transit).toBe(transit);
		expect(packet.type).toBe(P.PACKET_EVENT);
		expect(packet.target).toBe("node-2");
		expect(packet.payload).toBeDefined();
		expect(packet.payload.sender).toBe("node-1");
	});

	it("should call transit.serialize", () => {
		transit.serialize.mockClear();

		let packet = new P.Packet(transit, P.PACKET_EVENT, "node-2");
		packet.serialize();
		expect(transit.serialize).toHaveBeenCalledTimes(1);
		expect(transit.serialize).toHaveBeenCalledWith(packet.payload, P.PACKET_EVENT);
	});

	it("should set payload", () => {
		let packet = new P.Packet(transit, P.PACKET_EVENT, "node-2");
		let obj = { a: 5 };
		packet.transformPayload(obj);
		expect(packet.payload).toBe(obj);
	});

	it("should return a Packet instance", () => {
		transit.deserialize.mockClear();

		let packet = P.Packet.deserialize(transit, P.PACKET_HEARTBEAT, '{"a": 5}');
		expect(packet).toBeInstanceOf(P.PacketHeartbeat);
		expect(packet.payload).toEqual({ a: 5 });
		expect(transit.deserialize).toHaveBeenCalledTimes(1);
		expect(transit.deserialize).toHaveBeenCalledWith('{"a": 5}', P.PACKET_HEARTBEAT);
	});

});

describe("Test PacketDisconnect", () => {

	const transit = { nodeID: "node-1" };

	it("should set properties", () => {
		let packet = new P.PacketDisconnect(transit);
		expect(packet).toBeDefined();
		expect(packet.type).toBe(P.PACKET_DISCONNECT);
		expect(packet.target).toBeUndefined();
		expect(packet.payload).toBeDefined();
		expect(packet.payload.sender).toBe("node-1");
	});

});

describe("Test PacketHeartbeat", () => {

	const transit = { nodeID: "node-1" };

	it("should set properties", () => {
		let packet = new P.PacketHeartbeat(transit);
		expect(packet).toBeDefined();
		expect(packet.type).toBe(P.PACKET_HEARTBEAT);
		expect(packet.target).toBeUndefined();
		expect(packet.payload).toBeDefined();
		expect(packet.payload.sender).toBe("node-1");
	});

});

describe("Test PacketDiscover", () => {

	const transit = { nodeID: "node-1" };

	it("should set properties", () => {
		let actions = { "posts.find": {} };
		let packet = new P.PacketDiscover(transit, actions);
		expect(packet).toBeDefined();
		expect(packet.type).toBe(P.PACKET_DISCOVER);
		expect(packet.target).toBeUndefined();
		expect(packet.payload).toBeDefined();
		expect(packet.payload.sender).toBe("node-1");
		expect(packet.payload.actions).toBe("{\"posts.find\":{}}");
	});

	it("should transform payload", () => {
		let payload = {
			actions: "{\"posts.find\":{}}"
		};
		let packet = new P.PacketDiscover(transit, {});
		packet.transformPayload(payload);

		expect(packet.payload.actions).toEqual({ "posts.find": {} });
	});

});

describe("Test PacketInfo", () => {

	const transit = { nodeID: "node-1" };

	it("should set properties", () => {
		let actions = { "posts.find": {} };
		let packet = new P.PacketInfo(transit, "node-2", actions);
		expect(packet).toBeDefined();
		expect(packet.type).toBe(P.PACKET_INFO);
		expect(packet.target).toBe("node-2");
		expect(packet.payload).toBeDefined();
		expect(packet.payload.sender).toBe("node-1");
		expect(packet.payload.actions).toBe("{\"posts.find\":{}}");
	});

	it("should transform payload", () => {
		let payload = {
			actions: "{\"posts.find\":{}}"
		};
		let packet = new P.PacketInfo(transit, "server-2", {});
		packet.transformPayload(payload);

		expect(packet.payload.actions).toEqual({ "posts.find": {} });
	});
});

describe("Test PacketEvent", () => {

	const transit = { nodeID: "node-1" };

	it("should set properties", () => {
		let data = { id: 5 };
		let packet = new P.PacketEvent(transit, "user.created", data);
		expect(packet).toBeDefined();
		expect(packet.type).toBe(P.PACKET_EVENT);
		expect(packet.target).toBeUndefined();
		expect(packet.payload).toBeDefined();
		expect(packet.payload.sender).toBe("node-1");
		expect(packet.payload.event).toBe("user.created");
		expect(packet.payload.data).toBe("{\"id\":5}");
	});

	it("should transform payload", () => {
		let payload = {
			data: "{\"a\":5}"
		};
		let packet = new P.PacketEvent(transit, "user.created", {});
		packet.transformPayload(payload);

		expect(packet.payload.data).toEqual({ a: 5 });
	});
});

describe("Test PacketRequest", () => {

	const transit = { nodeID: "node-1" };

	it("should set properties", () => {
		let params = { id: 5 };
		let packet = new P.PacketRequest(transit, "server-2", "12345", "posts.find", params);
		expect(packet).toBeDefined();
		expect(packet.type).toBe(P.PACKET_REQUEST);
		expect(packet.target).toBe("server-2");
		expect(packet.payload).toBeDefined();
		expect(packet.payload.sender).toBe("node-1");
		expect(packet.payload.id).toBe("12345");
		expect(packet.payload.action).toBe("posts.find");
		expect(packet.payload.params).toBe("{\"id\":5}");
	});

	it("should transform payload", () => {
		let payload = {
			params: "{\"a\":5}"
		};
		let packet = new P.PacketRequest(transit, "server-2", "12345", "", {});
		packet.transformPayload(payload);

		expect(packet.payload.params).toEqual({ a: 5 });
	});

});

describe("Test PacketResponse", () => {

	const transit = { nodeID: "node-1" };

	it("should set properties without error", () => {
		let data = { id: 5 };
		let packet = new P.PacketResponse(transit, "server-2", "12345", data);
		expect(packet).toBeDefined();
		expect(packet.type).toBe(P.PACKET_RESPONSE);
		expect(packet.target).toBe("server-2");
		expect(packet.payload).toBeDefined();
		expect(packet.payload.sender).toBe("node-1");
		expect(packet.payload.id).toBe("12345");
		expect(packet.payload.success).toBe(true);
		expect(packet.payload.data).toBe("{\"id\":5}");
		expect(packet.payload.error).toBeUndefined();
	});

	it("should set properties with error", () => {
		let err = new ValidationError("Validation error", { a: 5 });
		let packet = new P.PacketResponse(transit, "server-2", "12345", null, err);
		expect(packet).toBeDefined();
		expect(packet.type).toBe(P.PACKET_RESPONSE);
		expect(packet.target).toBe("server-2");
		expect(packet.payload).toBeDefined();
		expect(packet.payload.sender).toBe("node-1");
		expect(packet.payload.id).toBe("12345");
		expect(packet.payload.success).toBe(false);
		expect(packet.payload.data).toBeNull();
		expect(packet.payload.error).toBeDefined();
		expect(packet.payload.error.name).toBe("ValidationError");
		expect(packet.payload.error.message).toBe("Validation error");
		expect(packet.payload.error.code).toBe(422);
		expect(packet.payload.error.nodeID).toBe("node-1");
		expect(packet.payload.error.data).toBe("{\"a\":5}");
	});

	it("should transform payload without error", () => {
		let payload = {
			data: "{\"a\":5}"
		};
		let packet = new P.PacketResponse(transit, "server-2", "12345", {});
		packet.transformPayload(payload);

		expect(packet.payload.data).toEqual({ a: 5 });
		expect(packet.payload.error).toBeUndefined();		
	});

	it("should transform payload with error", () => {
		let payload = {
			data: null,
			error: {
				name: "CustomError",
				message: "Something happened",
				code: 500,
				nodeID: "far-far-node",
				data: "{\"a\":5}"
			}
		};
		let packet = new P.PacketResponse(transit, "server-2", "12345", {});
		packet.transformPayload(payload);

		expect(packet.payload.data).toBeNull();
		expect(packet.payload.error).toBeDefined();
		expect(packet.payload.error.name).toBe("CustomError");
		expect(packet.payload.error.message).toBe("Something happened");
		expect(packet.payload.error.code).toBe(500);
		expect(packet.payload.error.nodeID).toBe("far-far-node");
		expect(packet.payload.error.data).toEqual({ a: 5 });	
	});

});