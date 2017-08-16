/*
 * moleculer
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer)
 * MIT Licensed
 */

"use strict";

const BaseSerializer = require("./base");
const P = require("../packets");

/**
 * Protocol Buffer Serializer for Moleculer
 * 
 * https://github.com/google/protobuf
 * 
 * @class ProtoBufSerializer
 */
class ProtoBufSerializer extends BaseSerializer {

	/**
	 * Initialize Serializer
	 * 
	 * @param {any} broker
	 * 
	 * @memberOf Serializer
	 */
	init(broker) {
		super.init(broker);

		try {
			require("protobufjs/minimal");
		} catch(err) {
			/* istanbul ignore next */
			this.broker.fatal("The 'protobufjs' package is missing! Please install it with 'npm install protobufjs --save' command!", err, true);
		}

		this.packets = require("./proto/packets.proto.js").packets;
	}

	getPacketFromType(type) {
		switch(type) {
			case P.PACKET_EVENT: return this.packets.PacketEvent;
			case P.PACKET_REQUEST: return this.packets.PacketRequest;
			case P.PACKET_RESPONSE: return this.packets.PacketResponse;
			case P.PACKET_DISCOVER: return this.packets.PacketDiscover;
			case P.PACKET_INFO: return this.packets.PacketInfo;
			case P.PACKET_DISCONNECT: return this.packets.PacketDisconnect;
			case P.PACKET_HEARTBEAT: return this.packets.PacketHeartbeat;
		}
	}

	/**
	 * Serializer a JS object to Buffer
	 * 
	 * @param {Object} obj
	 * @param {String} type of packet
	 * @returns {Buffer}
	 * 
	 * @memberOf Serializer
	 */
	serialize(obj, type) {
		const p = this.getPacketFromType(type);
		if (!p) {
			/* istanbul ignore next */
			throw new Error("Invalid packet type!");
		}

		const buf = p.encode(obj).finish();
		return buf;
	}

	/**
	 * Deserialize Buffer to JS object
	 * 
	 * @param {Buffer} buf
	 * @param {String} type of packet
	 * @returns {Object}
	 * 
	 * @memberOf Serializer
	 */
	deserialize(buf, type) {
		const p = this.getPacketFromType(type);
		if (!p) {
			/* istanbul ignore next */
			throw new Error("Invalid packet type!");
		}

		return p.decode(buf);
	}
}

module.exports = ProtoBufSerializer;