/*
 * moleculer
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer)
 * MIT Licensed
 */

"use strict";

const Promise = require("bluebird");
const EventEmitter2 = require("eventemitter2").EventEmitter2;
const Transit = require("./transit");
const BalancedList = require("./balanced-list");
const E = require("./errors");
const utils = require("./utils");
const Logger = require("./logger");
const Validator = require("./validator");
const BrokerStatistics = require("./statistics");
const healthInfo = require("./health");

const JSONSerializer = require("./serializers/json");

//const _ = require("lodash");
const _ = require("lodash");
const pick = require("lodash/pick");
const omit = require("lodash/omit");
const isArray = require("lodash/isArray");

const glob = require("glob");
const path = require("path");


/**
 * Service broker class
 * 
 * @class ServiceBroker
 */
class ServiceBroker {

	/**
	 * Creates an instance of ServiceBroker.
	 * 
	 * @param {any} options
	 * 
	 * @memberOf ServiceBroker
	 */
	constructor(options) {
		this.options = _.defaultsDeep(options, {
			nodeID: null,

			logger: null,
			logLevel: "info",

			transporter: null,
			requestTimeout: 0 * 1000,
			requestRetry: 0,
			heartbeatInterval: 10,
			heartbeatTimeout: 30,

			cacher: null,
			serializer: null,

			validation: true,
			metrics: false,
			metricsRate: 1,
			metricsSendInterval: 5 * 1000,
			statistics: false,
			internalActions: true
			
			// ServiceFactory: null,
			// ContextFactory: null
		});

		// Promise constructor
		this.Promise = Promise;

		// Class factories
		this.ServiceFactory = this.options.ServiceFactory || require("./service");
		this.ContextFactory = this.options.ContextFactory || require("./context");

		// Self nodeID
		this.nodeID = this.options.nodeID || utils.getNodeID();

		// Logger
		this._loggerCache = {};
		this.logger = this.getLogger("BROKER");

		// Local event bus
		this.bus = new EventEmitter2({
			wildcard: true,
			maxListeners: 100
		});

		// Internal maps
		this.nodes = new Map();
		this.services = [];
		this.actions = new Map();

		// Middlewares
		this.middlewares = [];

		// Cacher
		this.cacher = this.options.cacher;
		if (this.cacher) {
			this.cacher.init(this);
		}

		// Serializer
		this.serializer = this.options.serializer;
		if (!this.serializer)
			this.serializer = new JSONSerializer();
		this.serializer.init(this);

		// Validation
		if (this.options.validation !== false) {
			this.validator = new Validator();
			if (this.validator) {
				this.validator.init(this);
			}
		}

		// Transit
		if (this.options.transporter) {
			this.transit = new Transit(this, this.options.transporter);
		}

		// Counter for metricsRate
		this.sampleCount = 0;

		if (this.options.statistics)
			this.statistics = new BrokerStatistics(this);

		this.getNodeHealthInfo = healthInfo;

		// Register internal actions
		if (this.options.internalActions)
			this.registerInternalActions();

		// Graceful exit
		this._closeFn = () => {
			/* istanbul ignore next */
			this.stop();
		};

		process.setMaxListeners(0);
		process.on("beforeExit", this._closeFn);
		process.on("exit", this._closeFn);
		process.on("SIGINT", this._closeFn);
	}

