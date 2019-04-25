"use strict";

const _ 					= require("lodash");
const Promise 				= require("bluebird");
const BaseTraceExporter 	= require("./base");

/*
	docker run -d --name dd-agent -v /var/run/docker.sock:/var/run/docker.sock:ro -v /proc/:/host/proc/:ro -v /sys/fs/cgroup/:/host/sys/fs/cgroup:ro -e DD_API_KEY=123456 -e DD_APM_ENABLED=true -e DD_APM_NON_LOCAL_TRAFFIC=true -p 8126:8126  datadog/agent:latest
*/

let DatadogSpanContext;
let DatadogPlatform;

/**
 * Datadog Trace Exporter with 'dd-trace'.
 *
 * @class DatadogTraceExporter
 */
class DatadogTraceExporter extends BaseTraceExporter {

	/**
	 * Creates an instance of DatadogTraceExporter.
	 * @param {Object?} opts
	 * @memberof DatadogTraceExporter
	 */
	constructor(opts) {
		super(opts);

		this.opts = _.defaultsDeep(this.opts, {
			agentUrl: process.env.DD_AGENT_URL || "http://localhost:8126",
			env: process.env.DD_ENVIRONMENT || null,
			samplingPriority: "AUTO_KEEP",
			defaultTags: null,
			tracerOptions: null,
		});

		this.ddTracer = null;

		this.store = new Map();
	}

	/**
	 * Initialize Trace Exporter.
	 *
	 * @param {Tracer} tracer
	 * @memberof DatadogTraceExporter
	 */
	init(tracer) {
		super.init(tracer);

		try {
			const ddTrace = require("dd-trace");
			DatadogSpanContext = require("dd-trace/src/opentracing/span_context");
			DatadogPlatform = require("dd-trace/src/platform");
			this.ddTracer = global.tracer || ddTrace.init(_.defaultsDeep(this.opts.tracerOptions, {
				url: this.opts.agentUrl
			}));
		} catch(err) {
			/* istanbul ignore next */
			this.tracer.broker.fatal("The 'dd-trace' package is missing! Please install it with 'npm install dd-trace --save' command!", err, true);
		}

		this.defaultTags = _.isFunction(this.opts.defaultTags) ? this.opts.defaultTags.call(this, tracer) : this.opts.defaultTags;
		if (this.defaultTags) {
			this.defaultTags = this.flattenTags(this.defaultTags, true);
		}

		this.tracer.contextWrappers.push(this.wrapContext.bind(this));

		this.tracer.getCurrentTraceID = () => {
			const scope = this.ddTracer.scope();
			if (scope) {
				const span = scope.active();
				if (span) {
					const spanContext = span.context();
					if (spanContext)
						return spanContext.toTraceId();
				}
			}
			return null;
		};

		this.tracer.getParentSpanID = () => {
			const scope = this.ddTracer.scope();
			if (scope) {
				const span = scope.active();
				if (span) {
					const spanContext = span.context();
					if (spanContext)
						return spanContext.toSpanId();
				}
			}
			return null;
		};
	}

	wrapContext(span, fn) {
		if (span.$ddSpan) {
			const scope = this.ddTracer.scope();
			if (scope) {
				scope.activate(span.$ddSpan, () => {
					return fn();
				});
			}
		}
	}

