"use strict";

let Promise	= require("bluebird");

let Benchmarkify = require("benchmarkify");
Benchmarkify.printHeader("Context benchmark");

let ServiceBroker = require("../../src/service-broker");
let Context = require("../../src/context");

let broker = new ServiceBroker();
broker.loadService(__dirname + "/../user.service");

let bench1 = new Benchmarkify({ async: false, name: "Context constructor"});
(function() {
	let action = {
		name: "users.find",
		handler: () => {},
	};
	//let params = bench1.getDataFile("150.json");
	let params = { limit: 100, offset: 50, sort: "name created" };

	// ----
	bench1.add("create without settings", () => {
		return new Context();
	});

	bench1.add("create with settings", () => {
		return new Context({
			broker,
			action
		});
	});

	bench1.add("create with params", () => {
		return new Context({
			broker,
			action,
			params
		});
	});

	let ctx = new Context();
	bench1.add("create subContext", () => {
		return ctx.createSubContext(action, params);
	});
})();

// ----------------------------
let bench2 = new Benchmarkify({ async: true, name: "Context.invoke with sync handler"});
(function() {


	let actions = broker.actions.get("users.find");
	let action = actions.get().data;
	let handler = () => {
		return [1,2,3];
	};

	let ctx = new Context({ broker, action });
	// ----

	bench2.add("call direct without invoke", () => {
		return Promise.resolve(handler(ctx));
	});

	bench2.add("call invoke", () => {
		return ctx.invoke(() => handler(ctx));
	});

})();

// ----------------------------
let bench3 = new Benchmarkify({ async: true, name: "Context.invoke with async handler"});
(function() {


	let actions = broker.actions.get("users.find");
	let action = actions.get().data;
	let handler = () => {
		return new Promise((resolve) => {
			resolve([1, 2, 3]);
		});
	};

	let ctx = new Context({ broker, action });
	// ----

	bench3.add("call direct without invoke", () => {
		return handler(ctx);
	});

	bench3.add("call invoke", () => {
		return ctx.invoke(() => handler(ctx));
	});

})();

bench1.run()
.then(() => bench2.run())
.then(() => bench3.run());

/*

=====================
  Context benchmark
=====================

Platform info:
==============
   Windows_NT 6.1.7601 x64
   Node.JS: 6.10.0
   V8: 5.1.281.93
   Intel(R) Core(TM) i7-4770K CPU @ 3.50GHz × 8

Suite: Context constructor
√ create without settings x 3,808,816 ops/sec ±0.21% (95 runs sampled)
√ create with settings x 3,738,465 ops/sec ±0.71% (95 runs sampled)
√ create with params x 3,712,849 ops/sec ±0.96% (94 runs sampled)
√ create subContext x 3,653,483 ops/sec ±0.72% (92 runs sampled)

   create without settings     0.00%   (3,808,816 ops/sec)
   create with settings       -1.85%   (3,738,465 ops/sec)
   create with params         -2.52%   (3,712,849 ops/sec)
   create subContext          -4.08%   (3,653,483 ops/sec)
-----------------------------------------------------------------------

Suite: Context.invoke with sync handler
√ call direct without invoke x 2,379,255 ops/sec ±1.05% (86 runs sampled)
√ call invoke x 939,990 ops/sec ±0.99% (86 runs sampled)

   call direct without invoke     0.00%   (2,379,255 ops/sec)
   call invoke                  -60.49%    (939,990 ops/sec)
-----------------------------------------------------------------------

Suite: Context.invoke with async handler
√ call direct without invoke x 1,225,058 ops/sec ±0.99% (88 runs sampled)
√ call invoke x 436,501 ops/sec ±0.83% (86 runs sampled)

   call direct without invoke     0.00%   (1,225,058 ops/sec)
   call invoke                  -64.37%    (436,501 ops/sec)
-----------------------------------------------------------------------           
                                                                                  


*/