	/**
	 * Start broker. If set transport, transport.connect will be called.
	 * 
	 * @memberOf ServiceBroker
	 */
	start() {
		// Call service `started` handlers
		this.services.forEach(service => {
			if (service && service.schema && _.isFunction(service.schema.started)) {
				service.schema.started.call(service);
			}
		});

		if (this.options.metrics && this.options.metricsSendInterval > 0) {
			this.metricsTimer = setInterval(() => {
				// Send event with node health info
				this.getNodeHealthInfo().then(data => this.emit("metrics.node.health", data));

				// Send event with node statistics
				if (this.statistics)
					this.emit("metrics.node.stats", this.statistics.snapshot());
			}, this.options.metricsSendInterval);
			this.metricsTimer.unref();
		}

		this.logger.info("Broker started.");

		if (this.transit) {
			return this.transit.connect().then(() => {
				
				// Start timers
				this.heartBeatTimer = setInterval(() => {
					/* istanbul ignore next */
					this.transit.sendHeartbeat();
				}, this.options.heartbeatInterval * 1000);
				this.heartBeatTimer.unref();

				this.checkNodesTimer = setInterval(() => {
					/* istanbul ignore next */
					this.checkRemoteNodes();
				}, this.options.heartbeatTimeout * 1000);
				this.checkNodesTimer.unref();			
			});
		}
		else
			return Promise.resolve();
	}

	/**
	 * Stop broker. If set transport, transport.disconnect will be called.
	 * 
	 * 
	 * @memberOf ServiceBroker
	 */
	stop() {
		// Call service `started` handlers
		this.services.forEach(service => {
			if (service && service.schema && _.isFunction(service.schema.stopped)) {
				service.schema.stopped.call(service);
			}
		});

		if (this.metricsTimer) {
			clearInterval(this.metricsTimer);
			this.metricsTimer = null;
		}
		
		if (this.transit) {
			this.transit.disconnect();

			if (this.heartBeatTimer) {
				clearInterval(this.heartBeatTimer);
				this.heartBeatTimer = null;
			}

			if (this.checkNodesTimer) {
				clearInterval(this.checkNodesTimer);
				this.checkNodesTimer = null;
			}
		}

		this.logger.info("Broker stopped.");

		process.removeListener("beforeExit", this._closeFn);
		process.removeListener("exit", this._closeFn);
		process.removeListener("SIGINT", this._closeFn);
	}

	/**
	 * Get a custom logger for sub-modules (service, transporter, cacher, context...etc)
	 * 
	 * @param {String} name	name of module
	 * @returns
	 * 
	 * @memberOf ServiceBroker
	 */
	getLogger(name) {
		let logger = this._loggerCache[name];
		if (logger)
			return logger;

		logger = Logger.wrap(this.options.logger, name, this.options.logLevel);
		this._loggerCache[name] = logger;

		return logger;
	}

	/**
	 * Load services from a folder
	 * 
	 * @param {string} [folder="./services"]		Folder of services
	 * @param {string} [fileMask="*.service.js"]	Service filename mask
	 * @returns	{Number}							Number of found services
	 * 
	 * @memberOf ServiceBroker
	 */
	loadServices(folder = "./services", fileMask = "*.service.js") {
		this.logger.info(`Search services in '${folder}/${fileMask}'...`); 
		
		let serviceFiles;

		if (isArray(fileMask))
			serviceFiles = fileMask.map(f => path.join(folder, f));
		else
			serviceFiles = glob.sync(path.join(folder, fileMask));

		if (serviceFiles) {
			serviceFiles.forEach(servicePath => {
				this.loadService(servicePath);
			});
		}	
		return serviceFiles.length;	
	}

	/**
	 * Load a service from file
	 * 
	 * @param {string} 		Path of service
	 * @returns	{Service}	Loaded service
	 * 
	 * @memberOf ServiceBroker
	 */
	loadService(filePath) {
		let fName = path.resolve(filePath);
		this.logger.debug(`Load service from '${path.basename(fName)}'...`);
		let schema = require(fName);
		if (_.isFunction(schema)) {
			let svc = schema(this);
			if (svc instanceof this.ServiceFactory)
				return svc;
			else
				return this.createService(svc);

		} else {
			return this.createService(schema);
		}
	}

	/**
	 * Create a new service by schema
	 * 
	 * @param {any} schema	Schema of service
	 * @returns {Service}
	 * 
	 * @memberOf ServiceBroker
	 */
	createService(schema) {
		let service = new this.ServiceFactory(this, schema);
		return service;
	}

