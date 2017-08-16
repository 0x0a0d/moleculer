/*
 * moleculer
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer)
 * MIT Licensed
 */

"use strict";

const Promise					= require("bluebird");
const Context					= require("./context");
const P 						= require("./packets");
const { getIpList } 			= require("./utils");
const { hash } 					= require("node-object-hash")({ sort: false, coerce: false});

/**
 * Transit class
 * 
 * @class Transit
 */
class Transit {

	/**
	 * Create an instance of Transit.
	 * 
	 * @param {ServiceBroker} Broker instance
	 * @param {Transporter} Transporter instance
	 * @param {Object?} opts
	 * 
	 * @memberOf Transit
	 */
	constructor(broker, transporter, opts) {
		this.broker = broker;
		this.logger = broker.getLogger("transit");
		this.nodeID = broker.nodeID;		
		this.tx = transporter;
		this.opts = opts;

		this.nodes = new Map();

		this.pendingRequests = new Map();

		this.heartbeatTimer = null;
		this.checkNodesTimer = null;

		this.stat = {
			packets: {
				sent: 0,
				received: 0
			}
		};

		this.connected = false;
		this.disconnecting = true;

		if (this.tx)
			this.tx.init(this, this.messageHandler.bind(this), this.afterConnect.bind(this));

		this.__connectResolve = null;
	}

	/**
	 * It will be called after transporter connected or reconnected.
	 * 
	 * @param {any} wasReconnect 
	 * @returns {Promise}
	 * 
	 * @memberof Transit
	 */
	afterConnect(wasReconnect) {
		return Promise.resolve()

			.then(() => {
				if (!wasReconnect) 
					return this.makeSubscriptions();
			})

			.then(() => this.discoverNodes())
			.then(() => this.sendNodeInfo())

			.then(() => {
				this.connected = true;

				if (this.__connectResolve) {
					this.__connectResolve();
					this.__connectResolve = null;
				}
			});
	}

	/**
	 * Connect with transporter. If failed, try again after 5 sec.
	 * 
	 * @memberOf Transit
	 */
	connect() {
		this.logger.info("Connecting to the transporter...");
		return new Promise(resolve => {
			this.__connectResolve = resolve;

			const doConnect = () => {
				/* istanbul ignore next */
				this.tx.connect().catch(err => {
					if (this.disconnecting) return;
					
					this.logger.warn("Connection is failed!", err.message);
					this.logger.debug(err);

					setTimeout(() => {
						this.logger.info("Reconnecting...");
						doConnect();
					}, 5 * 1000);
				});
			};

			doConnect();
		})
			.then(() => {
			// Start timers
				this.heartbeatTimer = setInterval(() => {
				/* istanbul ignore next */
					this.sendHeartbeat();
				}, this.broker.options.heartbeatInterval * 1000);
				this.heartbeatTimer.unref();

				this.checkNodesTimer = setInterval(() => {
				/* istanbul ignore next */
					this.checkRemoteNodes();
				}, this.broker.options.heartbeatTimeout * 1000);
				this.checkNodesTimer.unref();	

			});
	}

	/**
	 * Disconnect with transporter
	 * 
	 * @memberOf Transit
	 */
	disconnect() {
		this.connected = false;
		this.disconnecting = true;
		if (this.heartbeatTimer) {
			clearInterval(this.heartbeatTimer);
			this.heartbeatTimer = null;
		}

		if (this.checkNodesTimer) {
			clearInterval(this.checkNodesTimer);
			this.checkNodesTimer = null;
		}
		if (this.tx.connected) {
			return this.sendDisconnectPacket()
				.then(() => this.tx.disconnect());
		}
		/* istanbul ignore next */
		return Promise.resolve();
	}

	/**
	 * Send DISCONNECT to remote nodes
	 * 
	 * @returns {Promise}
	 * 
	 * @memberOf Transit
	 */
	sendDisconnectPacket() {
		this.logger.debug("Send DISCONNECT to nodes...");

		return this.publish(new P.PacketDisconnect(this));
	}

