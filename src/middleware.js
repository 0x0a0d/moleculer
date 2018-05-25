/*
 * moleculer
 * Copyright (c) 2018 MoleculerJS (https://github.com/moleculerjs/moleculer)
 * MIT Licensed
 */

"use strict";

const _ = require("lodash");

class MiddlewareHandler {

	constructor(broker) {
		this.broker = broker;

		this.list = [];
	}

	add(mw) {
		if (!mw) return;

		if (_.isFunction(mw)) {
			// Backward compatibility
			mw = {
				localAction: mw
			};
		}

		this.list.push(mw);
	}

	/**
	 * Wrap local action handler
	 *
	 * @param {Action} action
	 * @param {Function} handler
	 * @returns {Function}
	 * @memberof MiddlewareHandler
	 */
	wrapLocalAction(action, handler) {
		return this.wrapActionHandler("localAction", action, handler);
	}

	/**
	 * Wrap remote action handler
	 *
	 * @param {Action} action
	 * @param {Function} handler
	 * @returns {Function}
	 * @memberof MiddlewareHandler
	 */
	wrapRemoteAction(action, handler) {
		return this.wrapActionHandler("remoteAction", action, handler);
	}

	/**
	 * Wrap an action handler
	 *
	 * @param {string} method
	 * @param {ActionDef} action
	 * @param {Function} handler
	 * @returns {Function}
	 * @memberof MiddlewareHandler
	 */
	wrapActionHandler(method, action, handler) {
		if (this.list.length) {
			let mws = Array.from(this.list);
			handler = mws.reduce((handler, mw) => {
				if (_.isFunction(mw[method]))
					return mw[method].call(this.broker, handler, action);
				else
					return handler;
			}, handler);
		}

		return handler;
	}

	/**
	 * Get count of registered middlewares
	 *
	 * @returns {Number}
	 * @memberof MiddlewareHandler
	 */
	count() {
		return this.list.length;
	}
}

module.exports = MiddlewareHandler;

/*
{
    // After broker is created
    created(broker) {

    },

    // Wrap local action calls (legacy middleware handler)
    localAction(handler, action) {

    },

    // Wrap remote action calls
    remoteAction(handler, action) {

    },

    // When event is emitted
    emit(eventName, payload) {

    },

    // When broadcast event is emitted
    broadcast(eventName, payload, groups) {

    },

    // When local broadcast event is emitted
    broadcastLocal(eventName, payload, groups) {

    },

    // Before broker starting
    beforeBrokerStart(broker) {

    },

    // After broker started
    afterBrokerStart(broker) {

    },

    // Before broker stopping
    beforeBrokerStop(broker) {

    },

    // After broker stopped
    afterBrokerStop(broker) {

    },

}

*/
