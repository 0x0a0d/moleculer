const ServiceBroker = require("../../src/service-broker");
const FakeTransporter = require("../../src/transporters/fake");
const Serializers = require("../../src/serializers");
const { ValidationError } = require("../../src/errors");
const P = require("../../src/packets");

describe("Test JSON serializer", () => {

	const broker = new ServiceBroker({
		nodeID: "test-1",
		transporter: new FakeTransporter(),
		serializer: new Serializers.JSON
	});

	it("should serialize the disconnect packet", () => {
		const packet = new P.PacketDisconnect(broker.transit);
		const s = packet.serialize();
		expect(s).toBe("{\"sender\":\"test-1\"}");

		const res = P.Packet.deserialize(broker.transit, P.PACKET_DISCONNECT, s);
		expect(res).toBeInstanceOf(P.PacketDisconnect);
	});		

	it("should serialize the heartbeat packet", () => {
		const packet = new P.PacketHeartbeat(broker.transit);
		const s = packet.serialize();
		expect(s).toBe("{\"sender\":\"test-1\"}");

		const res = P.Packet.deserialize(broker.transit, P.PACKET_HEARTBEAT, s);
		expect(res).toBeInstanceOf(P.PacketHeartbeat);
	});		

	it("should serialize the discover packet", () => {
		const actions = {
			"user.find": { cache: true },
			"user.create": {}
		};
		const packet = new P.PacketDiscover(broker.transit, actions);
		const s = packet.serialize();
		expect(s).toBe("{\"sender\":\"test-1\",\"actions\":\"{\\\"user.find\\\":{\\\"cache\\\":true},\\\"user.create\\\":{}}\"}");

		const res = P.Packet.deserialize(broker.transit, P.PACKET_DISCOVER, s);
		expect(res).toBeInstanceOf(P.PacketDiscover);
		expect(res.payload.actions).toEqual(actions);
	});		

	it("should serialize the info packet", () => {
		const actions = {
			"user.find": { cache: true },
			"user.create": {}
		};
		const packet = new P.PacketInfo(broker.transit, "test-2", actions);
		const s = packet.serialize();
		expect(s).toBe("{\"sender\":\"test-1\",\"actions\":\"{\\\"user.find\\\":{\\\"cache\\\":true},\\\"user.create\\\":{}}\"}");

		const res = P.Packet.deserialize(broker.transit, P.PACKET_INFO, s);
		expect(res).toBeInstanceOf(P.PacketInfo);
		expect(res.payload.actions).toEqual(actions);
	});		

	it("should serialize the event packet", () => {
		const data = {
			a: 5,
			b: "Test"
		};
		const packet = new P.PacketEvent(broker.transit, "user.created", data);
		const s = packet.serialize();
		expect(s).toBe("{\"sender\":\"test-1\",\"event\":\"user.created\",\"data\":\"{\\\"a\\\":5,\\\"b\\\":\\\"Test\\\"}\"}");

		const res = P.Packet.deserialize(broker.transit, P.PACKET_EVENT, s);
		expect(res).toBeInstanceOf(P.PacketEvent);
		expect(res.payload.data).toEqual(data);
	});		

	it("should serialize the request packet", () => {
		const params = {
			a: 5,
			b: "Test"
		};
		const packet = new P.PacketRequest(broker.transit, "test-2", "12345", "user.update", params);
		const s = packet.serialize();
		expect(s).toBe("{\"sender\":\"test-1\",\"requestID\":\"12345\",\"action\":\"user.update\",\"params\":\"{\\\"a\\\":5,\\\"b\\\":\\\"Test\\\"}\"}");

		const res = P.Packet.deserialize(broker.transit, P.PACKET_REQUEST, s);
		expect(res).toBeInstanceOf(P.PacketRequest);
		expect(res.payload.requestID).toBe("12345");
		expect(res.payload.action).toBe("user.update");
		expect(res.payload.params).toEqual(params);
	});		

	it("should serialize the response packet with data", () => {
		const data = [
			{ id: 1, name: "John" },
			{ id: 2, name: "Jane" }
		];
		const packet = new P.PacketResponse(broker.transit, "test-2", "12345", data);
		const s = packet.serialize();
		expect(s).toBe("{\"sender\":\"test-1\",\"requestID\":\"12345\",\"success\":true,\"data\":\"[{\\\"id\\\":1,\\\"name\\\":\\\"John\\\"},{\\\"id\\\":2,\\\"name\\\":\\\"Jane\\\"}]\"}");

		const res = P.Packet.deserialize(broker.transit, P.PACKET_RESPONSE, s);
		expect(res).toBeInstanceOf(P.PacketResponse);
		expect(res.payload.requestID).toBe("12345");
		expect(res.payload.data).toEqual(data);
	});		

	it("should serialize the response packet with error", () => {
		const err = new ValidationError("Invalid email!", { a: 5 });

		const packet = new P.PacketResponse(broker.transit, "test-2", "12345", null, err);
		const s = packet.serialize();
		expect(s).toBe("{\"sender\":\"test-1\",\"requestID\":\"12345\",\"success\":false,\"data\":null,\"error\":{\"name\":\"ValidationError\",\"message\":\"Invalid email!\",\"code\":422,\"data\":\"{\\\"a\\\":5}\"}}");

		const res = P.Packet.deserialize(broker.transit, P.PACKET_RESPONSE, s);
		expect(res).toBeInstanceOf(P.PacketResponse);
		expect(res.payload.requestID).toBe("12345");
		expect(res.payload.error).toEqual({
			name: "ValidationError",
			message: "Invalid email!",
			code: 422,
			data: {
				a: 5
			}
		});
	});		

});