	/**
	 * Subscribe to topics for transportation
	 * 
	 * @memberOf Transit
	 */
	makeSubscriptions() {

		// Subscribe to broadcast events
		this.subscribe(P.PACKET_EVENT);

		// Subscribe to requests
		this.subscribe(P.PACKET_REQUEST, this.nodeID);

		// Subscribe to node responses of requests
		this.subscribe(P.PACKET_RESPONSE, this.nodeID);

		// Discover handler
		this.subscribe(P.PACKET_DISCOVER);

		// NodeInfo handler
		this.subscribe(P.PACKET_INFO); // Broadcasted INFO. If a new node connected
		this.subscribe(P.PACKET_INFO, this.nodeID); // Response INFO to DISCOVER packet

		// Disconnect handler
		this.subscribe(P.PACKET_DISCONNECT);

		// Heart-beat handler
		this.subscribe(P.PACKET_HEARTBEAT);

		return Promise.resolve();
	}

	/**
	 * Emit an event to remote nodes
	 * 
	 * @param {any} eventName
	 * @param {any} data
	 * 
	 * @memberOf Transit
	 */
	emit(eventName, data) {
		this.publish(new P.PacketEvent(this, eventName, data));
	}

	/**
	 * Message handler for incoming packets
	 * 
	 * @param {Array} topic 
	 * @param {String} msg 
	 * @returns 
	 * 
	 * @memberOf Transit
	 */
	messageHandler(cmd, msg) {
		if (msg == null) {
			throw new Error("Missing packet!");
		}

		this.stat.packets.received = this.stat.packets.received + 1;

		const packet = P.Packet.deserialize(this, cmd, msg);
		const payload = packet.payload;

		// Check payload
		if (!payload) {
			/* istanbul ignore next */
			throw new Error("Missing response payload!");
		}

		if (payload.sender == this.nodeID) 
			return Promise.resolve(); 

		// Request
		if (cmd === P.PACKET_REQUEST) {
			return this._requestHandler(payload);
		}

		// Response
		else if (cmd === P.PACKET_RESPONSE) {
			return this._responseHandler(payload);
		}

		// Event
		else if (cmd === P.PACKET_EVENT) {
			//this.logger.debug("Event received", payload);
			this.broker.emitLocal(payload.event, payload.data, payload.sender);				
			return;
		}

		// Node info
		else if (cmd === P.PACKET_INFO || cmd === P.PACKET_DISCOVER) {
			this.processNodeInfo(payload.sender, payload);

			if (cmd == "DISCOVER") {
				//this.logger.debug("Discover received from " + payload.sender);
				this.sendNodeInfo(payload.sender);
			}
			return;
		}

		// Disconnect
		else if (cmd === P.PACKET_DISCONNECT) {
			this.nodeDisconnected(payload.sender);
			return;
		}

		// Heartbeat
		else if (cmd === P.PACKET_HEARTBEAT) {
			//this.logger.debug("Node heart-beat received from " + payload.sender);
			this.nodeHeartbeat(payload.sender, payload);
			return;
		}
	}

	/**
	 * Handle incoming request
	 * 
	 * @param {Object} packet 
	 * @returns {Promise}
	 * 
	 * @memberOf Transit
	 */
	_requestHandler(payload) {
		this.logger.debug(`Request '${payload.action}' received from '${payload.sender}' node.`);
		
		// Recreate caller context
		const ctx = new Context(this.broker);
		ctx.action = {
			name: payload.action
		};
		ctx.id = payload.id;
		ctx.parentID = payload.parentID;
		ctx.level = payload.level;
		ctx.metrics = payload.metrics;
		ctx.callerNodeID = payload.sender;
		ctx.meta = payload.meta;
		ctx.setParams(payload.params);
		
		return this.broker.call(payload.action, payload.params, { ctx: ctx })
			.then(res => this.sendResponse(payload.sender, payload.id,  res, null))
			.catch(err => this.sendResponse(payload.sender, payload.id, null, err));
	}

