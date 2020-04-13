/*
 * moleculer
 * Copyright (c) 2020 MoleculerJS (https://github.com/moleculerjs/moleculer)
 * MIT Licensed
 */

"use strict";

const _ = require("lodash");
const { BrokerOptionsError } = require("../../errors");
const BaseDiscoverer = require("./base");
const { humanize } = require("../../utils");

let Redis;

/**
 * Redis-based Discoverer class
 * TODO:
 * 	- add metrics counters (cycleTime, count)
 *  - ne minden körben töltse le a HB adatokat, csak a kulcsból szedje ki a nodeID nevét
 *  - az INFO csomagnak is állítson TTL-t, külön timer, ami frissíti azt. Pl, 30 perc, 15 percenként
 *    frissíti a TTL-t az "EXPIRE" paranccsal
 * @class RedisDiscoverer
 */
class RedisDiscoverer extends BaseDiscoverer {

	/**
	 * Creates an instance of Discoverer.
	 *
	 * @memberof RedisDiscoverer
	 */
	constructor(opts) {
		super(opts);

		this.opts = _.defaultsDeep(this.opts, {
			fullCheckNum: 1,
			scanLength: 100,
			redis: null,
			monitor: false
		});

		this.idx = 0;

		// Store the online nodes.
		this.nodes = new Map();

		this.client = null;
	}

	/**
	 * Initialize Discoverer
	 *
	 * @param {any} registry
	 *
	 * @memberof RedisDiscoverer
	 */
	init(registry) {
		super.init(registry);

		try {
			Redis = require("ioredis");
		} catch (err) {
			/* istanbul ignore next */
			this.broker.fatal("The 'ioredis' package is missing. Please install it with 'npm install ioredis --save' command.", err, true);
		}

		this.PREFIX = `MOL${this.broker.namespace ? "-" + this.broker.namespace : ""}-DISCOVER`;
		this.BEAT_KEY = `${this.PREFIX}-BEAT-${this.broker.nodeID}`;
		this.INFO_KEY = `${this.PREFIX}-INFO-${this.broker.nodeID}`;

		/**
		 * ioredis client instance
		 * @memberof RedisCacher
		 */
		if (this.opts.cluster) {
			if (!this.opts.cluster.nodes || this.opts.cluster.nodes.length === 0) {
				throw new BrokerOptionsError("No nodes defined for cluster");
			}

			this.client = new Redis.Cluster(this.opts.cluster.nodes, this.opts.cluster.options);
		} else {
			this.client = new Redis(this.opts.redis);
		}

		this.client.on("connect", () => {
			/* istanbul ignore next */
			this.logger.info("Redis Discoverer client connected.");
		});

		this.client.on("reconnecting", () => {
			/* istanbul ignore next */
			this.logger.warn("Redis Discoverer client reconnecting...");
		});

		this.client.on("error", (err) => {
			/* istanbul ignore next */
			this.logger.error(err);
		});

		if (this.opts.monitor) {
			this.client.monitor((err, monitor) => {
				this.logger.debug("Redis Discoverer entering monitoring mode...");
				monitor.on("monitor", (time, args/*, source, database*/) => this.logger.debug(args));
			});
		}

		this.logger.debug("Redis Discoverer created. Prefix:", this.PREFIX);
	}

	/**
	 * Stop discoverer clients.
	 */
	stop() {
		return super.stop()
			.then(() => {
				if (this.client)
					return this.client.quit();
			});
	}

	/**
	 * Sending a local heartbeat to Redis.
	 *
	 * @param {Node} localNode
	 */
	sendHeartbeat(localNode) {
		const start = process.hrtime();
		const data = {
			sender: this.broker.nodeID,
			ver: this.broker.PROTOCOL_VERSION,

			timestamp: Date.now(),
			cpu: localNode.cpu,
			seq: localNode.seq
		};
		return this.client.setex(this.BEAT_KEY, this.opts.heartbeatTimeout, JSON.stringify(data))
			//.then(() => this.logger.debug("Heartbeat sent."))
			.then(() => this.collectOnlineNodes())
			.then(() => {
				const diff = process.hrtime(start);
				const duration = (diff[0] * 1e3) + (diff[1] / 1e6);
				this.logger.info("HB cycle", humanize(duration));
			});
	}

