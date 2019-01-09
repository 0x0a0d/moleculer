/*
 * moleculer
 * Copyright (c) 2018 MoleculerJS (https://github.com/moleculerjs/moleculer)
 * MIT Licensed
 */

"use strict";

const fs = require("fs");
const chalk = require("chalk");
const path = require("path");
const _ = require("lodash");

const { clearRequireCache } = require("../utils");

module.exports = function HotReloadMiddleware() {

	const cache = new Map();

	let projectFiles = new Map();
	let prevProjectFiles = new Map();

	/**
	 * Detect service dependency graph & watch all dependent files & services.
	 *
	 * @param {ServiceBroker} broker
	 */
	function watchProjectFiles(broker) {

		cache.clear();
		prevProjectFiles = projectFiles;
		projectFiles = new Map();

		// Read the main module
		const mainModule = process.mainModule;

		// Process the whole module tree
		processModule(broker, mainModule, null, 0, mainModule.filename.indexOf("node_modules") === -1 ? [mainModule.filename] : null);

		const needToReload = new Set();

		// Debounced Service reloader function
		const reloadServices = _.debounce(() => {
			broker.logger.info(chalk.bgMagenta.white.bold(`Reload ${needToReload.size} service(s)`));

			broker.Promise.all(Array.from(needToReload).map(svc => broker.hotReloadService(svc)))
				.then(() => {
					needToReload.clear();

					// Recall processing
					setTimeout(() => watchProjectFiles(broker), 1000);
				});
		}, 500);

		// Close previous watchers
		stopAllFileWatcher(prevProjectFiles);

		// Watching project files
		broker.logger.info("");
		broker.logger.info(chalk.yellow.bold("Watching the following project files:"));
		projectFiles.forEach((watchItem, fName) => {
			const relPath = path.relative(process.cwd(), fName);
			if (watchItem.brokerRestart)
				broker.logger.info(`  ${relPath}:`, chalk.grey("restart broker."));
			else if (watchItem.allServices)
				broker.logger.info(`  ${relPath}:`, chalk.grey("reload all services."));
			else if (watchItem.services.length > 0)
				broker.logger.info(`  ${relPath}:`, chalk.grey(`reload ${watchItem.services.length} service(s) & ${watchItem.others.length} other(s).`)/*, watchItem.services, watchItem.others*/);

			// Create watcher
			watchItem.watcher = fs.watch(fName, async (eventType) => {
				const relPath = path.relative(process.cwd(), fName);
				broker.logger.info(chalk.magenta.bold(`The '${relPath}' file is changed. (Event: ${eventType})`));

				// Clear from require cache
				clearRequireCache(fName);
				if (watchItem.others.length > 0) {
					watchItem.others.forEach(f => clearRequireCache(f));
				}

				if (watchItem.brokerRestart) {
					// TODO: it is not working properly. The ServiceBroker doesn't reload the config from the moleculer.config.js
					// file because it is loaded by Moleculer Runner (with merged environment files)
					broker.logger.info(chalk.bgMagenta.white.bold("Action: Stop all file watcher & restart broker..."));
					stopAllFileWatcher(projectFiles);
					// Clear the whole require cache
					require.cache.length = 0;
					broker.restart();

				} else if (watchItem.allServices) {
					// Reload all services
					broker.services.forEach(svc => {
						if (svc.__filename)
							needToReload.add(svc);
					});
					reloadServices();

				} else if (watchItem.services.length > 0) {
					// Reload certain services
					broker.services.forEach(svc => {
						if (watchItem.services.indexOf(svc.fullName) !== -1)
							needToReload.add(svc);
					});
					reloadServices();
				}
			});
		});

	}

	/**
	 * Stop all file watchers
	 */
	function stopAllFileWatcher(items) {
		items.forEach((watchItem) => {
			if (watchItem.watcher) {
				watchItem.watcher.close();
				watchItem.watcher = null;
			}
		});
	}

	/**
	 * Get a watch item
	 *
	 * @param {String} fName
	 * @returns {Object}
	 */
	function getWatchItem(fName) {
		let watchItem = projectFiles.get(fName);
		if (watchItem)
			return watchItem;

		watchItem = {
			services: [],
			allServices: false,
			brokerRestart: false,
			others: []
		};
		projectFiles.set(fName, watchItem);

		return watchItem;
	}

	/**
	 * Process module children modules.
	 *
	 * @param {ServiceBroker} broker
	 * @param {*} mod
	 * @param {*} service
	 * @param {Number} level
	 */
	function processModule(broker, mod, service = null, level = 0, parents = null) {
		const fName = mod.filename;

		// Skip node_modules files, if there is parent project file
		if ((service || parents) && fName.indexOf("node_modules") !== -1)
			return;

		console.log(fName);

		// Cache node_modules files to avoid cyclic dependencies
		if (fName.indexOf("node_modules") !== -1) {
			if (cache.get(fName))
				return;

			cache.set(fName, mod);
		}

		if (!service) {
			service = broker.services.find(svc => svc.__filename == fName);
		}

		if (service) {
			// It is a service dependency. We should reload this service if this file has changed.
			const watchItem = getWatchItem(fName);
			if (!watchItem.services.includes(service.fullName))
				watchItem.services.push(service.fullName);

			watchItem.others = _.uniq([].concat(watchItem.others, parents || []));

		} else {
			// It is not a service dependency, it is a global middleware. We should reload all services if this file has changed.
			if (parents) {
				const watchItem = getWatchItem(fName);
				watchItem.allServices = true;
				watchItem.others = _.uniq([].concat(watchItem.others, parents || []));
			}
		}

		if (mod.children && mod.children.length > 0) {
			if (service) {
				parents = parents ? parents.concat([fName]) : [fName];
			} else if (fName.endsWith("moleculer.config.js")) {
				parents = [];
				//const watchItem = getWatchItem(fName);
				//watchItem.brokerRestart = true;
			} else if (parents) {
				parents.push(fName);
			}
			mod.children.forEach(m => processModule(broker, m, service, service ? level + 1 : 0, parents));
		}
	}

	/**
	 * Expose middleware
	 */
	return {

		// After broker started
		started(broker) {
			if (broker.options.hotReload)
				watchProjectFiles(broker);
		}
	};

};
