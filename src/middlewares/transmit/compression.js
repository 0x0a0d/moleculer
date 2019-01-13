/*
 * moleculer
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer)
 * MIT Licensed
 */

"use strict";

const zlib = require("zlib");
const { promisify } = require("util");

/**
 * This is a transmission compression middleware. It supports
 * the `deflate`, `deflateRaw` & `gzip` compression methods.
 *
 * @param {String} method
 */
module.exports = function CompressionMiddleware(method = "deflate") {
	let compress, decompress;

	switch(method) {
		case "deflate":
			compress = promisify(zlib.deflate);
			decompress = promisify(zlib.inflate);
			break;
		case "deflateRaw":
			compress = promisify(zlib.deflateRaw);
			decompress = promisify(zlib.inflateRaw);
			break;
		case "gzip":
			compress = promisify(zlib.gzip);
			decompress = promisify(zlib.gunzip);
			break;
		default:
			throw new Error("Unknow compression method: " + method);
	}

	let savingSent = 0;
	let savingReceived = 0;

	return {

		created() {
			this.logger.info(`The transmission is COMPRESSED by '${method}'.`);
		},

		transporterSend(next) {
			return (topic, data, meta) => {
				return compress(data)
					.then(res => {
						savingSent += data.length - res.length;
						this.logger.debug(`Packet '${topic}' compressed. Saving: ${Number((1 - (res.length / data.length)) * 100).toFixed(0)}%`, data.length, res.length);
						return next(topic, res, meta);
					});
			};
		},

		transporterReceive(next) {
			return (cmd, data, s) => {
				return decompress(data)
					.then(res => {
						savingReceived += res.length - data.length;
						this.logger.debug(`Packet '${cmd}' decompressed. Saving: ${Number((1 - (res.length / data.length)) * 100).toFixed(0)}%`, data.length, res.length);
						return next(cmd, res, s);
					});
			};
		}
	};
};
