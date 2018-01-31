/*
 * moleculer
 * Copyright (c) 2018 Ice Services (https://github.com/ice-services/moleculer)
 * MIT Licensed
 */

"use strict";

const P 			= require("../../packets");

module.exports = {

	PACKET_EVENT_ID: 1,
	PACKET_REQUEST_ID: 2,
	PACKET_RESPONSE_ID: 3,
	PACKET_PING_ID: 4,
	PACKET_PONG_ID: 5,
	PACKET_GOSSIP_REQ_ID: 6,
	PACKET_GOSSIP_RSP_ID: 7,

	IGNORABLE_ERRORS: [
		"ECONNREFUSED",
		"ECONNRESET",
		"ETIMEDOUT",
		"EHOSTUNREACH",
		"ENETUNREACH",
		"ENETDOWN",
		"EPIPE",
		"ENOENT"
	],

	resolvePacketID(type) {
		switch (type) {
			case P.PACKET_EVENT:
				return module.exports.PACKET_EVENT_ID;
			case P.PACKET_REQUEST:
				return module.exports.PACKET_REQUEST_ID;
			case P.PACKET_RESPONSE:
				return module.exports.PACKET_RESPONSE_ID;
			case P.PACKET_PING:
				return module.exports.PACKET_PING_ID;
			case P.PACKET_PONG:
				return module.exports.PACKET_PONG_ID;
			default:
				throw new Error("Unsupported packet type (" + type + ")!");
		}
	},

	resolvePacketType(id) {
		switch (id) {
			case module.exports.PACKET_EVENT_ID:
				return P.PACKET_EVENT;
			case module.exports.PACKET_REQUEST_ID:
				return P.PACKET_REQUEST;
			case module.exports.PACKET_RESPONSE_ID:
				return P.PACKET_RESPONSE;
			case module.exports.PACKET_PING_ID:
				return P.PACKET_PING;
			case module.exports.PACKET_PONG_ID:
				return P.PACKET_PONG;
			default:
				throw new Error("Unsupported packet ID (" + id + ")!");
		}
	}
};
