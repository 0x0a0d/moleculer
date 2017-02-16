<!--
 ![Servicer logo](docs/assets/logo-servicer.png)

[![Build Status](https://travis-ci.org/icebob/servicer.svg?branch=master)](https://travis-ci.org/icebob/servicer)
[![Coverage Status](https://coveralls.io/repos/github/icebob/ice-services/badge.svg?branch=master)](https://coveralls.io/github/icebob/ice-services?branch=master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/1b087e280c784a48afe91cb388879786)](https://www.codacy.com/app/mereg-norbert/servicer?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=icebob/servicer&amp;utm_campaign=Badge_Grade)
[![Code Climate](https://codeclimate.com/github/icebob/servicer/badges/gpa.svg)](https://codeclimate.com/github/icebob/servicer)
[![David](https://img.shields.io/david/icebob/servicer.svg)](https://david-dm.org/icebob/servicer)
[![Known Vulnerabilities](https://snyk.io/test/github/icebob/servicer/badge.svg)](https://snyk.io/test/github/icebob/servicer)
-->
# servicer
Servicer is a fast & powerful microservices framework for NodeJS (>= v6.x).
<!--
![](https://img.shields.io/badge/performance-%2B50%25-brightgreen.svg)
![](https://img.shields.io/badge/performance-%2B5%25-green.svg)
![](https://img.shields.io/badge/performance---10%25-yellow.svg)
![](https://img.shields.io/badge/performance---42%25-red.svg)
-->
**Under heavy development! Please don't use in production environment currently!**

# What's included

- multiple services on a node/server
- built-in caching solution (memory, redis)
- request-reply concept
- event bus system
- support middlewares
- load balanced calls (round-robin, random)
- every nodes are equal, no master/leader node
- auto discovery services
- parameter validation
- request timeout handling with fallback response
- Promise based methods
- health monitoring & statistics
- support versioned services (you can run different versions of the same service at the same time)


# Installation
```
$ npm install servicer --save
```

or

```
$ yarn add servicer
```

# Usage

### Simple service with actions & call actions locally
```js
"use strict";

const { ServiceBroker, Service } = require("servicer");

// Create broker
let broker = new ServiceBroker({ 
    logger: console 
});

// Create a service
broker.createService({
    name: "math",
    actions: {
        // You can call it as broker.call("math.add")
        add(ctx) {
            return Number(ctx.params.a) + Number(ctx.params.b);
        },

        // You can call it as broker.call("math.sub")
        sub(ctx) {
            return Number(ctx.params.a) - Number(ctx.params.b);
        }
    }
});

// Start broker
broker.start();

// Call actions of service
broker.call("math.add", { a: 5, b: 3 })
    .then(res => console.log("5 + 3 =", res));

// Call actions with error handling
broker.call("math.sub", { a: 9, b: 2 })
    .then(res => console.log("9 - 2 =", res));
    .catch(err => console.error(`Error occured! ${err.message}`));

// Chain calls
broker.call("math.add", { a: 3, b: 5})
    .then(res => broker.call("math.sub", { a: res, b: 2 }));
    .then(res => console.log("3 + 5 - 2 =", res));
```

# Main modules

## ServiceBroker
The `ServiceBroker` is the main component of Servicer. It handles services & events, calls actions and communicates with remote nodes. You need to create an instance of `ServiceBroker` on every node.

### Create broker
```js
// Create broker with default settings
let broker = new ServiceBroker();

// Create broker with custom settings
let broker = new ServiceBroker({
    logger: console,
    logLevel: "info"
});

// Create with transporter
let { NatsTransporter } = require("servicer");
let broker = new ServiceBroker({
    nodeID: "node-1",
    transporter: new NatsTransporter(),
    logger: console,
    logLevel: "debug",
    requestTimeout: 5 * 1000,
    requestRetry: 3
});

// Create with cacher
let MemoryCacher = require("servicer").Cachers.Memory;
let broker = new ServiceBroker({
    cacher: new MemoryCacher(),
    logger: console,
    logLevel: {
        "*": "warn", // global log level for every modules
        "CAHER": "debug" // custom log level for cacher modules
    }
});    
```

### Constructor options
All available options:
```js
{
    nodeID: null,

    logger: null,
    logLevel: "info",

    transporter: null,
    requestTimeout: 15 * 1000,
    requestRetry: 0,
    sendHeartbeatTime: 10,
    nodeHeartbeatTimeout: 30,

    cacher: null,

    metrics: false,
    metricsNodeTime: 5 * 1000,
    statistics: false,
    validation: true,
    internalActions: true
    
    ServiceFactory: null,
    ContextFactory: null
}
```

| Name | Type | Default | Description |
| ------- | ----- | ------- | ------- |
| `nodeID` | `String` | Computer name | This is the ID of node. It's important to communication when you have 2 or more nodes. |
| `logger` | `Object` | `null` | Logger class. Under development or test you can set to `console`. In production you can set an external logger e.g. `winston` |
| `logLevel` | `String` or `Object` | `info` | Level of logging (debug, info, warn, error) |
| `transporter` | `Object` | `null` | Instance of transporter. Need if you have 2 or more nodes. Internal transporters: [NatsTransporter](#nats-transporter)  |
| `requestTimeout` | `Number` | `15000` | Timeout of request in milliseconds. If the request is timed out, broker will throw a `RequestTimeout` error. Disable: 0 |
| `requestRetry` | `Number` | `0` | Count of retry of request. If the request is timed out, broker will try to call again. |
| `cacher` | `Object` | `null` | Instance of cacher. Built-in cachers: [MemoryCacher](#memory-cacher) or [RedisCacher](#redis-cacher) |
| `metrics` | `Boolean` | `false` | Enable [metrics](#metrics) function. |
| `metricsNodeTime` | `Number` | `5000` | Metrics event send period in milliseconds |
| `statistics` | `Boolean` | `false` | Enable broker [statistics](). Measure the requests count & latencies |
| `validation` | `Boolean` | `false` | Enable action [parameters validation](). |
| `internalActions` | `Boolean` | `true` | Register internal actions for metrics & statistics functions |
| `sendHeartbeatTime` | `Number` | `10` | ??? |
| `nodeHeartbeatTimeout` | `Number` | `30` | ??? |
| `ServiceFactory` | `Class` | `null` | Custom Service class. Broker will use it when create a service |
| `ContextFactory` | `Class` | `null` | Custom Context class. Broker will use it when create a context at call |

## Call actions
You can call an action with the `broker.call` method. Broker will search which service (and which node) has the action and call it. The function returns with a Promise.

### Syntax
```js
    let promise = broker.call(actionName, params, opts);
```
The `actionName` is a dot-separated string. First part is the name of service. Seconds part is the name of action. So if you have a `posts` service which contains a `create` action, you need to use `posts.create` string as first parameter.

The `params` is an object, which pass to the action in a [Context](#context)

The `opts` is an object. With this, you can set/override some request parameters, e.g.: `timeout`, `retryCount`

Available options:

| Name | Type | Default | Description |
| ------- | ----- | ------- | ------- |
| `timeout` | `Number` | `requestTimeout of broker` | Timeout of request in milliseconds. If the request is timed out and don't define `fallbackResponse`, broker will throw a `RequestTimeout` error. Disable: 0 |
| `retryCount` | `Number` | `requestRetry of broker` | Count of retry of request. If the request timed out, broker will try to call again. |
| `fallbackResponse` | `Any` | `null` | Return with it, if the request is timed out. [More info](#request-timeout-fallback-response) |


### Usage
```js
// Call without params
broker.call("user.list").then(res => console.log("User list: ", res));

// Call with params
broker.call("user.get", { id: 3 }).then(res => console.log("User: ", res));

// Call with options
broker.call("recommendation", { limit: 5 }, { timeout: 500, fallbackResponse: defaultRecommendation })
    .then(res => console.log("Result: ", res));

// Call with error handling
broker.call("posts.update", { id: 2, name: "New post" })
    .then(res => console.log("Post updated!"))
    .catch(err => console.error("Unable to update Post!", err));    
```

### Request timeout & fallback response
If you call action with timeout and the request is timed out, broker throws a `RequestTimeoutError` error.
But if you set `fallbackResponse` in calling options, broker won't throw error, instead return with this value. It can be an `Object`, `Array`...etc. 
This can be also a `Function`, which returns a `Promise`. The broker will pass the current `Context` to this function as argument.

## Emit events
Broker has an internal event bus. You can send events to local & global.

### Send event
You can send event with `emit` and `emitLocal` functions. First parameter is the name of event. Second parameter is the payload. 

```js
// Emit a local event. Only receive the local services
broker.emitLocal("service.started", { service: service, version: 1 });

// Emit a global event. It will be send to all nodes via transporter. 
// The `user` will be serialized with JSON.stringify
broker.emit("user.created", user);
```

### Subscribe to events
For subscribe for events use the `on`, `once` methods. Or in [Service](#service) use the `events` property.
In event names you can use wildcards too.

```js
// Subscribe to `user.created` event
broker.on("user.created", user => console.log("User created:", user));

// Subscribe to `user` events
broker.on("user.*", user => console.log("User event:", user));

// Subscribe to all events
broker.on("**", payload => console.log("Event:", payload));    
```

For unsubscribe use the `off` method.

## Middlewares
Broker supports middlewares. You can add your custom middleware, and it'll be called on every local request. The middleware is a `Function` what returns a wrapped action handler. 

Example middleware from validators modules:
```js
return function validatorMiddleware(handler, action) {
    // Wrap a param validator
    if (_.isObject(action.params)) {
        return ctx => {
            this.validate(action.params, ctx.params);
            return handler(ctx);
        };
    }
    return handler;
}.bind(this);
```

The `handler` is the handler of action, what is defined in Service schema. The `action` is the action object from Service schema. The middleware should return with the `handler` or a new wrapped handler. In this example above, we check the action has a `params` props. If yes, we wrap the handler. Create a new handler, what calls the validator function and calls the original `handler`. 
If no `params` prop, we return the original `handler`.

If you don't call the original `handler`, it will break the request. You can use it in cachers. If you find the data in cache, don't call the handler, instead return the cached data.

If you would like to do something with response after the success request, use the `ctx.after` function.

Example code from cacher middleware:
```js
return (handler, action) => {
    return function cacherMiddleware(ctx) {
        const cacheKey = this.getCacheKey(action.name, ctx.params, action.cache.keys);
        const content = this.get(cacheKey);
        if (content != null) {
            // Found in the cache! Don't call handler, return with the context
            ctx.cachedResult = true;
            return content;
        }

        // Call the handler
        return ctx.after(handler(ctx), result => {
            // Save the response to the cache
            this.set(cacheKey, result);

            return result;
        });
    }.bind(this);
};
```

## Internal actions
The broker register some internal actions to check health of node or get request statistics.

### List of local services
This action lists name of local services.
```js
broker.call("$node.services").then(res => console.log(res));
```

### List of local actions
This action lists name of local actions
```js
broker.call("$node.actions").then(res => console.log(res));
```

### List of nodes
This actions lists all connected nodes.
```js
broker.call("$node.list").then(res => console.log(res));
```

### Health of node
This action returns the health info of process & OS.
```js
broker.call("$node.health").then(res => console.log(res));
```

### Statistics
This action returns the request statistics if the `statistics` is enabled in options.
```js
broker.call("$node.stats").then(res => console.log(res));
```

# Service
The Service is the other main module in the Servicer. With this you can define actions.

## Schema
You need to create a schema to define a service. The schema has some fix parts (name, version, settings, actions, methods, events).

### Example service schema
```js
{
	name: "math",
	actions: {
		add(ctx) {
			return Number(ctx.params.a) + Number(ctx.params.b);
		},

		sub(ctx) {
			return Number(ctx.params.a) - Number(ctx.params.b);
		}
	}
}
```

## Main properties
The Service has some main properties in the schema.
```js
{
    name: "posts",
    version: 1
}
```
The `name` is a required property. It must define. It's the first part of actionName when you call with `broker.call`.

The `version` is an optional property. If you running multiple version of a service, it needs to set. It will be a prefix in the actionName. For example:
```js
{
    name: "posts",
    version: 2,
    actions: {
        find() {...}
    }
}
```
You can call the `find` action as
```js
broker.call("v2.posts.find");
```

## Settings
You can add custom settings to your service under `settings` property in schema. You can reach it in service via `this.settings`.

```js
{
    name: "mailer",
    settings: {
        transport: "mailgun"
    },

    action: {
        send(ctx) {
            if (this.settings.transport == "mailgun") {
                ...
            }
        }
    }
}
```

## Actions
The actions are the callable/published methods of service. They can be called with `broker.call`.
The action could be a function (handler) or an object with some properties and with handler.
The actions should be placed under `actions` key in the service schema.

```js
{
	name: "math",
	actions: {
        // Simple action, only define a handler
		add(ctx) {
			return Number(ctx.params.a) + Number(ctx.params.b);
		},

        // Complex action, they set other properties. In this case
        // the `handler` property is required!
		mult: {
            cache: false,
			params: {
				a: "required|numeric",
				b: "required|numeric"
			},
			handler(ctx) {
                // You can reach action params with `ctx.action.*`
                if (ctx.action.cache)
				    return Number(ctx.params.a) * Number(ctx.params.b);
			}
		}
	}
}
```
You can call this actions as
```js
broker.call("math.add", { a: 5, b: 7 }).then(res => console.log(res));
broker.call("math.mult", { a: 10, b: 31 }).then(res => console.log(res));
```

Inside the action you can call other sub-actions with `ctx.call`.
```js
{
    name: "posts",
    actions: {
        get(ctx) => {
            let post = posts[ctx.params.id];
            // Populate the post.author field through "users" service
            // Call the "users.get" action with author ID
            return ctx.call("users.get", { id: post.author }).then(user => {
                if (user)
                    post.author = user;

                return post;
            })
        }
    }
}
```

## Events
You can subscribe events and can define event handlers in the schema under `events` key.

```js
{
    name: "users",
    actions: {
        ...
    },

    events: {
        // Subscribe to "user.create" event
        "user.create": function(payload) {
            this.logger.info("Create user...");
            // Do something
        },

        // Subscribe to all "user.*" event
        "user.*": function(payload, eventName) {
            // Do something with payload. The `eventName` contains the original event name.
        }
    }

}
```

## Methods
You can create also private functions in service. They are called as `methods`. These functions are private, can't be invoke with `broker.call`. But you can execute it inside service.

```js
{
    name: "mailer",
    actions: {
        send(ctx) {
            // Call my `sendMail` method
            return this.sendMail(ctx.params.recipients, ctx.params.subject, ctx.params.body);
        }
    },

    methods: {
        // Send an email to recipients
        sendMail(recipients, subject, body) {
            return new Promise((resolve, reject) => {
                ...
            });
        }
    }
}
```
> The name of method can't be `name`, `version`, `settings`, `schema`, `broker`, `actions`, `logger`, because these words are reserved.

## Lifecycle events
There are some lifecycle service events, what will be triggered by ServiceBroker.

```js
{
    name: "www",
    actions: {...},
    events: {...},
    methods: {...},

    created() {
        // Fired when the service instance created.
    },

    started() {
        // Fired when `broker.start()` called.
    }

    stopped() {
        // Fired when `broker.stop()` called.
    }
}
```

## Properties of `this`
In service functions the `this` is always binded to the instance of service. It has some properties & methods what you can use in functions.

| Name | Type |  Description |
| ------- | ----- | ------- |
| `this.name` | `String` | Name of service from schema |
| `this.version` | `Number` | Version of service from schema |
| `this.settings` | `Object` | Settings of service from schema |
| `this.schema` | `Object` | Schema of service |
| `this.broker` | `ServiceBroker` | Instance of broker |
| `this.logger` | `Logger` | Logger module |
| `this.actions` | `Object` | Actions of service. *Service can call its own actions directly.* |

> All methods of service can be reach under `this`.

## Create a service
There are several ways to create/load a service.

### broker.createService
You can use this method when developing or testing.
Call the `broker.createService` methods with the schema of service as argument.

```js
broker.createService({
    name: "math",
    actions: {
        // You can call it as broker.call("math.add")
        add(ctx) {
            return Number(ctx.params.a) + Number(ctx.params.b);
        },

        // You can call it as broker.call("math.sub")
        sub(ctx) {
            return Number(ctx.params.a) - Number(ctx.params.b);
        }
    }
});
```

### Load service
You can place your service code to an individual file and load this file with broker.

**math.service.js**
```js
// Export the schema of service
module.exports = {
    name: "math",
    actions: {
        add(ctx) {
            return Number(ctx.params.a) + Number(ctx.params.b);
        },
        sub(ctx) {
            return Number(ctx.params.a) - Number(ctx.params.b);
        }
    }
}
```

**main.js**
```js
// Create broker
let broker = new ServiceBroker();

// Load service
broker.loadService("./math.service");

// Start broker
broker.start();
```

In the individual files also you can create the Service instance. In this case you need to export a function.
```js
// Export a function, what the `loadService` will be call with the instance of ServiceBroker
module.exports = function(broker) {
    return new Service(broker, {
        name: "math",
        actions: {
            add(ctx) {
                return Number(ctx.params.a) + Number(ctx.params.b);
            },
            sub(ctx) {
                return Number(ctx.params.a) - Number(ctx.params.b);
            }
        }
    });
}
```

Or create a function which returns only with the schema of service
```js
// Export a function, what the `loadService` will be call with the instance of ServiceBroker
module.exports = function() {
    let users = [....];

    return {
        name: "math",
        actions: {
            create(ctx) {
                users.push(ctx.params);
            }
        }
    };
}
```

or load manually with `require`
```js
let userSchema = require("./user.service");

broker.createService(userSchema);
```

### Load multiple services from a folder
You can load multiple services from a folder.

**Syntax**
```js
broker.loadServices(folder = "./services", fileMask = "*.service.js");
```

**Example**
```js
// Load every *.service.js file from "./services" folder
broker.loadServices();

// Load every *.service.js file from current folder
broker.loadServices("./");

// Load every user*.js file from the "./svc" folder
broker.loadServices("./svc", "user*.js");
```

## Private properties
If you would like to create private properties in service, we recommend to declare them in the `created` handler.

```js
const http = require("http");

// Simple HTTP server service
module.exports = {
    name: "www",

    settings: {
        port: 3000
    },

    created() {
        this.server = http.createServer(this.httpHandler);
    },

    started() {
        this.server.listen(this.settings.port);
    },

    stopped() {
        this.server.close();
    },

    methods() {
        // HTTP handler
        httpHandler(req, res) {
            res.end("Hello Servicer!");
        }
    }
}
```

# Context
When you call an action, the broker creates a `Context` instance. Load request informations and pass to the action handler as argument.

Available properties & methods of `Context`:

| Name | Type |  Description |
| ------- | ----- | ------- |
| `ctx.id` | `String` | Context ID |
| `ctx.requestID` | `String` | Request ID. If you make sub-calls in a request, it will be the same ID |
| `ctx.parent` | `Context` | Parent context, if it's a sub-call |
| `ctx.broker` | `ServiceBroker` | Instance of broker |
| `ctx.action` | `Object` | Instance of action |
| `ctx.params` | `Any` | Params of request. *Second argument of `broker.call`* |
| `ctx.nodeID` | `String` | Node ID |
| `ctx.logger` | `Logger` | Logger module |
| `ctx.level` | `Number` | Level of request |
| `ctx.call()` | `Function` | You can make a sub-call. Same arguments like `broker.call` |
| `ctx.emit()` | `Function` | Emit an event, like `broker.emit` |

# Logging
In Services every modules have a custom logger instance. It is inherited from the broker logger instance, what you can set in options of broker.
Every modules add a prefix to the log messages, that you can identify the sender of message.

```js
let { ServiceBroker } = require("servicer");
let broker = new ServiceBroker({
    logger: console,
    logLevel: "info"
});

broker.createService({
    name: "posts",
    actions: {
        get(ctx) {
            ctx.logger.info("Log message via Context logger");
        }
    },
    created() {
        this.logger.info("Log message via Service logger");
    }
});

broker.call("posts.get").then(() => broker.logger.info("Log message via Broker logger"));
```
Console messages:
```
[POSTS-SVC] Log message via Service logger
[CTX] Log message via Context logger
[BROKER] Log message via Broker logger
```

## Custom log levels
If you want to change log level you need to set `logLevel` in broker options.
```js
let broker = new ServiceBroker({
    logger: console,
    logLevel: "warn" // only print the 'warn' & 'error' logs
});
```
You can set custom log levels to every module.
```js
let broker = new ServiceBroker({
    logger: console,
    logLevel: {
        "*": "warn", // global settings
        "BROKER": "info",
        "CTX": "debug",
        "POSTS-SVC": "error",
        "NATS": "info"
    }
});
```

# Cachers
Servicer has built-in cache solution. You have to do two things to enable it.

1. Set a transporter instance to the broker in options
2. Set the `cache: true` in action definition.

```js
let { ServiceBroker } = require("servicer");
let MemoryCacher = require("servicer").Cachers.Memory;

let broker = new ServiceBroker({
    cacher: new MemoryCacher()
});

broker.createService({
    name: "users",
    actions: {
        list: {
            cache: true, // Cache this action
            handler(ctx) {
                this.logger.info("Handler called!");
                return [
                    { id: 1, name: "John" },
                    { id: 2, name: "Jane" }
                ]
            }
        }
    }
});

Promise.resolve()
.then(() => {
    // Call the handler, because the cache is empty
    return broker.call("users.list").then(res => console.log("Users count:", res.count));
})
.then(() => {
    // Return from cache, handler was not called
    return broker.call("users.list").then(res => console.log("Users count:", res.count));
});
```
Console messages:
```
[BROKER] users service registered!
[USERS-SVC] Handler called!
Users count: 2
Users count: 2
```

### Cache keys
The cacher creates keys by service name, action name, and hash of params of context.
TODO:

### Clear cache

## Memory cacher
`MemoryCacher` is a built-in memory cache module.

```js
let MemoryCacher = require("servicer").Cachers.Memory;

let broker = new ServiceBroker({
    cacher: new MemoryCacher({
        ttl: 30 // Time-to-live is 30sec. Disabled: 0 or null
    })
});
```

## Redis cacher
`RedisCacher` is a built-in [Redis](https://redis.io/) based cache module.

```js
let RedisCacher = require("servicer").Cachers.Redis;

let broker = new ServiceBroker({
    cacher: new RedisCacher({
        ttl: 30, // Time-to-live is 30sec. Disabled: 0 or null
        prefix: "SERVICER" // Prefix for cache keys
        monitor: false // Turn on/off Redis client monitoring. Will be logged (on debug level) every client operations.
    })
});
```

## Custom cacher
You can also create your custom cache module. We recommend to you that copy the source of [`MemoryCacher`](src/cachers/memory.js) and implement the `get`, `set`, `del` and `clean` methods.

# Transporters
Transporter is an important module if you are running services on more nodes. Transporter communicates every node. Send events, call requests...etc.

## NATS Transporter
Servicer has a built-in transporter for [NATS](http://nats.io/).
> NATS Server is a simple, high performance open source messaging system for cloud native applications, IoT messaging, and microservices architectures.

```js
let { ServiceBroker} = require("servicer");
let NatsTransporter = require("servicer").Transporters.NATS;

let broker = new ServiceBroker({
	nodeID: "server-1",
	transporter: new NatsTransporter(),
	requestTimeout: 5 * 1000
});
```

### Transporter options
Every transporter options pass to `nats.connect()` method.

```js
// Connect to 'nats://localhost:4222'
new NatsTransporter(); 

// Connect to remote server and change the prefix
new NatsTransporter({
    url: "nats://nats-server:4222",
    prefix: "SERVICER" // Use for channel names at subscribe & publish. Default: "SVC"
});

// Connect to remote server with user & pass
new NatsTransporter({
    url: "nats://nats-server:4222",
    user: "admin",
    pass: "1234"
});
```
## Custom transporter
You can also create your custom transporter module. We recommend to you that copy the source of [`NatsTransporter`](src/transporters/nats.js) and implement the `connect`, `disconnect`, `emit`, `subscribe`, `request` and `sendHeartbeat` methods.

# Metrics
Servicer has a metrics function. You can turn on in broker options with `metrics: true` property.
If enabled, the broker sends metrics events in every `metricsNodeTime`.

## Metrics events

### Health info
Broker emit a global event as `metrics.node.health` with health info of node.

Example health info:
```js
TODO
```

### Statistics
Broker emit a global event as `metrics.node.stats` with statistics.

# Statistics
Servicer has a statistics module, what collects and aggregates the count & latency info of requests.
You can enable in boker options with `statistics: true` property. You need to enable metrics functions too!

Broker emit a global event with `metrics.node.stats` name. The payload contains the statistics.

Example statistics:
```json
```

# Nodes
TODO: 
Architecture
    Kép:
    - monolith architectures ( minden service 1 node-on )
    - microservices (minden service külön node-on)
    - mixed (összetartozó service-ek egy node-on scale-ezve)

# Docker
TODO:
- docker fájlok, scriptek, compose example-k

# Best practices
- service files
- configuration
- benchmark

# Benchmarks
TODO: az eredményeket kirakni, grafikonnal

# Test
```
$ npm test
```

or in development

```
$ npm run ci
```

# Contribution
Please send pull requests improving the usage and fixing bugs, improving documentation and providing better examples, or providing some testing, because these things are important.

# License
Servicer is available under the [MIT license](https://tldrlegal.com/license/mit-license).

# Contact
Copyright (c) 2017 Icebob

[![@icebob](https://img.shields.io/badge/github-icebob-green.svg)](https://github.com/icebob) [![@icebob](https://img.shields.io/badge/twitter-Icebobcsi-blue.svg)](https://twitter.com/Icebobcsi)