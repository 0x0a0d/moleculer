/*
 * moleculer
 * Copyright (c) 2018 Ice Services (https://github.com/ice-services/moleculer)
 * MIT Licensed
 */

"use strict";

const cpuUsage 	= require("../cpu-usage");

/**
 * Node class
 *
 * @class Node
 */
class Node {
	/**
	 * Creates an instance of Node.
	 *
	 * @param {String} id
	 *
	 * @memberof Node
	 */
	constructor(id) {
		this.id = id;
		this.available = true;
		this.local = false;
		this.lastHeartbeatTime = Date.now();
		this.config = {};
		this.client = {};

		this.ipList = null;
		this.port = null;
		this.hostname = null;
		this.rawInfo = null;
		this.services = [];

		this.cpu = null;
		this.cpuWhen = null;

		this.when = null;
		this.offlineSince = null;
	}

	/**
	 * Update properties
	 *
	 * @param {any} payload
	 * @memberof Node
	 */
	update(payload) {
		// Update properties
		this.ipList = payload.ipList;
		this.hostname = payload.hostname;
		this.port = payload.port;
		this.client = payload.client || {};

		// Process services & events
		this.services = payload.services;
		this.rawInfo = payload;

		const newWhen = payload.when || Date.now();
		if (newWhen > this.when) {
			this.when = newWhen;
			return true;
		}
	}

	/**
	 * Update local properties
	 *
	 * @memberof Node
	 */
	updateLocalInfo() {
		return cpuUsage().then(res => {
			this.cpu = Math.round(res.avg);
			this.cpuWhen = Date.now();
		});
	}

	/**
	 * Update heartbeat properties
	 *
	 * @param {any} payload
	 * @memberof Node
	 */
	heartbeat(payload) {
		if (!this.available) {
			this.available = true;
			this.offlineSince = null;
			this.when = Date.now();
		}

		this.cpu = payload.cpu;
		this.cpuWhen = payload.cpuWhen || Date.now();

		this.lastHeartbeatTime = Date.now();
	}

	/**
	 * Node disconnected
	 *
	 * @memberof Node
	 */
	disconnected() {
		if (this.available)
			this.offlineSince = Date.now();

		this.when = Date.now();

		this.available = false;
	}
}

module.exports = Node;
