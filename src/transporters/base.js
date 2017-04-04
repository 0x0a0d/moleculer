/*
 * moleculer
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer)
 * MIT Licensed
 */

"use strict";

// Prefix for logger
const LOG_PREFIX = "TX";

/**
 * Base Transporter class
 * 
 * @class BaseTransporter
 */
class BaseTransporter {

	/**
	 * Creates an instance of BaseTransporter.
	 * 
	 * @param {any} opts
	 * 
	 * @memberOf BaseTransporter
	 */
	constructor(opts) {
		this.opts = opts || {};
		this.connected = false;

		this.prefix = "MOL";
		
		if (this.opts.prefix) {
			this.prefix = this.opts.prefix;
		}
	}

	/**
	 * Init transporter
	 * 
	 * @param {any} broker
	 * 
	 * @memberOf BaseTransporter
	 */
	init(broker, messageHandler) {
		this.broker = broker;
		this.nodeID = broker.nodeID;
		this.logger = broker.getLogger(LOG_PREFIX);
		this.messageHandler = messageHandler;
	}

	/**
	 * Connect to the transporter server
	 * 
	 * @memberOf BaseTransporter
	 */
	connect() {
		/* istanbul ignore next */
		throw new Error("Not implemented!");
	}

	/**
	 * Disconnect from the transporter server
	 * 
	 * @memberOf BaseTransporter
	 */
	disconnect() {
		/* istanbul ignore next */
		throw new Error("Not implemented!");
	}

	/**
	 * Subscribe to event
	 * 
	 * @param {String} topic 
	 * 
	 * @memberOf BaseTransporter
	 */
	subscribe(topic) {
		/* istanbul ignore next */
		throw new Error("Not implemented!");
	}

	/**
	 * Publish an event
	 * 
	 * @param {Packet} packet
	 * 
	 * @memberOf BaseTransporter
	 */
	publish(packet) {
		/* istanbul ignore next */
		throw new Error("Not implemented!");
	}

}

module.exports = BaseTransporter;