	/**
	 * Register a local service
	 * 
	 * @param {any} service
	 * 
	 * @memberOf ServiceBroker
	 */
	registerService(service) {
		// Append service
		this.services.push(service);
		this.emitLocal(`register.service.${service.name}`, service);
		this.logger.info(`'${service.name}' service is registered!`);
	}

	/**
	 * Register an action in a local server
	 * 
	 * @param {any} action		action schema
	 * @param {any} nodeID		NodeID if it is on a remote server/node
	 * 
	 * @memberOf ServiceBroker
	 */
	registerAction(action, nodeID) {

		// Wrap middlewares
		if (!nodeID)
			this.wrapAction(action);
		
		// Append action by name
		let item = this.actions.get(action.name);
		if (!item) {
			item = new BalancedList();
			this.actions.set(action.name, item);
		}
		if (item.add(action, nodeID)) {
			this.emitLocal(`register.action.${action.name}`, { action, nodeID });
		}
	}

	/**
	 * Wrap action handler for middlewares
	 * 
	 * @param {any} action
	 * 
	 * @memberOf ServiceBroker
	 */
	wrapAction(action) {
		let handler = action.handler;
		if (this.middlewares.length) {
			let mws = Array.from(this.middlewares);
			handler = mws.reduce((handler, mw) => {
				return mw(handler, action);
			}, handler);
		}

		//return this.wrapContextInvoke(action, handler);
		action.handler = handler;

		return action;
	}

	/**
	 * Unregister an action on a local server. 
	 * It will be called when a remote node disconnected. 
	 * 
	 * @param {any} action		action schema
	 * @param {any} nodeID		NodeID if it is on a remote server/node
	 * 
	 * @memberOf ServiceBroker
	 */
	unregisterAction(action, nodeID) {
		let item = this.actions.get(action.name);
		if (item) {
			item.removeByNode(nodeID);
			/* Don't delete because maybe node only disconnected and will come back.
			   So the action is exists, just now it is not available.
			
			if (item.count() == 0) {
				this.actions.delete(action.name);
			}
			this.emitLocal(`unregister.action.${action.name}`, { service, action, nodeID });
			*/
		}		
	}

	/**
	 * Register internal actions
	 * 
	 * @memberOf ServiceBroker
	 */
	registerInternalActions() {
		const addAction = (name, handler) => {
			this.registerAction({
				name,
				cache: false,
				handler: Promise.method(handler)
			});
		};

		addAction("$node.list", () => {
			let res = [];
			this.nodes.forEach(node => {
				res.push(pick(node, ["nodeID", "available"]));
			});

			return res;
		});

		addAction("$node.services", () => {
			let res = [];
			this.services.forEach(service => {
				res.push(pick(service, ["name", "version"]));
			});

			return res;
		});

		addAction("$node.actions", () => {
			let res = [];
			this.actions.forEach((o, name) => {
				let item = o.getLocalItem();
				if (item) {
					res.push({
						name
					});
				}
			});

			return res;
		});

		addAction("$node.health", () => this.getNodeHealthInfo());

		if (this.statistics) {
			addAction("$node.stats", () => {
				return this.statistics.snapshot();
			});				
		}
	}

	/**
	 * Subscribe to an event
	 * 
	 * @param {any} name
	 * @param {any} handler
	 * 
	 * @memberOf ServiceBroker
	 */
	on(name, handler) {
		this.bus.on(name, handler);
	}

	/**
	 * Subscribe to an event once
	 * 
	 * @param {any} name
	 * @param {any} handler
	 * 
	 * @memberOf ServiceBroker
	 */
	once(name, handler) {
		this.bus.once(name, handler);
	}

	/**
	 * Unsubscribe from an event
	 * 
	 * @param {any} name
	 * @param {any} handler
	 * 
	 * @memberOf ServiceBroker
	 */
	off(name, handler) {
		this.bus.off(name, handler);
	}

