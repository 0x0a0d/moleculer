"use strict";

module.exports = function middleware(globalOptions) {
	return function wrapReplyMiddleware(handler, action) {
		// Merge retryPolicy from action option with broker options
		const policy = Object.assign({}, globalOptions, action.retryPolicy || {});
		if (policy.enabled) {
			return function retryMiddleware(ctx) {
				const attempts = ctx.retries ? ctx.retries : policy.retries;
				if (ctx._retryAttempts == null)
					ctx._retryAttempts = 0;

				// Call the handler
				return handler(ctx).catch(err => {
					if (ctx._retryAttempts++ < attempts && policy.check(err)) {
						// Retry call
						const actionName = ctx.action.name;

						// Calculate next delay
						const delay = Math.min(policy.delay * Math.pow(policy.factor, ctx._retryAttempts - 1), policy.maxDelay);

						this.logger.warn(`Retry to call '${actionName}' action after ${delay} ms...`, { requestID: ctx.requestID, attempts: ctx._retryAttempts });

						// Wait & recall
						return this.Promise.delay(delay)
							.then(() => this.call(actionName, ctx.params, { ctx }));
					}

					// Throw error
					return Promise.reject(err);
				});
			}.bind(this);
		}

		return handler;
	};
};