describe("Test Avro serializer", () => {

	const broker = new ServiceBroker({
		nodeID: "test-1",
		transporter: new FakeTransporter(),
		serializer: new Serializers.Avro
	});

	it("should serialize the disconnect packet", () => {
		const packet = new P.PacketDisconnect(broker.transit);
		const s = packet.serialize();
		expect(s.length).toBe(7);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_DISCONNECT, s);
		expect(res).toBeInstanceOf(P.PacketDisconnect);
	});		

	it("should serialize the heartbeat packet", () => {
		const packet = new P.PacketHeartbeat(broker.transit);
		const s = packet.serialize();
		expect(s.length).toBe(7);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_HEARTBEAT, s);
		expect(res).toBeInstanceOf(P.PacketHeartbeat);
	});		

	it("should serialize the discover packet", () => {
		const actions = {
			"user.find": { cache: true },
			"user.create": {}
		};
		const packet = new P.PacketDiscover(broker.transit, actions);
		const s = packet.serialize();
		expect(s.length).toBe(53);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_DISCOVER, s);
		expect(res).toBeInstanceOf(P.PacketDiscover);
		expect(res.payload.actions).toEqual(actions);
	});		

	it("should serialize the info packet", () => {
		const actions = {
			"user.find": { cache: true },
			"user.create": {}
		};
		const packet = new P.PacketInfo(broker.transit, "test-2", actions);
		const s = packet.serialize();
		expect(s.length).toBe(53);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_INFO, s);
		expect(res).toBeInstanceOf(P.PacketInfo);
		expect(res.payload.actions).toEqual(actions);
	});		

	it("should serialize the event packet", () => {
		const data = {
			a: 5,
			b: "Test"
		};
		const packet = new P.PacketEvent(broker.transit, "user.created", data);
		const s = packet.serialize();
		expect(s.length).toBe(39);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_EVENT, s);
		expect(res).toBeInstanceOf(P.PacketEvent);
		expect(res.payload.data).toEqual(data);
	});		

	it("should serialize the request packet", () => {
		const params = {
			a: 5,
			b: "Test"
		};
		const packet = new P.PacketRequest(broker.transit, "test-2", "12345", "user.update", params);
		const s = packet.serialize();
		expect(s.length).toBe(44);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_REQUEST, s);
		expect(res).toBeInstanceOf(P.PacketRequest);
		expect(res.payload.requestID).toBe("12345");
		expect(res.payload.action).toBe("user.update");
		expect(res.payload.params).toEqual(params);
	});		

	it("should serialize the response packet with data", () => {
		const data = [
			{ id: 1, name: "John" },
			{ id: 2, name: "Jane" }
		];
		const packet = new P.PacketResponse(broker.transit, "test-2", "12345", data);
		const s = packet.serialize();
		expect(s.length).toBe(64);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_RESPONSE, s);
		expect(res).toBeInstanceOf(P.PacketResponse);
		expect(res.payload.requestID).toBe("12345");
		expect(res.payload.data).toEqual(data);
	});		

	it("should serialize the response packet with error", () => {
		const err = new ValidationError("Invalid email!", { a: 5 });

		const packet = new P.PacketResponse(broker.transit, "test-2", "12345", null, err);
		const s = packet.serialize(100);
		expect(s.length).toBe(57);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_RESPONSE, s);
		expect(res).toBeInstanceOf(P.PacketResponse);
		expect(res.payload.requestID).toBe("12345");
		expect(res.payload.error).toEqual({
			name: "ValidationError",
			message: "Invalid email!",
			code: 422,
			data: {
				a: 5
			}
		});
	});		

});


