"use strict";

const BalancedList = require("../src/balanced-list");

describe("Test BalancedList", () => {

	it("test constructor", () => {
		let opts = {
			mode: 1,
			preferLocal: false
		};
		let list = new BalancedList(opts);
		expect(list).toBeDefined();
		expect(list.list).toBeDefined();
		expect(list.opts).toBe(opts);
		expect(list.counter).toBe(0);

		expect(list.get()).toBeNull();
		expect(list.hasLocal()).toBeFalsy();
	});

	it("test get with remote & preferLocal", () => {
		let obj1 = {};
		let obj2 = {};
		let obj3 = {};
		let list = new BalancedList();
		list.add(obj1, 0, "node"); // remote
		list.add(obj2, 20, "node"); // remote
		list.add(obj3, 0); // local

		expect(list.hasLocal()).toBeTruthy();
		expect(list.counter).toBe(0);
		let item = list.get();
		expect(item.local).toBeTruthy();
		expect(item.nodeID).toBeUndefined();
		expect(item.data).toBe(obj3);
		expect(list.counter).toBe(0);
		expect(list.get().data).toBe(obj3);
		expect(list.counter).toBe(0);
		
		list.remove(obj3);
		expect(list.get().data).toBe(obj1);
		expect(list.counter).toBe(1);
		expect(list.get().data).toBe(obj2);
		expect(list.counter).toBe(2);
		expect(list.get().data).toBe(obj1);
		expect(list.counter).toBe(1);
		expect(list.hasLocal()).toBeFalsy();
	
	});

	it("test get with remote & NOT preferLocal", () => {
		let obj1 = {};
		let obj2 = {};
		let obj3 = {};
		let list = new BalancedList({ preferLocal: false});
		list.add(obj1, 0, "node");
		list.add(obj2, 20, "node");
		list.add(obj3, 0); // local
		expect(list.hasLocal()).toBeTruthy();

		expect(list.counter).toBe(0);
		let item = list.get();
		expect(item.local).toBeFalsy();
		expect(item.nodeID).toBe("node");
		expect(item.data).toBe(obj1);
		expect(list.counter).toBe(1);
		expect(list.get().data).toBe(obj2);
		expect(list.counter).toBe(2);
		expect(list.get().data).toBe(obj3);
		expect(list.counter).toBe(3);
		
		list.remove(obj1);
		expect(list.get().data).toBe(obj2);
		expect(list.counter).toBe(1);
		expect(list.get().data).toBe(obj3);
		expect(list.counter).toBe(2);
	
	});


	it("test add & get with local", () => {
		let obj1 = {};
		let obj2 = {};
		let list = new BalancedList();
		list.add(obj1);
		list.add(obj2, 20);
		expect(list.counter).toBe(0);
		let item = list.get();
		expect(item.local).toBeTruthy();
		expect(item.nodeID).toBeUndefined();
		expect(item.data).toBe(obj1);
		expect(list.counter).toBe(0);
		expect(list.get().data).toBe(obj1);
		expect(list.counter).toBe(0);
		expect(list.hasLocal()).toBeTruthy();
		
		list.remove(obj1);
		expect(list.get().data).toBe(obj2);
		expect(list.counter).toBe(0);
		expect(list.get().data).toBe(obj2);
		expect(list.counter).toBe(0);
	
	});

});
