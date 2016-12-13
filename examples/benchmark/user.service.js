let _ = require("lodash");
let fakerator = require("fakerator")();

let Service = require("../../src/service");

module.exports = function(broker) {
	let users = fakerator.times(fakerator.entity.user, 10);

	_.each(users, (user, i) => user.id = i);

	return new Service(broker, {
		name: "users",
		actions: {
			find(ctx) {
				ctx.service.counter += 1;
				ctx.log("find users");
				return ctx.result(users);
			},

			get(ctx) {
				ctx.service.counter += 1;
				ctx.log("get user");
				return ctx.result(_.find(users, user => user.id == ctx.params.id));
			}
		}
	});
};
