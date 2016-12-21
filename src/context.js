"use strict";

let _ = require("lodash");
let chalk = require("chalk");

let utils = require("./utils");

class Context {

	constructor(opts) {
		opts = Object.assign({}, opts || {});
	
		this.opts = opts;
		this.id = opts.id || utils.generateToken();
		this.parent = opts.parent;
		this.service = opts.service;
		this.action = opts.action;
		this.broker = opts.service && opts.service.broker;
		if (this.broker)
			this.logger = this.broker.getLogger("CTX");

		this.level = opts.parent && opts.parent.level ? opts.parent.level + 1 : 1;
		this.params = Object.freeze(Object.assign({}, opts.params || {}));

		this.startTime = Date.now();
		this.stopTime = null;
		this.duration = 0;
	}

	createSubContext(service, action, params) {
		return new Context({
			id: this.id,
			parent: this,
			service: service || this.service,
			action: action || this.action,
			params: params
		});
	}

	setParams(newParams) {
		this.params = Object.freeze(Object.assign({}, newParams));
	}

	emit(eventName, data) {
		return this.broker.emit(eventName, data);
	}

	closeContext() {
		this.stopTime = Date.now();
		this.duration = this.stopTime - this.startTime;
		if (this.parent) {
			this.parent.duration += this.duration;
		}
	}

	result(data) {
		return Promise.resolve(data)
			.then((res) => {
				this.closeContext();
				//this.logger.debug(chalk.green(`Context for '${this.action.name}': [${this.duration}ms] result:`), this.params);

				return res;
			});
	}

	error(err) {
		this.closeContext();
		//this.logger.error(chalk.red.bold(`[${this.duration}ms] error:`), err);
		return Promise.reject(err);
	}

	call(actionName, params) {
		return this.broker.call(actionName, params, this);
	}	
}

module.exports = Context;