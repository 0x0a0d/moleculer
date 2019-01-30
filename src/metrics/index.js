/*
 * moleculer
 * Copyright (c) 2019 MoleculerJS (https://github.com/moleculerjs/moleculer)
 * MIT Licensed
 */

"use strict";

const METRIC = require("./constants");

const MetricRegistry = require("./registry");
const BaseMetric = require("./types/base");
const CounterMetric = require("./types/counter");
const GaugeMetric = require("./types/gauge");
const HistrogramMetric = require("./types/histogram");
const InfoMetric = require("./types/info");

module.exports = {
	METRIC: METRIC,

	MetricRegistry,

	BaseMetric,
	CounterMetric,
	GaugeMetric,
	HistrogramMetric,
	InfoMetric
};