	/**
	 * Get a local service by name
	 * 
	 * @param {any} serviceName
	 * @returns
	 * 
	 * @memberOf ServiceBroker
	 */
	getService(serviceName) {
		return this.services.find(service => service.name == serviceName);
	}

	/**
	 * Has a local service by name
	 * 
	 * @param {any} serviceName
	 * @returns
	 * 
	 * @memberOf ServiceBroker
	 */
	hasService(serviceName) {
		return this.services.find(service => service.name == serviceName) != null;
	}

	/**
	 * Has an action by name
	 * 
	 * @param {any} actionName
	 * @returns
	 * 
	 * @memberOf ServiceBroker
	 */
	hasAction(actionName) {
		return this.actions.has(actionName);
	}	

	/**
	 * Get an action by name
	 * 
	 * @param {any} actionName
	 * @returns {Object}
	 * 
	 * @memberOf ServiceBroker
	 */
	getAction(actionName) {
		const action = this.actions.get(actionName);
		if (action) {
			return action.get();
		}
		return null;
	}	

	/**
	 * Check has available action handler
	 * 
	 * @param {any} actionName
	 * @returns
	 * 
	 * @memberOf ServiceBroker
	 */
	isActionAvailable(actionName) {
		let action = this.actions.get(actionName);
		return action && action.count() > 0;
	}	

	/**
	 * Add a middleware to the broker
	 * 
	 * @param {any} mw
	 * 
	 * @memberOf ServiceBroker
	 */
	use(...mws) {
		mws.forEach(mw => {
			if (mw)
				this.middlewares.push(mw);
		});
	}

	createNewContext(action, nodeID, params, opts) {
		const ctx = new this.ContextFactory(this, action);
		ctx.nodeID = nodeID;
		ctx.setParams(params);

		if (opts.requestID != null)
			ctx.requestID = opts.requestID;
		else if (opts.parentCtx != null && opts.parentCtx.requestID != null)
			ctx.requestID = opts.parentCtx.requestID;

		if (opts.parentCtx != null && opts.parentCtx.meta != null)
			ctx.meta = _.assign({}, opts.parentCtx.meta, opts.meta);
		else if (opts.meta != null)
			ctx.meta = opts.meta;

		ctx.timeout = opts.timeout;
		ctx.retryCount = opts.retryCount;

		if (opts.parentCtx != null)
			ctx.metrics = opts.parentCtx.metrics;
		else
			ctx.metrics = this.shouldMetric();

		if (ctx.metrics || nodeID) {
			ctx.generateID();

			if (opts.parentCtx != null) {
				ctx.parentID = opts.parentCtx.id;
				ctx.level = opts.parentCtx.level + 1;
			}

		}

		return ctx;
	}

	/**
	 * Call an action (local or remote)
	 * 
	 * @param {any} actionName	name of action
	 * @param {any} params		params of action
	 * @param {any} opts		options of call (optional)
	 * @returns
	 * 
	 * @performance-critical
	 * @memberOf ServiceBroker
	 */
	call(actionName, params, opts = {}) {
		if (opts.timeout == null)
			opts.timeout = this.options.requestTimeout || 0;

		if (opts.retryCount == null)
			opts.retryCount = this.options.requestRetry || 0;		
		
		let actionItem;
		if (typeof actionName !== "string") {
			actionItem = actionName;
			actionName = actionItem.data.name;
		} else {
			// Find action by name
			let actions = this.actions.get(actionName);
			if (actions == null) {
				const errMsg = `Action '${actionName}' is not registered!`;
				this.logger.warn(errMsg);
				return Promise.reject(new E.ServiceNotFoundError(errMsg, actionName));
			}
			
			// Get an action handler item
			actionItem = actions.get();
			if (actionItem == null) {
				const errMsg = `Not available '${actionName}' action handler!`;
				this.logger.warn(errMsg);
				return Promise.reject(new E.ServiceNotFoundError(errMsg, actionName));
			}
		}

		// Expose action info
		let action = actionItem.data;
		let nodeID = actionItem.nodeID;
		
		// Create context
		let ctx;
		if (opts.ctx != null) {
			// Reused context
			ctx = opts.ctx; 
			ctx.nodeID = nodeID;
			ctx.action = action;
		} else {
			// New root context
			ctx = this.createNewContext(action, nodeID, params, opts);
		}

		// Call handler or transfer request
		let p;
		if (!nodeID) {
			// Add metrics start
			if (ctx.metrics === true || ctx.timeout > 0)
				ctx._metricStart();

			p = action.handler(ctx);

			// Timeout handler
			if (ctx.timeout > 0)
				p = p.timeout(ctx.timeout);

			if (ctx.metrics === true || this.statistics === true) {
				// Add metrics & statistics
				p = p.then(res => {
					this._finishCall(ctx, null);
					return res;
				});
			}
		} else {
			p = this.transit.request(ctx);

			// Timeout handler
			if (ctx.timeout > 0)
				p = p.timeout(ctx.timeout);
		}


		// Error handler
		p = p.catch(err => this._callErrorHandler(err, ctx, opts));

		// Pointer to Context
		p.ctx = ctx;

		return p;
	}

