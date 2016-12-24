const utils = require("../../src/utils");
const ServiceBroker = require("../../src/service-broker");
const MemoryCacher = require("../../src/cachers/memory");

describe("Test MemoryCacher constructor", () => {

	it("should create an empty options", () => {
		let cacher = new MemoryCacher();
		expect(cacher).toBeDefined();
		expect(cacher.opts).toBeDefined();
		expect(cacher.opts.ttl).toBeNull();
	});

	it("should create a timer if set ttl option", () => {
		let opts = { prefix: "TEST", ttl: 500 };
		let cacher = new MemoryCacher(opts);
		expect(cacher).toBeDefined();
		expect(cacher.opts).toEqual(opts);
		expect(cacher.prefix).toBe("TEST");
		expect(cacher.opts.ttl).toBe(500);
		expect(cacher.timer).toBeDefined();
	});

});

describe("Test MemoryCacher set & get", () => {

	let broker = new ServiceBroker();
	let cacher = new MemoryCacher();
	cacher.init(broker); // for empty logger

	let key = "tst123";
	let data1 = {
		a: 1,
		b: false,
		c: "Test",
		d: {
			e: 55
		}
	};

	it("should save the data with key", () => {
		let p = cacher.set(key, data1);
		expect(utils.isPromise(p)).toBeTruthy();
	});

	it("should give back the data by key", () => {
		let p = cacher.get(key);
		expect(utils.isPromise(p)).toBeTruthy();
		return p.then((obj) => {
			expect(obj).toBeDefined();
			expect(obj).toEqual(data1);
		});
	});

	it("should give null if key not exist", () => {
		let p = cacher.get("123123");
		expect(utils.isPromise(p)).toBeTruthy();
		return p.then((obj) => {
			expect(obj).toBeNull();
		});
	});

});

describe("Test MemoryCacher delete", () => {

	let broker = new ServiceBroker();
	let cacher = new MemoryCacher();
	cacher.init(broker); // for empty logger

	let key = "tst123";
	let data1 = {
		a: 1,
		b: false,
		c: "Test",
		d: {
			e: 55
		}
	};

	it("should save the data with key", () => {
		return cacher.set(key, data1);
	});

	it("should delete the key", () => {
		let p = cacher.del(key);
		expect(utils.isPromise(p)).toBeTruthy();
		return p;
	});

	it("should give null", () => {
		let p = cacher.get(key);
		expect(utils.isPromise(p)).toBeTruthy();
		return p.then((obj) => {
			expect(obj).toBeNull();
		});
	});

});

describe("Test MemoryCacher clean without prefix", () => {

	let broker = new ServiceBroker();
	let cacher = new MemoryCacher({});
	cacher.init(broker); // for empty logger

	let key1 = "tst123";
	let key2 = "posts123";
	let data1 = {
		a: 1,
		b: false,
		c: "Test",
		d: {
			e: 55
		}
	};
	let data2 = "Data2";

	it("should save the data with key", () => {
		return cacher.set(key1, data1).then(() => {
			return cacher.set(key2, data2);
		});
	});

	it("should give item in cache for keys", () => {
		expect(cacher.cache[key1]).toBeDefined();
		expect(cacher.cache[key2]).toBeDefined();
	});	

	it("should clean test* keys", () => {
		let p = cacher.clean("tst*");
		expect(utils.isPromise(p)).toBeTruthy();
		return p;
	});

	it("should give null for key1", () => {
		let p = cacher.get(key1);
		expect(utils.isPromise(p)).toBeTruthy();
		return p.then((obj) => {
			expect(obj).toBeNull();
		});
	});

	it("should give back data 2 for key2", () => {
		let p = cacher.get(key2);
		expect(utils.isPromise(p)).toBeTruthy();
		return p.then((obj) => {
			expect(obj).toEqual(data2);
		});
	});

	it("should clean all keys", () => {
		let p = cacher.clean();
		expect(utils.isPromise(p)).toBeTruthy();
		return p;
	});

	it("should give null for key2 too", () => {
		let p = cacher.get(key1);
		expect(utils.isPromise(p)).toBeTruthy();
		return p.then((obj) => {
			expect(obj).toBeNull();
		});
	});

});

describe("Test MemoryCacher clean wit prefix", () => {
	let prefix = "devices:get:";

	let broker = new ServiceBroker();
	let cacher = new MemoryCacher({
		prefix
	});
	cacher.init(broker); // for empty logger

	let key1 = "tst123";
	let key2 = "posts123";
	let data1 = {
		a: 1,
		b: false,
		c: "Test",
		d: {
			e: 55
		}
	};
	let data2 = "Data2";

	it("should save the data with key", () => {
		return cacher.set(key1, data1).then(() => {
			return cacher.set(key2, data2);
		});
	});

	it("should give item in cache for keys", () => {
		expect(cacher.cache[prefix + key1]).toBeDefined();
		expect(cacher.cache[prefix + key2]).toBeDefined();
	});	

	it("should clean test* keys", () => {
		let p = cacher.clean("tst*");
		expect(utils.isPromise(p)).toBeTruthy();
		return p;
	});

	it("should give null for key1", () => {
		let p = cacher.get(key1);
		expect(utils.isPromise(p)).toBeTruthy();
		return p.then((obj) => {
			expect(obj).toBeNull();
		});
	});

	it("should give back data 2 for key2", () => {
		let p = cacher.get(key2);
		expect(utils.isPromise(p)).toBeTruthy();
		return p.then((obj) => {
			expect(obj).toEqual(data2);
		});
	});

	it("should clean all keys", () => {
		let p = cacher.clean();
		expect(utils.isPromise(p)).toBeTruthy();
		return p;
	});

	it("should give null for key2 too", () => {
		let p = cacher.get(key1);
		expect(utils.isPromise(p)).toBeTruthy();
		return p.then((obj) => {
			expect(obj).toBeNull();
		});
	});

});

describe("Test MemoryCacher expired method", () => {

	let broker = new ServiceBroker();
	let cacher = new MemoryCacher({
		ttl: 60
	});
	cacher.init(broker); // for empty logger

	let key1 = "tst123";
	let key2 = "posts123";
	let data1 = {
		a: 1,
		b: false,
		c: "Test",
		d: {
			e: 55
		}
	};
	let data2 = "Data2";

	it("should save the data with key", () => {
		return cacher.set(key1, data1).then(() => {
			return cacher.set(key2, data2);
		});
	});

	it("should set expire to item", () => {
		expect(cacher.cache[key1].expire).toBeDefined();
		expect(cacher.cache[key1].expire).toBeGreaterThan(Date.now());

		cacher.cache[key1].expire = Date.now() - 10 * 1000;
		cacher.checkTTL();
	});

	it("should give null for key1", () => {
		let p = cacher.get(key1);
		expect(utils.isPromise(p)).toBeTruthy();
		return p.then((obj) => {
			expect(obj).toBeNull();
		});
	});

	it("should give back data 2 for key2", () => {
		let p = cacher.get(key2);
		expect(utils.isPromise(p)).toBeTruthy();
		return p.then((obj) => {
			expect(obj).toEqual(data2);
		});
	});

});
