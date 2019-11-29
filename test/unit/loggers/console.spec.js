/* eslint-disable no-console */
"use strict";

const kleur = require("kleur");
kleur.enabled = false;

const ConsoleLogger = require("../../../src/loggers/console");
const ServiceBroker = require("../../../src/service-broker");
const LoggerFactory = require("../../../src/logger-factory");

const lolex = require("lolex");

const broker = new ServiceBroker({ logger: false });

describe("Test Console logger class", () => {

	describe("Test Constructor", () => {

		it("should create with default options", () => {
			const logger = new ConsoleLogger();

			expect(logger.opts).toEqual({
				createLogger: null,
				level: "info",
				colors: true,
				moduleColors: false,
				formatter: "full",
				objectPrinter: null,
				autoPadding: false
			});
		});

		it("should create with custom options", () => {
			const logger = new ConsoleLogger({
				createLogger: jest.fn(),
				level: "debug",
				colors: false,
				formatter: "simple"
			});

			expect(logger.opts).toEqual({
				createLogger: expect.any(Function),
				level: "debug",
				colors: false,
				moduleColors: false,
				formatter: "simple",
				objectPrinter: null,
				autoPadding: false
			});
		});

	});

	describe("Test init method", () => {
		const loggerFactory = new LoggerFactory(broker);

		it("should init the logger", () => {
			const logger = new ConsoleLogger();

			logger.init(loggerFactory);

			expect(logger.objectPrinter).toBeInstanceOf(Function);
			expect(logger.levelColorStr).toEqual({
				"debug": "DEBUG",
				"error": "ERROR",
				"fatal": "FATAL",
				"info": "INFO ",
				"trace": "TRACE",
				"warn": "WARN ",
			});
			expect(logger.opts.moduleColors).toBe(false);

		});

		it("should init the logger with custom options", () => {
			const objectPrinter = jest.fn();
			const logger = new ConsoleLogger({
				moduleColors: true,
				objectPrinter
			});

			logger.init(loggerFactory);

			expect(logger.objectPrinter).toBe(objectPrinter);
			expect(logger.opts.moduleColors).toEqual(["cyan", "yellow", "green", "magenta", "red", "blue", "grey", "bold.cyan", "bold.yellow", "bold.green", "bold.magenta", "bold.red", "bold.blue", "bold.grey"]);

		});

	});

	describe("Test render method", () => {
		const loggerFactory = new LoggerFactory(broker);

		it("should return interpolated string", () => {
			const logger = new ConsoleLogger();

			logger.init(loggerFactory);

			expect(logger.render("[{timestamp}] {level} {nodeID}/{mod}: {msg}", {
				timestamp: "2019-09-07",
				level: "INFO",
				mod: "broker",
				nodeID: "server-1",
				msg: "Message"
			})).toBe("[2019-09-07] INFO server-1/broker: Message");

		});
	});

	describe("Test getNextColor method", () => {
		const loggerFactory = new LoggerFactory(broker);

		it("should return a default color for module name", () => {
			const logger = new ConsoleLogger({ moduleColors: true });

			logger.init(loggerFactory);

			expect(logger.getNextColor("broker")).toBe("yellow");
			expect(logger.getNextColor("registry")).toBe("bold.cyan");
			expect(logger.getNextColor("my-service")).toBe("bold.yellow");

			expect(logger.getNextColor("broker")).toBe("yellow");
			expect(logger.getNextColor("my-service")).toBe("bold.yellow");
		});

		it("should return the default grey color for module name if disabled", () => {
			const logger = new ConsoleLogger();

			logger.init(loggerFactory);

			expect(logger.getNextColor("broker")).toBe("grey");
			expect(logger.getNextColor("registry")).toBe("grey");
			expect(logger.getNextColor("my-service")).toBe("grey");

			expect(logger.getNextColor("broker")).toBe("grey");
			expect(logger.getNextColor("my-service")).toBe("grey");
		});

		it("should return a custom color for module name", () => {
			const logger = new ConsoleLogger({ moduleColors: ["magenta", "green", "red", "blue"] });

			logger.init(loggerFactory);

			expect(logger.getNextColor("broker")).toBe("blue");
			expect(logger.getNextColor("registry")).toBe("blue");
			expect(logger.getNextColor("my-service")).toBe("magenta");

			expect(logger.getNextColor("broker")).toBe("blue");
			expect(logger.getNextColor("my-service")).toBe("magenta");
		});

	});

	describe("Test getLogHandler method", () => {
		const loggerFactory = new LoggerFactory(broker);
		console.error = jest.fn();
		console.warn = jest.fn();
		console.log = jest.fn();

		it("should create a child logger", () => {
			const logger = new ConsoleLogger({ level: "trace" });
			logger.init(loggerFactory);
			logger.getFormatter = jest.fn(() => (type, args) => args);

			const logHandler = logger.getLogHandler({ mod: "my-service", nodeID: "node-1" });
			expect(logHandler).toBeInstanceOf(Function);
			expect(logger.getFormatter).toHaveBeenCalledTimes(1);
			expect(logger.getFormatter).toHaveBeenCalledWith({ mod: "my-service", nodeID: "node-1" });

			logHandler("fatal", ["message", { a: 5 }]);
			expect(console.error).toHaveBeenCalledTimes(1);
			expect(console.error).toHaveBeenCalledWith("message", { a: 5 });

			console.error.mockClear();
			logHandler("error", ["message", { a: 5 }]);
			expect(console.error).toHaveBeenCalledTimes(1);
			expect(console.error).toHaveBeenCalledWith("message", { a: 5 });

			console.warn.mockClear();
			logHandler("warn", ["message", { a: 5 }]);
			expect(console.warn).toHaveBeenCalledTimes(1);
			expect(console.warn).toHaveBeenCalledWith("message", { a: 5 });

			console.log.mockClear();
			logHandler("info", ["message", { a: 5 }]);
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith("message", { a: 5 });

			console.log.mockClear();
			logHandler("debug", ["message", { a: 5 }]);
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith("message", { a: 5 });

			console.log.mockClear();
			logHandler("trace", ["message", { a: 5 }]);
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith("message", { a: 5 });
		});

		it("should not call console if level is lower", () => {
			const logger = new ConsoleLogger({ level: "info" });
			logger.init(loggerFactory);
			logger.getFormatter = jest.fn(() => (type, args) => args);

			const logHandler = logger.getLogHandler({ mod: "my-service", nodeID: "node-1" });
			expect(logHandler).toBeInstanceOf(Function);
			expect(logger.getFormatter).toHaveBeenCalledTimes(1);
			expect(logger.getFormatter).toHaveBeenCalledWith({ mod: "my-service", nodeID: "node-1" });

			console.error.mockClear();
			logHandler("fatal", ["message", { a: 5 }]);
			expect(console.error).toHaveBeenCalledTimes(1);
			expect(console.error).toHaveBeenCalledWith("message", { a: 5 });

			console.error.mockClear();
			logHandler("error", ["message", { a: 5 }]);
			expect(console.error).toHaveBeenCalledTimes(1);
			expect(console.error).toHaveBeenCalledWith("message", { a: 5 });

			console.warn.mockClear();
			logHandler("warn", ["message", { a: 5 }]);
			expect(console.warn).toHaveBeenCalledTimes(1);
			expect(console.warn).toHaveBeenCalledWith("message", { a: 5 });

			console.log.mockClear();
			logHandler("info", ["message", { a: 5 }]);
			expect(console.log).toHaveBeenCalledTimes(1);
			expect(console.log).toHaveBeenCalledWith("message", { a: 5 });

			console.log.mockClear();
			logHandler("debug", ["message", { a: 5 }]);
			expect(console.log).toHaveBeenCalledTimes(0);

			console.log.mockClear();
			logHandler("trace", ["message", { a: 5 }]);
			expect(console.log).toHaveBeenCalledTimes(0);
		});

		it("should not create child logger if level is null", () => {
			const logger = new ConsoleLogger();
			logger.init(loggerFactory);

			logger.getLogLevel = jest.fn();

			const logHandler = logger.getLogHandler({ mod: "my-service", nodeID: "node-1" });
			expect(logHandler).toBeNull();
			expect(logger.getLogLevel).toHaveBeenCalledTimes(1);
			expect(logger.getLogLevel).toHaveBeenCalledWith("my-service");
		});

		it("should not create child logger if bindings is null", () => {
			const logger = new ConsoleLogger();
			logger.init(loggerFactory);

			logger.getLogLevel = jest.fn();

			const logHandler = logger.getLogHandler();
			expect(logHandler).toBeNull();
			expect(logger.getLogLevel).toHaveBeenCalledTimes(0);
		});

	});

	describe("Test getFormatter method", () => {
		const loggerFactory = new LoggerFactory(broker);


		let clock;

		beforeAll(() => {
			clock = lolex.install({ now: 1234567899990 });
		});

		afterAll(() => {
			clock.uninstall();
		});

		describe("Test getFormatter method without padding ", () => {
			it("should create default full formatter", () => {
				const logger = new ConsoleLogger({ level: "trace" });
				logger.init(loggerFactory);

				const formatter = logger.getFormatter({ mod: "my-service", nodeID: "node-1" });
				expect(formatter("debug", ["message", { a: 5 }])).toEqual(["[2009-02-13T23:31:39.990Z]", "DEBUG", "node-1/MY-SERVICE:", "message", "{ a: 5 }"]);
			});

			it("should create simple formatter", () => {
				const logger = new ConsoleLogger({ level: "trace", formatter: "simple" });
				logger.init(loggerFactory);

				const formatter = logger.getFormatter({ mod: "my-service", nodeID: "node-1" });
				expect(formatter("debug", ["message", { a: 5 }])).toEqual(["DEBUG", "-", "message", "{ a: 5 }"]);
			});

			it("should create short formatter", () => {
				const logger = new ConsoleLogger({ level: "trace", formatter: "short" });
				logger.init(loggerFactory);

				const formatter = logger.getFormatter({ mod: "my-service", nodeID: "node-1" });
				expect(formatter("debug", ["message", { a: 5 }])).toEqual(["[23:31:39.990Z]", "DEBUG", "MY-SERVICE:", "message", "{ a: 5 }"]);
			});

			it("should create json formatter", () => {
				const logger = new ConsoleLogger({ level: "trace", formatter: "json" });
				logger.init(loggerFactory);

				const formatter = logger.getFormatter({ mod: "my-service", nodeID: "node-1" });
				expect(formatter("debug", ["message", { a: 5 }])).toEqual(["{\"ts\":1234567899990,\"level\":\"debug\",\"msg\":\"message { a: 5 }\",\"mod\":\"my-service\",\"nodeID\":\"node-1\"}"]);
			});

			it("should create a custom template formatter", () => {
				const logger = new ConsoleLogger({ level: "trace", formatter: "[{time}] {level} <{nodeID}:{mod}> ->" });
				logger.init(loggerFactory);

				const formatter = logger.getFormatter({ mod: "my-service", nodeID: "node-1" });
				expect(formatter("debug", ["message", { a: 5 }])).toEqual([
					"[23:31:39.990Z] DEBUG <node-1:MY-SERVICE> ->",
					"message",
					"{ a: 5 }"
				]);
			});

			it("should use custom formatter", () => {
				const myFormatter = jest.fn((type, args, bindings) => args);
				const logger = new ConsoleLogger({ level: "trace", formatter: myFormatter });
				logger.init(loggerFactory);

				const formatter = logger.getFormatter({ mod: "my-service", nodeID: "node-1" });
				expect(formatter("debug", ["message", { a: 5 }])).toEqual(["message", { a: 5 }]);
				expect(myFormatter).toHaveBeenCalledTimes(1);
				expect(myFormatter).toHaveBeenCalledWith("debug", ["message", { a: 5 }], { mod: "my-service", nodeID: "node-1" });
			});

		});

		describe("Test getFormatter method with autoPadding", () => {
			it("should create default formatter", () => {
				const logger = new ConsoleLogger({ level: "trace", autoPadding: true });
				logger.init(loggerFactory);

				const formatter = logger.getFormatter({ mod: "my-service", nodeID: "node-1" });
				expect(formatter("debug", ["message", { a: 5 }])).toEqual(["[2009-02-13T23:31:39.990Z]", "DEBUG", "node-1/MY-SERVICE:", "message", "{ a: 5 }"]);

				const formatter2 = logger.getFormatter({ mod: "short", nodeID: "n-2" });
				expect(formatter2("debug", ["message2"])).toEqual(["[2009-02-13T23:31:39.990Z]", "DEBUG", "n-2/SHORT        :", "message2"]);
			});

			it("should create short formatter", () => {
				const logger = new ConsoleLogger({ level: "trace", formatter: "short", autoPadding: true });
				logger.init(loggerFactory);

				const formatter = logger.getFormatter({ mod: "my-service", nodeID: "node-1" });
				expect(formatter("debug", ["message", { a: 5 }])).toEqual(["[23:31:39.990Z]", "DEBUG", "MY-SERVICE:", "message", "{ a: 5 }"]);

				const formatter2 = logger.getFormatter({ mod: "short", nodeID: "n-2" });
				expect(formatter2("debug", ["message2"])).toEqual(["[23:31:39.990Z]", "DEBUG", "SHORT     :", "message2"]);
			});
		});

		describe("Test getFormatter objectPrinter", () => {

			it("should use the default objectPrinter", () => {
				const logger = new ConsoleLogger({});
				logger.init(loggerFactory);

				const formatter = logger.getFormatter({ mod: "my-service", nodeID: "node-1" });
				expect(formatter("debug", ["message", { a: 5 }, ["John", "Doe"], true, 123])).toEqual(["[2009-02-13T23:31:39.990Z]", "DEBUG", "node-1/MY-SERVICE:", "message", "{ a: 5 }", "[ 'John', 'Doe' ]", true, 123]);
			});

			it("should use a custom objectPrinter", () => {
				const objectPrinter = jest.fn(() => "printed");
				const logger = new ConsoleLogger({ objectPrinter });
				logger.init(loggerFactory);

				const formatter = logger.getFormatter({ mod: "my-service", nodeID: "node-1" });
				expect(formatter("debug", ["message", { a: 5 }, ["John", "Doe"], true, 123])).toEqual(["[2009-02-13T23:31:39.990Z]", "DEBUG", "node-1/MY-SERVICE:", "message", "printed", "printed", true, 123]);

				expect(objectPrinter).toHaveBeenCalledTimes(2);
				expect(objectPrinter).toHaveBeenCalledWith({ a: 5 });
				expect(objectPrinter).toHaveBeenCalledWith(["John", "Doe"]);
			});
		});

	});

});