	_callErrorHandler(err, ctx, opts) {
		const actionName = ctx.action.name;
		const nodeID = ctx.nodeID;

		if (!(err instanceof Error)) {
			err = new E.CustomError(err);
		}
		if (err instanceof Promise.TimeoutError)
			err = new E.RequestTimeoutError(actionName, nodeID || this.nodeID);

		err.ctx = ctx;

		if (nodeID) {
			// Remove pending request
			this.transit.removePendingRequest(ctx.id);
		}

		if (err instanceof E.RequestTimeoutError) {
			// Retry request
			if (ctx.retryCount-- > 0) {
				this.logger.warn(`Action '${actionName}' call timed out on '${nodeID}'!`);
				this.logger.warn(`Recall '${actionName}' action (retry: ${ctx.retryCount + 1})...`);

				opts.ctx = ctx; // Reuse this context
				return this.call(actionName, ctx.params, opts);
			}
		}

		// Set node status to unavailable
		if (err.code >= 500) {
			const affectedNodeID = err.nodeID || nodeID;
			if (affectedNodeID && affectedNodeID != this.nodeID)
				this.nodeUnavailable(affectedNodeID);
		}

		// Need it? this.logger.error("Action request error!", err);

		this._finishCall(ctx, err);

		// Handle fallback response
		if (opts.fallbackResponse) {
			this.logger.warn(`Action '${actionName}' returns fallback response!`);
			if (_.isFunction(opts.fallbackResponse))
				return opts.fallbackResponse(ctx);
			else
				return Promise.resolve(opts.fallbackResponse);
		}

		return Promise.reject(err);	
	}

	_finishCall(ctx, err) {
		if (ctx.metrics) {
			ctx._metricFinish(err);

			if (this.statistics)
				this.statistics.addRequest(ctx.action.name, ctx.duration, err ? err.code || 500 : null);
		}
	}	

	/**
	 * Check should metric the current call
	 * 
	 * @returns 
	 * 
	 * @memberOf ServiceBroker
	 */
	shouldMetric() {
		if (this.options.metrics) {
			this.sampleCount++;
			if (this.sampleCount * this.options.metricsRate >= 1) {
				this.sampleCount = 0;
				return true;
			}
			
		}
		return false;
	}

	/**
	 * Emit an event (global & local)
	 * 
	 * @param {any} eventName
	 * @param {any} payload
	 * @returns
	 * 
	 * @memberOf ServiceBroker
	 */
	emit(eventName, payload) {
		if (this.transit)
			this.transit.emit(eventName, payload);

		return this.emitLocal(eventName, payload);
	}

	/**
	 * Emit an event only local
	 * 
	 * @param {string} eventName
	 * @param {any} payload
	 * @param {string} nodeID of server
	 * @returns
	 * 
	 * @memberOf ServiceBroker
	 */
	emitLocal(eventName, payload, sender) {
		this.logger.debug("Event emitted:", eventName);		

		return this.bus.emit(eventName, payload, sender);
	}

