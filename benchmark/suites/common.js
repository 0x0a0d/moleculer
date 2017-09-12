"use strict";

//let _ = require("lodash");
let Promise	= require("bluebird");

let Benchmarkify = require("benchmarkify");
let benchmark = new Benchmarkify("Moleculer common benchmarks").printHeader();

let ServiceBroker = require("../../src/service-broker");

function createBroker(opts) {
	// Create broker
	let broker = new ServiceBroker(opts);
	broker.loadService(__dirname + "/../user.service");
	broker.start();

	return broker;
}

let bench1 = benchmark.createSuite("Local call");
(function() {
	let broker = createBroker();
	bench1.ref("broker.call (normal)", done => {
		return broker.call("users.empty").then(done);
	});

	bench1.add("broker.call (with params)", done => {
		return broker.call("users.empty", { id: 5, sort: "name created", limit: 10 }).then(done);
	});

})();

// ----------------------------------------------------------------
let bench2 = benchmark.createSuite("Call with middlewares");

(function() {
	let broker = createBroker();
	bench2.ref("No middlewares", done => {
		return broker.call("users.empty").then(done);
	});
})();

(function() {
	let broker = createBroker();

	let mw1 = handler => {
		return ctx => Promise.resolve().then(() => handler(ctx).then(res => res));
	};
	broker.use(mw1, mw1, mw1, mw1, mw1);

	bench2.add("5 middlewares", done => {
		return broker.call("users.empty").then(done);
	});
})();

// ----------------------------------------------------------------
let bench3 = benchmark.createSuite("Call with statistics & metrics");

(function() {
	let broker = createBroker();
	bench3.ref("No statistics", done => {
		return broker.call("users.empty").then(done);
	});
})();

(function() {
	let broker = createBroker({ metrics: true });
	bench3.add("With metrics", done => {
		return broker.call("users.empty").then(done);
	});
})();

(function() {
	let broker = createBroker({ statistics: true });
	bench3.add("With statistics", done => {
		return broker.call("users.empty").then(done);
	});
})();

(function() {
	let broker = createBroker({ metrics: true, statistics: true });
	bench3.add("With metrics & statistics", done => {
		return broker.call("users.empty").then(done);
	});
})();

// ----------------------------------------------------------------
let bench4 = benchmark.createSuite("Remote call with FakeTransporter");

(function() {

	let Transporter = require("../../src/transporters/fake");
	let Serializer = require("../../src/serializers/json");

	let b1 = new ServiceBroker({
		transporter: new Transporter(),
		requestTimeout: 0,
		serializer: new Serializer(),
		nodeID: "node-1"
	});

	let b2 = new ServiceBroker({
		transporter: new Transporter(),
		requestTimeout: 0,
		serializer: new Serializer(),
		nodeID: "node-2"
	});

	b2.createService({
		name: "echo",
		actions: {
			reply(ctx) {
				return ctx.params;
			}
		}
	});

	b1.start().then(() => b2.start());

	let c = 0;
	bench4.add("Remote call echo.reply", done => {
		return b1.call("echo.reply", { a: c++ }).then(done);
	});
})();

module.exports = benchmark.run([bench1, bench2, bench3, bench4]);


/*

===============================
  Moleculer common benchmarks
===============================

Platform info:
==============
   Windows_NT 6.1.7601 x64
   Node.JS: 6.10.0
   V8: 5.1.281.93
   Intel(R) Core(TM) i7-4770K CPU @ 3.50GHz × 8

Suite: Local call
√ broker.call (normal)*             1,329,946 rps
√ broker.call (with params)*        1,242,043 rps

   broker.call (normal)* (#)            0%      (1,329,946 rps)   (avg: 751ns)
   broker.call (with params)*       -6.61%      (1,242,043 rps)   (avg: 805ns)
-----------------------------------------------------------------------

Suite: Call with middlewares
√ No middlewares*        1,212,999 rps
√ 5 middlewares*         1,234,193 rps

   No middlewares* (#)       0%      (1,212,999 rps)   (avg: 824ns)
   5 middlewares*        +1.75%      (1,234,193 rps)   (avg: 810ns)
-----------------------------------------------------------------------

Suite: Call with statistics & metrics
√ No statistics*                    1,234,234 rps
√ With metrics*                       384,631 rps
√ With statistics*                    549,852 rps
√ With metrics & statistics*          272,172 rps

   No statistics* (#)                   0%      (1,234,234 rps)   (avg: 810ns)
   With metrics*                   -68.84%        (384,631 rps)   (avg: 2μs)
   With statistics*                -55.45%        (549,852 rps)   (avg: 1μs)
   With metrics & statistics*      -77.95%        (272,172 rps)   (avg: 3μs)
-----------------------------------------------------------------------

Suite: Remote call with FakeTransporter
√ Remote call echo.reply*           44,055 rps

   Remote call echo.reply*           0%         (44,055 rps)   (avg: 22μs)
-----------------------------------------------------------------------

*/