describe("Test MsgPack serializer", () => {

	const broker = new ServiceBroker({
		nodeID: "test-1",
		transporter: new FakeTransporter(),
		serializer: new Serializers.MsgPack
	});

	it("should serialize the disconnect packet", () => {
		const packet = new P.PacketDisconnect(broker.transit);
		const s = packet.serialize();
		expect(s).toBeInstanceOf(Buffer);
		expect(Buffer.byteLength(s, "binary")).toBe(15);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_DISCONNECT, s);
		expect(res).toBeInstanceOf(P.PacketDisconnect);
	});		

	it("should serialize the heartbeat packet", () => {
		const packet = new P.PacketHeartbeat(broker.transit);
		const s = packet.serialize();
		expect(Buffer.byteLength(s, "binary")).toBe(15);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_HEARTBEAT, s);
		expect(res).toBeInstanceOf(P.PacketHeartbeat);
	});		

	it("should serialize the discover packet", () => {
		const actions = {
			"user.find": { cache: true },
			"user.create": {}
		};
		const packet = new P.PacketDiscover(broker.transit, actions);
		const s = packet.serialize();
		expect(Buffer.byteLength(s, "binary")).toBe(70);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_DISCOVER, s);
		expect(res).toBeInstanceOf(P.PacketDiscover);
		expect(res.payload.actions).toEqual(actions);
	});		

	it("should serialize the info packet", () => {
		const actions = {
			"user.find": { cache: true },
			"user.create": {}
		};
		const packet = new P.PacketInfo(broker.transit, "test-2", actions);
		const s = packet.serialize();
		expect(Buffer.byteLength(s, "binary")).toBe(70);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_INFO, s);
		expect(res).toBeInstanceOf(P.PacketInfo);
		expect(res.payload.actions).toEqual(actions);
	});		

	it("should serialize the event packet", () => {
		const data = {
			a: 5,
			b: "Test"
		};
		const packet = new P.PacketEvent(broker.transit, "user.created", data);
		const s = packet.serialize();
		expect(Buffer.byteLength(s, "binary")).toBe(58);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_EVENT, s);
		expect(res).toBeInstanceOf(P.PacketEvent);
		expect(res.payload.data).toEqual(data);
	});		

	it("should serialize the request packet", () => {
		const params = {
			a: 5,
			b: "Test"
		};
		const packet = new P.PacketRequest(broker.transit, "test-2", "12345", "user.update", params);
		const s = packet.serialize();
		expect(Buffer.byteLength(s, "binary")).toBe(76);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_REQUEST, s);
		expect(res).toBeInstanceOf(P.PacketRequest);
		expect(res.payload.requestID).toBe("12345");
		expect(res.payload.action).toBe("user.update");
		expect(res.payload.params).toEqual(params);
	});		

	it("should serialize the response packet with data", () => {
		const data = [
			{ id: 1, name: "John" },
			{ id: 2, name: "Jane" }
		];
		const packet = new P.PacketResponse(broker.transit, "test-2", "12345", data);
		const s = packet.serialize();
		expect(Buffer.byteLength(s, "binary")).toBe(94);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_RESPONSE, s);
		expect(res).toBeInstanceOf(P.PacketResponse);
		expect(res.payload.requestID).toBe("12345");
		expect(res.payload.data).toEqual(data);
	});		

	it("should serialize the response packet with error", () => {
		const err = new ValidationError("Invalid email!", { a: 5 });

		const packet = new P.PacketResponse(broker.transit, "test-2", "12345", null, err);
		const s = packet.serialize();
		expect(Buffer.byteLength(s, "binary")).toBe(118);

		const res = P.Packet.deserialize(broker.transit, P.PACKET_RESPONSE, s);
		expect(res).toBeInstanceOf(P.PacketResponse);
		expect(res.payload.requestID).toBe("12345");
		expect(res.payload.error).toEqual({
			name: "ValidationError",
			message: "Invalid email!",
			code: 422,
			data: {
				a: 5
			}
		});
	});		

});