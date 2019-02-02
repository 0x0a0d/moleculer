/*
 * moleculer
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer)
 * MIT Licensed
 */

"use strict";

const { METRIC }	= require("../metrics");

module.exports = function MetricsMiddleware() {
	let broker, metrics;

	function getActionHandler(type, next) {
		return function metricsMiddleware(ctx) {
			const action = ctx.action.name;
			// TODO: serviceFullName
			metrics.increment(METRIC.MOLECULER_REQUEST_TOTAL, { action, type });
			metrics.increment(METRIC.MOLECULER_REQUEST_ACTIVE, { action, type });
			metrics.increment(METRIC.MOLECULER_REQUEST_LEVELS, { action, level: ctx.level });
			const timeEnd = metrics.timer(METRIC.MOLECULER_REQUEST_TIME, { action });

			// Call the next handler
			return next(ctx).then(res => {
				timeEnd();
				metrics.decrement(METRIC.MOLECULER_REQUEST_ACTIVE, { action, type });
				return res;
			}).catch(err => {
				timeEnd();
				metrics.decrement(METRIC.MOLECULER_REQUEST_ACTIVE, { action, type });
				metrics.increment(METRIC.MOLECULER_REQUEST_ERROR_TOTAL, {
					action,
					errorName: err ? err.name : null,
					errorCode: err ? err.code : null,
					errorType: err ? err.type : null
				});
				throw err;
			});

		};
	}

	return {
		created(_broker) {
			broker = _broker;
			metrics = broker.metrics;
			if (broker.isMetricsEnabled()) {

				// --- MOLECULER REQUEST METRICS ---
				metrics.register({ name: METRIC.MOLECULER_REQUEST_TOTAL, type: METRIC.TYPE_COUNTER, labelNames: ["action", "type"] });
				metrics.register({ name: METRIC.MOLECULER_REQUEST_ACTIVE, type: METRIC.TYPE_GAUGE, labelNames: ["action", "type"] });
				metrics.register({ name: METRIC.MOLECULER_REQUEST_ERROR_TOTAL, type: METRIC.TYPE_COUNTER, labelNames: ["action", "errorName", "errorCode", "errorType"] });
				metrics.register({ name: METRIC.MOLECULER_REQUEST_TIME, type: METRIC.TYPE_HISTOGRAM, labelNames: ["action"], quantiles: true, unit: METRIC.UNIT_MILLISECONDS });
				metrics.register({ name: METRIC.MOLECULER_REQUEST_LEVELS, type: METRIC.TYPE_COUNTER, labelNames: ["level"] });
				//metrics.register({ name: METRIC.MOLECULER_REQUEST_OPRHAN_TOTAL, type: METRIC.TYPE_COUNTER, labelNames: ["action"] });
				//metrics.register({ name: METRIC.MOLECULER_REQUEST_DIRECTCALL_TOTAL, type: METRIC.TYPE_COUNTER, labelNames: ["action"] });
				//metrics.register({ name: METRIC.MOLECULER_REQUEST_MULTICALL_TOTAL, type: METRIC.TYPE_COUNTER });

				// --- MOLECULER EVENTS METRICS ---
				metrics.register({ name: METRIC.MOLECULER_EVENT_EMIT_TOTAL, type: METRIC.TYPE_COUNTER, labelNames: ["event", "groups"] });
				metrics.register({ name: METRIC.MOLECULER_EVENT_BROADCAST_TOTAL, type: METRIC.TYPE_COUNTER, labelNames: ["event", "groups"] });
				metrics.register({ name: METRIC.MOLECULER_EVENT_BROADCASTLOCAL_TOTAL, type: METRIC.TYPE_COUNTER, labelNames: ["event", "groups"] });
				metrics.register({ name: METRIC.MOLECULER_EVENT_RECEIVED_TOTAL, type: METRIC.TYPE_COUNTER, labelNames: ["event"] });

				// --- MOLECULER TRANSIT METRICS ---

				metrics.register({ name: METRIC.MOLECULER_TRANSIT_PUBLISH_TOTAL, type: METRIC.TYPE_COUNTER, labelNames: ["type"] });
				metrics.register({ name: METRIC.MOLECULER_TRANSIT_RECEIVE_TOTAL, type: METRIC.TYPE_COUNTER, labelNames: ["type"] });

				metrics.register({ name: METRIC.MOLECULER_TRANSIT_REQUESTS_ACTIVE, type: METRIC.TYPE_GAUGE });
				metrics.register({ name: METRIC.MOLECULER_TRANSIT_STREAMS_SEND_ACTIVE, type: METRIC.TYPE_GAUGE });
				//metrics.register({ name: METRIC.MOLECULER_TRANSIT_STREAMS_RECEIVE_ACTIVE, type: METRIC.TYPE_GAUGE });

				// --- MOLECULER TRANSPORTER METRICS ---

				metrics.register({ name: METRIC.MOLECULER_TRANSPORTER_PACKETS_SENT_TOTAL, type: METRIC.TYPE_COUNTER });
				metrics.register({ name: METRIC.MOLECULER_TRANSPORTER_PACKETS_SENT_BYTES, type: METRIC.TYPE_COUNTER, unit: METRIC.UNIT_BYTE });
				metrics.register({ name: METRIC.MOLECULER_TRANSPORTER_PACKETS_RECEIVED_TOTAL, type: METRIC.TYPE_COUNTER });
				metrics.register({ name: METRIC.MOLECULER_TRANSPORTER_PACKETS_RECEIVED_BYTES, type: METRIC.TYPE_COUNTER, unit: METRIC.UNIT_BYTE });

				// --- MOLECULER CIRCUIT BREAKER METRICS ---

				metrics.register({ name: METRIC.MOLECULER_CIRCUIT_BREAKER_OPENED_ACTIVE, type: METRIC.TYPE_GAUGE, labelNames: ["nodeID", "action"] });
				metrics.register({ name: METRIC.MOLECULER_CIRCUIT_BREAKER_OPENED_TOTAL, type: METRIC.TYPE_COUNTER, labelNames: ["nodeID", "action"] });
				metrics.register({ name: METRIC.MOLECULER_CIRCUIT_BREAKER_HALF_OPENED_ACTIVE, type: METRIC.TYPE_GAUGE, labelNames: ["nodeID", "action"] });

				broker.localBus.on("$circuit-breaker.opened", function(payload) {
					metrics.set(METRIC.MOLECULER_CIRCUIT_BREAKER_OPENED_ACTIVE, 1, payload);
					metrics.increment(METRIC.MOLECULER_CIRCUIT_BREAKER_OPENED_TOTAL, payload);
				});

				broker.localBus.on("$circuit-breaker.half-opened", function(payload) {
					metrics.set(METRIC.MOLECULER_CIRCUIT_BREAKER_OPENED_ACTIVE, 0, payload);
					metrics.set(METRIC.MOLECULER_CIRCUIT_BREAKER_HALF_OPENED_ACTIVE, 1, payload);
				});

				broker.localBus.on("$circuit-breaker.closed", function(payload) {
					metrics.set(METRIC.MOLECULER_CIRCUIT_BREAKER_OPENED_ACTIVE, 0, payload);
					metrics.set(METRIC.MOLECULER_CIRCUIT_BREAKER_HALF_OPENED_ACTIVE, 0, payload);
				});
			}
		},

		localAction(next) {
			if (this.isMetricsEnabled())
				return getActionHandler("local", next);

			return next;
		},

		remoteAction(next) {
			if (this.isMetricsEnabled())
				return getActionHandler("remote", next);

			return next;
		},

		// Wrap local event handlers
		localEvent(next, event) {
			if (this.isMetricsEnabled()) {
				return function metricsMiddleware(/* payload, sender, event */) {
					metrics.increment(METRIC.MOLECULER_EVENT_RECEIVED_TOTAL, { event: arguments[2] });
					return next.apply(this, arguments);
				}.bind(this);
			}

			return next;
		},

		// Wrap broker.emit method
		emit(next) {
			if (this.isMetricsEnabled()) {
				return function metricsMiddleware(/* event, payload */) {
					metrics.increment(METRIC.MOLECULER_EVENT_EMIT_TOTAL, { event: arguments[0] });
					return next.apply(this, arguments);
				};
			}
			return next;
		},

		// Wrap broker.broadcast method
		broadcast(next) {
			if (this.isMetricsEnabled()) {
				return function metricsMiddleware(/* event, payload */) {
					metrics.increment(METRIC.MOLECULER_EVENT_BROADCAST_TOTAL, { event: arguments[0] });
					return next.apply(this, arguments);
				};
			}
			return next;
		},

		// Wrap broker.broadcastLocal method
		broadcastLocal(next) {
			if (this.isMetricsEnabled()) {
				return function metricsMiddleware(/* event, payload */) {
					metrics.increment(METRIC.MOLECULER_EVENT_BROADCASTLOCAL_TOTAL, { event: arguments[0] });
					return next.apply(this, arguments);
				};
			}
			return next;
		},

		// When transit publishing a packet
		transitPublish(next) {
			const transit = this;
			if (this.broker.isMetricsEnabled()) {
				return function metricsMiddleware(/* packet */) {
					metrics.increment(METRIC.MOLECULER_TRANSIT_PUBLISH_TOTAL, { type: arguments[0].type });

					const p = next.apply(this, arguments);

					metrics.increment(METRIC.MOLECULER_TRANSIT_REQUESTS_ACTIVE, null, transit.pendingRequests.size);
					//metrics.increment(METRIC.MOLECULER_TRANSIT_STREAMS_RECEIVE_ACTIVE, null, transit.);
					metrics.increment(METRIC.MOLECULER_TRANSIT_STREAMS_SEND_ACTIVE, null, transit.pendingReqStreams.size + this.pendingResStreams.size);

					return p;
				};
			}
			return next;
		},

		// When transit receives & handles a packet
		transitMessageHandler(next) {
			if (this.broker.isMetricsEnabled()) {
				return function metricsMiddleware(/* cmd, packet */) {
					metrics.increment(METRIC.MOLECULER_TRANSIT_RECEIVE_TOTAL, { type: arguments[0] });
					return next.apply(this, arguments);
				};
			}
			return next;
		},

		// When transporter send data
		transporterSend(next) {
			if (this.broker.isMetricsEnabled()) {
				return function metricsMiddleware(/* topic, data, meta */) {
					const data = arguments[1];
					metrics.increment(METRIC.MOLECULER_TRANSPORTER_PACKETS_SENT_TOTAL);
					metrics.increment(METRIC.MOLECULER_TRANSPORTER_PACKETS_SENT_BYTES, null, data && data.length ? data.length : 0);
					return next.apply(this, arguments);
				};
			}
			return next;
		},

		// When transporter received data
		transporterReceive(next) {
			if (this.broker.isMetricsEnabled()) {
				return function metricsMiddleware(/* cmd, data, s */) {
					const data = arguments[1];
					metrics.increment(METRIC.MOLECULER_TRANSPORTER_PACKETS_RECEIVED_TOTAL);
					metrics.increment(METRIC.MOLECULER_TRANSPORTER_PACKETS_RECEIVED_BYTES, null, data && data.length ? data.length : 0);
					return next.apply(this, arguments);
				};
			}
			return next;
		}

	};
};