	/**
	 * Process incoming response of request
	 * 
	 * @param {Object} packet 
	 * @returns {Promise}
	 * 
	 * @memberOf Transit
	 */
	_responseHandler(packet) {
		const id = packet.id;
		const req = this.pendingRequests.get(id);

		// If not exists (timed out), we skip to process the response
		if (req == null) return Promise.resolve();

		// Remove pending request
		this.removePendingRequest(id);

		this.logger.debug(`Response '${req.action.name}' received from '${req.nodeID}'.`);

		if (!packet.success) {
			// Recreate exception object
			let err = new Error(packet.error.message + ` (NodeID: ${packet.sender})`);
			// TODO create the original error object if it's available
			//   let constructor = errors[packet.error.name]
			//   let error = Object.create(constructor.prototype);
			err.name = packet.error.name;
			err.code = packet.error.code;
			err.type = packet.error.type;
			err.nodeID = packet.error.nodeID || packet.sender;
			err.data = packet.error.data;
			if (packet.error.stack)
				err.stack = packet.error.stack;

			return req.reject(err);
		}

		return req.resolve(packet.data);
	}	

	/**
	 * Send a request to a remote service. It returns a Promise
	 * what will be resolved when the response received.
	 * 
	 * @param {<Context>} ctx			Context of request
	 * @returns	{Promise}
	 * 
	 * @memberOf Transit
	 */
	request(ctx) {
		// Expanded the code that v8 can optimize it.  (TryCatchStatement disable optimizing)
		return new Promise((resolve, reject) => this._doRequest(ctx, resolve, reject));
	}

	/**
	 * Do a remote request
	 * 
	 * @param {<Context>} ctx 		Context of request
	 * @param {Function} resolve 	Resolve of Promise
	 * @param {Function} reject 	Reject of Promise
	 * 
	 * @memberOf Transit
	 */
	_doRequest(ctx, resolve, reject) {
		const request = {
			nodeID: ctx.nodeID,
			action: ctx.action,
			//ctx,
			resolve,
			reject
		};

		const packet = new P.PacketRequest(this, ctx.nodeID, ctx);

		this.logger.debug(`Send '${ctx.action.name}' request to '${ctx.nodeID}' node.`);

		// Add to pendings
		this.pendingRequests.set(ctx.id, request);

		//return resolve(ctx.params);
		
		// Publish request
		this.publish(packet);		
	}


	/**
	 * Remove a pending request
	 * 
	 * @param {any} id 
	 * 
	 * @memberOf Transit
	 */
	removePendingRequest(id) {
		this.pendingRequests.delete(id);
	}

	/**
	 * Send back the response of request
	 * 
	 * @param {String} nodeID 
	 * @param {String} id
	 * @param {any} data 
	 * @param {Error} err 
	 * 
	 * @memberOf Transit
	 */
	sendResponse(nodeID, id, data, err) {
		//this.logger.debug(`Send response back to '${nodeID}'`);

		// Publish the response
		return this.publish(new P.PacketResponse(this, nodeID, id, data, err));
	}	

	/**
	 * Get Node information to DISCOVER & INFO packages
	 * 
	 * @returns {Object}
	 * 
	 * @memberof Transit
	 */
	getNodeInfo() {
		const services = this.broker.serviceRegistry.getServiceList({ onlyLocal: true, withActions: true });
		const uptime = process.uptime();
		const ipList = getIpList();
		const versions = {
			node: process.version,
			moleculer: this.broker.MOLECULER_VERSION
		};

		return {
			services,
			ipList,
			versions,
			uptime
		};
	}

	/**
	 * Discover other nodes. It will be called after success connect.
	 * 
	 * @memberOf Transit
	 */
	discoverNodes() {
		return this.publish(new P.PacketDiscover(this));
	}

	/**
	 * Send node info package to other nodes. It will be called with timer
	 * 
	 * @memberOf Transit
	 */
	sendNodeInfo(nodeID) {
		const info = this.getNodeInfo();
		return this.publish(new P.PacketInfo(this, nodeID, info));
	}

	/**
	 * Send a node heart-beat. It will be called with timer
	 * 
	 * @memberOf Transit
	 */
	sendHeartbeat() {
		const uptime = process.uptime();
		return this.publish(new P.PacketHeartbeat(this, uptime));
	}

	/**
	 * Subscribe via transporter
	 * 
	 * @param {String} topic 
	 * @param {String=} nodeID
	 * 
	 * @memberOf Transit
	 */
	subscribe(topic, nodeID) {
		return this.tx.subscribe(topic, nodeID);
	}

