const ServiceBroker = require("../../src/service-broker");
const { ValidationError } = require("../../src/errors");

describe("Test broker validator with actions", () => {

	let schema = {
		name: "test",
		actions: {
			withValidation: {
				params: {
					a: "required|numeric",
					b: "required|numeric"
				},
				handler: jest.fn(ctx => 123)
			},
			withoutValidation: {
				handler() {}
			}
		}
	};

	const broker = new ServiceBroker();
	const service = broker.createService(schema);
	broker.validator.validate = jest.fn();

	it("shouldn't wrap validation, if action can't contain params settings", () => {
		return broker.call("test.withoutValidation")
		.then(res => {
			expect(broker.validator.validate).toHaveBeenCalledTimes(0);
		});
	});

	it.skip("should wrap validation, if action contains params settings", () => {
		broker.validator.validate.mockClear();
		let p = { a: 5, b: 10 };
		return broker.call("test.withValidation", p)
		.then(res => {
			expect(broker.validator.validate).toHaveBeenCalledTimes(1);
			expect(broker.validator.validate).toHaveBeenCalledWith(schema.actions.withValidation.params, p);
			expect(schema.actions.withValidation.handler).toHaveBeenCalledTimes(1);
		});
	});

	it("should call handler, if params are correct", () => {
		schema.actions.withValidation.handler.mockClear();
		let p = { a: 5, b: 10 };
		return broker.call("test.withValidation", p)
		.then(res => {
			expect(res).toBe(123);
			expect(schema.actions.withValidation.handler).toHaveBeenCalledTimes(1);
		});
	});

	it("should throw ValidationError, if params is not correct", () => {
		schema.actions.withValidation.handler.mockClear();
		let p = { a: 5, b: "asd" };
		return broker.call("test.withValidation", p)
		.catch(err => {
			expect(err).toBeInstanceOf(ValidationError);
			expect(schema.actions.withValidation.handler).toHaveBeenCalledTimes(0);
		});
	});

	it.skip("should wrap validation, if call action directly", () => {
		broker.validator.validate.mockClear();
		let p = { a: 5, b: 10 };
		return service.actions.withValidation(p)
		.then(res => {
			expect(broker.validator.validate).toHaveBeenCalledTimes(1);
			expect(broker.validator.validate).toHaveBeenCalledWith(schema.actions.withValidation.params, p);
		});
	});
});