	/**
	 * Collect online nodes from Redis server.
	 */
	collectOnlineNodes() {
		this.idx++;

		// Save the previous state so that we can check the disconnected nodes.
		const prevNodes = new Map(this.nodes);

		// Collect the online node keys.
		return new Promise((resolve, reject) => {
			const stream = this.client.scanStream({
				match: `${this.PREFIX}-BEAT-*`,
				count: 100
			});
			stream.on("data", keys => {
				if (!keys || !keys.length) return;

				stream.pause();

				return this.client.mget(...keys)
					.then(resultArr => Promise.all(resultArr.map(res => {
						let packet;
						try {
							packet = JSON.parse(res);
							if (packet.sender == this.broker.nodeID) return;
						} catch(err) {
							this.logger.warn("Unable to parse Redis response", res);
							return;
						}

						prevNodes.delete(packet.sender);

						const prevPacket = this.nodes.get(packet.sender);
						let p = this.Promise.resolve();
						if (!prevPacket) {
							// New node
							this.logger.debug(`New node '${packet.sender}' is available. Updating the registry...`);
							p = p.then(() => this.discoverNode(packet.sender));
						} else {
							if (prevPacket.seq !== packet.seq) {
								// INFO is updated.
								this.logger.debug(`The node '${packet.sender}' seq number has been changed. Updating the registry...`);
								p = p.then(() => this.discoverNode(packet.sender));
							}
						}

						return p.then(() => {
							this.nodes.set(packet.sender, packet);
							this.heartbeatReceived(packet.sender, packet);
						});
					})))
					.then(() => stream.resume());
			});

			stream.on("error", err => reject(err));
			stream.on("end", () => resolve());

		}).then(() => {
			if (prevNodes.size > 0) {
				// Disconnected nodes
				Array.from(prevNodes.keys()).map(nodeID => {
					this.logger.debug(`The node '${nodeID}' is not available. Removing from registry...`);
					this.remoteNodeDisconnected(nodeID, true);
					this.nodes.delete(nodeID);
				});
			}
		}).catch(err => this.logger.error("Error occured while scanning Redis keys.", err));
	}

	/**
	 * Discover a new or old node.
	 * @param {String} nodeID
	 */
	discoverNode(nodeID) {
		return this.client.get(`${this.PREFIX}-INFO-${nodeID}`)
			.then(res => {
				if (!res) {
					this.logger.warn(`No INFO for '${nodeID}' node in registry.`);
					return;
				}
				try {
					const info = JSON.parse(res);
					return this.processRemoteNodeInfo(nodeID, info);
				} catch(err) {
					this.logger.warn("Unable to parse Redis response", res);
				}
			});
	}

	/**
	 * Discover all nodes (after connected)
	 */
	discoverAllNodes() {
		return this.collectOnlineNodes();
	}

	/**
	 * Local service registry has been changed. We should notify remote nodes.
	 * @param {String} nodeID
	 */
	sendLocalNodeInfo(nodeID) {
		const info = this.broker.getLocalNodeInfo();

		const payload = Object.assign({
			ver: this.broker.PROTOCOL_VERSION,
			sender: this.broker.nodeID
		}, info);

		return this.client.set(this.INFO_KEY, JSON.stringify(payload))
			.then(() => {
				// Sending a new heartbeat because it contains the `seq`
				if (!nodeID) this.beat();
			});
	}

	/**
	 * Unregister local node after disconnecting.
	 */
	localNodeDisconnected() {
		return this.Promise.resolve()
			.then(() => super.localNodeDisconnected())
			.then(() => this.logger.debug("Remove local node from registry..."))
			.then(() => this.client.del(this.INFO_KEY))
			.then(() => this.client.del(this.BEAT_KEY));
	}

	/**
	 * Called when a remote node disconnected (received DISCONNECT packet)
	 * You can clean it from local cache.
	 *
	 * @param {String} nodeID
	 * @param {Object} payload
	 * @param {Boolean} isUnexpected
	 */
	remoteNodeDisconnected(nodeID, isUnexpected) {
		super.remoteNodeDisconnected(nodeID, isUnexpected);
		this.nodes.delete(nodeID);
	}
}

module.exports = RedisDiscoverer;
