/*
 * moleculer
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer)
 * MIT Licensed
 */

"use strict";

const GaugeMetric = require("./gauge");
const METRIC = require("../constants");

class CounterMetric extends GaugeMetric {

	constructor(opts, registry) {
		opts.type = METRIC.TYPE_COUNTER;
		super(opts, registry);

		this.resetAll();
	}

	decrement() {
		throw new Error("Counter can't be decreased");
	}
}

module.exports = CounterMetric;