	/**
	 * Span is started.
	 *
	 * @param {Span} span
	 * @memberof BaseTraceExporter
	 */
	startSpan(span) {
		if (!this.ddTracer) return null;

		const serviceName = span.service ? span.service.fullName : null;

		let parentCtx;
		if (span.parentID) {
			parentCtx = new DatadogSpanContext({
				traceId: this.convertID(span.traceID),
				spanId: this.convertID(span.parentID),
				parentId: this.convertID(span.parentID)
			});
		/*} else {
			const scope = this.ddTracer.scope();
			if (scope) {
				const activeSpan = scope.active();
				if (activeSpan) {
					parentCtx = activeSpan.context();
					span.traceID = parentCtx.toTraceId();
					span.parentID = parentCtx.toSpanId();
				}
			}*/
		}

		const ddSpan = this.ddTracer.startSpan(span.name, {
			startTime: span.startTime,
			childOf: parentCtx,
			tags: this.flattenTags(_.defaultsDeep({}, span.tags, {
				service: span.service,
				span: {
					kind: "server",
					type: "custom",
				},
				resource: span.tags.action,
				"sampling.priority": this.opts.samplingPriority
			}, this.defaultTags))
		});

		if (this.opts.env)
			this.addTags(ddSpan, "env", this.opts.env);
		this.addTags(ddSpan, "service", serviceName);

		const sc = ddSpan.context();
		sc._traceId = this.convertID(span.traceID);
		sc._spanId = this.convertID(span.id);

		Object.defineProperty(span, "$ddSpan", {
			value: ddSpan
		});

		const scope = this.ddTracer.scope();
		scope.activate(ddSpan, () => {

			let resolver;
			const p = new Promise(r => {
				resolver = r;
			});
			this.store.set(span.id, { span: ddSpan, resolver });

			scope.bind(p);
		});

		return ddSpan;
	}

	/**
	 * Span is finished.
	 *
	 * @param {Span} span
	 * @memberof DatadogTraceExporter
	 */
	finishSpan(span) {
		if (!this.ddTracer) return null;

		const item = this.store.get(span.id);
		if (!item) return null;

		const ddSpan = item.span;

		if (span.error) {
			this.addTags(ddSpan, "error", this.errorToObject(span.error));
		}

		ddSpan.finish(span.endTime);

		item.resolver();

		return ddSpan;
	}

	/**
	 * Generate tracing data for Datadog
	 *
	 * @param {Span} span
	 * @memberof DatadogTraceExporter
	 */
	generateDatadogTraceSpan(span) {
		if (!this.ddTracer) return null;

		const serviceName = span.service ? span.service.fullName : null;

		let parentCtx;
		if (span.parentID) {
			parentCtx = new DatadogSpanContext({
				traceId: this.convertID(span.traceID),
				spanId: this.convertID(span.parentID),
				parentId: this.convertID(span.parentID)
			});
		/*} else {
			const scope = this.ddTracer.scope();
			if (scope) {
				const activeSpan = scope.active();
				if (activeSpan) {
					parentCtx = activeSpan.context();
				}
			}*/
		}

		const ddSpan = this.ddTracer.startSpan(span.name, {
			startTime: span.startTime,
			childOf: parentCtx,
			tags: this.flattenTags(_.defaultsDeep({}, span.tags, {
				service: span.service,
				span: {
					kind: "server",
					type: "custom",
				},
				resource: span.tags.action,
				"sampling.priority": this.opts.samplingPriority
			}, this.defaultTags))
		});

		if (this.opts.env)
			this.addTags(ddSpan, "env", this.opts.env);
		this.addTags(ddSpan, "service", serviceName);

		if (span.error) {
			this.addTags(ddSpan, "error", this.errorToObject(span.error));
		}

		const sc = ddSpan.context();
		sc._traceId = this.convertID(span.traceID);
		sc._spanId = this.convertID(span.id);

		ddSpan.finish(span.endTime);

		return ddSpan;
	}


	/**
	 * Add tags to span
	 *
	 * @param {Object} span
	 * @param {String} key
	 * @param {any} value
	 * @param {String?} prefix
	 */
	addTags(span, key, value, prefix) {
		const name = prefix ? `${prefix}.${key}` : key;
		if (value != null && typeof value == "object") {
			Object.keys(value).forEach(k => this.addTags(span, k, value[k], name));
		} else {
			span.setTag(name, value);
		}
	}

	/**
	 * Convert Trace/Span ID to Jaeger format
	 *
	 * @param {String} id
	 * @returns {String}
	 */
	convertID(id) {
		if (id) {
			if (id.indexOf("-") !== -1)
				return new DatadogPlatform.Uint64BE(Buffer.from(id.replace(/-/g, "").substring(0, 16), "hex"));
			return new DatadogPlatform.Uint64BE(id);
		}

		return null;
	}
}

module.exports = DatadogTraceExporter;