	/**
	 * Publish via transporter
	 * 
	 * @param {Packet} Packet
	 * 
	 * @memberOf Transit
	 */
	publish(packet) {
		this.stat.packets.sent = this.stat.packets.sent + 1;
		return this.tx.publish(packet);
	}

	/**
	 * Serialize the object
	 * 
	 * @param {Object} obj 
	 * @returns {Buffer}
	 * 
	 * @memberOf Transit
	 */
	serialize(obj, type) {
		return this.broker.serializer.serialize(obj, type);
	}

	/**
	 * Deserialize the incoming Buffer to object
	 * 
	 * @param {Buffer} buf
	 * @returns {any}
	 * 
	 * @memberOf Transit
	 */
	deserialize(buf, type) {
		if (buf == null) return null;
		
		return this.broker.serializer.deserialize(buf, type);
	}

	/**
	 * Process remote node info (list of actions)
	 * 
	 * @param {String} nodeID
	 * @param {Object} payload
	 * 
	 * @memberOf Transit
	 */
	processNodeInfo(nodeID, payload) {
		if (nodeID == null) {
			this.logger.error("Missing nodeID in INFO packet!");
			return;
		}

		// Is it a new node?
		let isNewNode = !this.nodes.has(nodeID);

		// Get old node item
		const oldNode = this.nodes.get(nodeID);
		const oldServicesHash = hash(oldNode ? oldNode.services : null);

		// Refresh node properties
		const node = Object.assign(oldNode || {}, payload);

		// Is it a reconnected node?
		let isReconnected = !node.available;

		// Update heartbeat & status
		node.lastHeartbeatTime = Date.now();
		node.available = true;
		node.id = nodeID;

		// Set the new node item
		this.nodes.set(nodeID, node);

		// Notifications
		if (isNewNode) {
			this.broker.emitLocal("node.connected", { node, reconnected: false });
			this.logger.info(`Node '${nodeID}' connected!`);
		} else if (isReconnected) {
			this.broker.emitLocal("node.connected", { node, reconnected: true });
			this.logger.info(`Node '${nodeID}' reconnected!`);
		} else {
			this.broker.emitLocal("node.info", { node });
			this.logger.debug(`Node '${nodeID}' info received!`);
		}

		// Update node services in registry
		if (node.services) {
			if (isReconnected || oldServicesHash !== hash(node.services)) {
				this.logger.debug(`Re-register node '${nodeID}' services...`);

				// Unregister previous services
				this.broker.unregisterServicesByNode(nodeID);

				// Register remote services
				node.services.forEach(service => this.broker.registerRemoteService(nodeID, service));
			}
		}
	}

	/**
	 * Check the given nodeID is available
	 * 
	 * @param {any} nodeID	Node ID
	 * @returns {boolean}
	 * 
	 * @memberOf Transit
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
	 * @param {Object} payload
	 * 
	 * @memberOf Transit
	 */
	nodeHeartbeat(nodeID, payload) {
		if (this.nodes.has(nodeID)) {
			let node = this.nodes.get(nodeID);
			node.lastHeartbeatTime = Date.now();
			node.uptime = payload.uptime;
			node.available = true;
		}
	}

	/**
	 * Node disconnected event handler. 
	 * Remove node and remove remote actions of node
	 * 
	 * @param {any} nodeID
	 * @param {Boolean=} isUnexpected
	 * 
	 * @memberOf Transit
	 */
	nodeDisconnected(nodeID, isUnexpected) {
		if (this.nodes.has(nodeID)) {
			let node = this.nodes.get(nodeID);
			if (node.available) {
				node.available = false;
				this.broker.unregisterServicesByNode(nodeID);

				this.broker.emitLocal("node.disconnected", { node, unexpected: !!isUnexpected });
				//this.nodes.delete(nodeID);			
				this.logger.warn(`Node '${nodeID}' disconnected!`);
			}
		}
	}

	/**
	 * Check all registered remote nodes is live.
	 * 
	 * @memberOf Transit
	 */
	checkRemoteNodes() {
		let now = Date.now();
		this.nodes.forEach(node => {
			if (now - (node.lastHeartbeatTime || 0) > this.broker.options.heartbeatTimeout * 1000) {
				this.nodeDisconnected(node.id, true);
			}
		});
	}
	
}

module.exports = Transit;