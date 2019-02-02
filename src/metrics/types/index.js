/*
 * moleculer
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer)
 * MIT Licensed
 */

"use strict";

const _ = require("lodash");
const { BrokerOptionsError } = require("../../errors");

const Types = {
	Base: require("./base"),
	Counter: require("./counter"),
	Gauge: require("./gauge"),
	Histogram: require("./histogram"),
	Info: require("./info"),
};

function getByName(name) {
	/* istanbul ignore next */
	if (!name)
		return null;

	let n = Object.keys(Types).find(n => n.toLowerCase() == name.toLowerCase());
	if (n)
		return Types[n];
}

/**
 * Resolve metric type by name
 *
 * @param {string} type
 * @returns {BaseMetric}
 * @memberof ServiceBroker
 */
function resolve(type) {
	const TypeClass = getByName(type);
	if (!TypeClass)
		throw new BrokerOptionsError(`Invalid metric type '${type}'.`, { type });

	return TypeClass;
}

module.exports = Object.assign({ resolve }, Types);
