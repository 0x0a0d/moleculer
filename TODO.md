# TODO

## Common
- request timeout (30s default)
- multi params for multi-call & return array
- features (?)
- add version to registered action name too. Because if there is v1 & v2, broker call both because the action name is same
	"v1.posts.find", "v2.posts.find"

- create d.ts file

- cli tool for generate project & Services
	- https://github.com/sboudrias/Inquirer.js
	- https://github.com/tj/consolidate.js

	- `ices init` - generate an ice-services based project
	- `ices add service` - generate an empty service
	- `ices add middleware` - generate an empty middleware
	- `ices add plugin` - generate an empty plugin
	https://github.com/tj/ngen 

- circuit breaker: https://github.com/awolden/brakes

## Services
- use param validator in actions
	```js
	add: {
		cache: true,
		params: {
			a: {type$:'number'},
			b: {type$:'number', gt$:0}
		},
		handler(ctx) {

		}
	}
	```
	- Validator Factory for service what is resolve the params schema. Built-in resolver is validatorjs (it is the fastest)

## Transporters
- Redis transporter
- websocket
- add gzip support

## Cachers
- add lru features to Memory and Redis

## Context
