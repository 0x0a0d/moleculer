/*
 * moleculer
 * Copyright (c) 2017 Icebob (https://github.com/icebob/moleculer)
 * MIT Licensed
 */

"use strict";

let _ = require("lodash");

class BalancedList {

	/**
	 * Creates an instance of BalancedList.
	 * 
	 * @param {any} opts
	 * 		opts.model - type of balancing (round-robin, random) (defaults: round-robin)
	 * 		opts.preferLocal - call a local service if available (defaults: true)
	 * 
	 * @memberOf BalancedList
	 */
	constructor(opts) {
		this.opts = opts || {
			preferLocale: true
		};
		this.list = [];
		this.counter = 0;
	}

	add(data, weight = 0, nodeID) {
		if (nodeID != null) {
			let found = _.find(this.list, { nodeID });
			if (found) {
				found.data = data;
				return false;
			}
		}
		this.list.push({
			data,
			weight,
			local: nodeID == null,
			nodeID
		});
		
		return true;
	}

	get() {
		if (this.list.length == 0) {
			return null;
		}

		if (this.counter >= this.list.length) {
			this.counter = 0;
		}

		let item;
		if (this.opts.preferLocale) {
			item = this.getLocalItem();
			if (item) {
				return item;
			}
		}
		// TODO: implement load-balance modes

		item = this.list[this.counter++];
		return item;
	}

	getData() {
		const item = this.get();
		return item ? item.data : null;
	}

	count() {
		return this.list.length;
	}

	getLocalItem() {
		return _.find(this.list, { local: true });
	}

	hasLocal() {
		return this.getLocalItem() != null;
	}

	remove(data) {
		_.remove(this.list, (el) => el.data == data);
	}

	removeByNode(nodeID) {
		_.remove(this.list, item => item.nodeID == nodeID);
	}
}

module.exports = BalancedList;