	/**
	 * Get a list of names of local actions
	 * 
	 * @returns
	 * 
	 * @memberOf ServiceBroker
	 */
	getLocalActionList() {
		let res = {};
		this.actions.forEach((entry, key) => {
			let item = entry.getLocalItem();
			if (item && !/^\$node/.test(key)) // Skip internal actions
				res[key] = omit(item.data, ["handler", "service"]);
		});
		return res;
	}
	
	/**
	 * Process remote node info (list of actions)
	 * 
	 * @param {any} info
	 * 
	 * @memberOf ServiceBroker
	 */
	processNodeInfo(nodeID, node) {
		if (nodeID == null) {
			this.logger.error("Missing nodeID from node info package!");
			return;
		}
		let isNewNode = !this.nodes.has(nodeID);
		node.lastHeartbeatTime = Date.now();
		node.available = true;
		node.id = nodeID;
		this.nodes.set(nodeID, node);

		if (isNewNode) {
			this.emitLocal("node.connected", node);
			this.logger.info(`Node '${nodeID}' connected!`);
		}

		if (node.actions) {
			// Add external actions
			Object.keys(node.actions).forEach(name => {
				// Need to override the name cause of versioned action name;
				let action = Object.assign({}, node.actions[name], { name });
				this.registerAction(action, nodeID);
			});
		}
	}

	/**
	 * Set node to unavailable. 
	 * It will be called when a remote call is thrown a RequestTimeoutError exception.
	 * 
	 * @param {any} nodeID	Node ID
	 * 
	 * @memberOf ServiceBroker
	 */
	nodeUnavailable(nodeID) {
		let node = this.nodes.get(nodeID);
		if (node) {
			this.nodeDisconnected(nodeID, true);
		}
	}

	/**
	 * Check the given nodeID is available
	 * 
	 * @param {any} nodeID	Node ID
	 * @returns {boolean}
	 * 
	 * @memberOf ServiceBroker
	 */
	isNodeAvailable(nodeID) {
		let info = this.nodes.get(nodeID);
		if (info) 
			return info.available;

		return false;
	}

	/**
	 * Save a heart-beat time from a remote node
	 * 
	 * @param {any} nodeID
	 * 
	 * @memberOf ServiceBroker
	 */
	nodeHeartbeat(nodeID) {
		if (this.nodes.has(nodeID)) {
			let node = this.nodes.get(nodeID);
			node.lastHeartbeatTime = Date.now();
			node.available = true;
		}
	}

	/**
	 * Node disconnected event handler. 
	 * Remove node and remove remote actions of node
	 * 
	 * @param {any} nodeID
	 * @param {Boolean} isUnexpected
	 * 
	 * @memberOf ServiceBroker
	 */
	nodeDisconnected(nodeID, isUnexpected) {
		if (this.nodes.has(nodeID)) {
			let node = this.nodes.get(nodeID);
			if (node.available) {
				node.available = false;
				if (node.actions) {
					// Remove remote actions of node
					Object.keys(node.actions).forEach(name => {
						let action = Object.assign({}, node.actions[name], { name });
						this.unregisterAction(action, node.nodeID);
					});
				}

				this.emitLocal(isUnexpected ? "node.broken" : "node.disconnected", node);
				//this.nodes.delete(nodeID);			
				this.logger.warn(`Node '${nodeID}' disconnected!`);
			}
		}
	}

	/**
	 * Check all registered remote nodes is live.
	 * 
	 * @memberOf ServiceBroker
	 */
	checkRemoteNodes() {
		let now = Date.now();
		this.nodes.forEach(node => {
			if (now - (node.lastHeartbeatTime || 0) > this.options.heartbeatTimeout * 1000) {
				this.nodeDisconnected(node.nodeID);
			}
		});
	}
}

module.exports = ServiceBroker;