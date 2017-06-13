/*
 * moleculer
 * Copyright (c) 2017 Ice Services (https://github.com/ice-services/moleculer)
 * MIT Licensed
 */

"use strict";

const os = require("os");
const _ = require("lodash");
const { getIpList } = require("./utils");

module.exports = function(broker) {
	return Promise.resolve({})

		// CPU
		.then(res => {
			const load = os.loadavg();
			res.cpu = {
				load1: load[0],
				load5: load[1],
				load15: load[2],
				cores: os.cpus().length
			};
			res.cpu.utilization = Math.floor(load[0] * 100 / res.cpu.cores);

			return res;
		})

		// Memory
		.then(res => {
			res.mem = {
				free: os.freemem(),
				total: os.totalmem()
			};
			res.mem.percent = (res.mem.free * 100 / res.mem.total);

			return res;
		})

		// OS 
		.then(res => {
			res.os = {
				uptime: os.uptime(),
				type: os.type(),
				release: os.release(),
				hostname: os.hostname(),
				arch: os.arch(),
				platform: os.platform(),
				user: os.userInfo()
			};

			return res;
		})

		// Process 
		.then(res => {
			res.process = {
				pid: process.pid,
				memory: process.memoryUsage(),
				uptime: process.uptime(),
				argv: process.argv
			};

			return res;
		})

		// Network interfaces
		.then(res => {
			res.net = {
				ip:  getIpList()
			};

			return res;
		})

		// Transit stat
		.then(res => {
			if (broker.transit) {
				res.transit = {
					stat: _.clone(broker.transit.stat)
				};
			}

			return res;
		})

		// Date & time
		.then(res => {
			res.time = {
				now: Date.now(),
				iso: new Date().toISOString(),
				utc: new Date().toUTCString()
			};
			return res;
		});

	// TODO: event loop & GC info
	// https://github.com/RisingStack/trace-nodejs/blob/master/lib/agent/metrics/apm/index.js

};