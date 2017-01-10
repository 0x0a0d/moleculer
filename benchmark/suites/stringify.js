"use strict";

let Promise	= require("bluebird");

let Benchmarker = require("../benchmarker");
Benchmarker.printHeader("JSON stringify benchmark");

let safeStringify = require("fast-safe-stringify");

let bench = new Benchmarker({ async: false, name: "Stringify JS object to JSON (10k)"});
let data = JSON.parse(bench.getDataFile("10k.json"));

// ----
bench.add("Built-in JSON.stringify", () => {
	try {
		return JSON.stringify(data);
	} catch (e) {
	}	
});

bench.add("fast-safe-stringify", () => {
	return safeStringify(data);
});

bench.run();