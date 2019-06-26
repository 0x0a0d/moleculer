"use strict";

const _ 			= require("lodash");
const r 			= _.repeat;
const chalk 		= require("chalk");
const { humanize }  = require("../../utils");

const BaseTraceExporter = require("./base");

/**
 * Console Trace Exporter only for debugging
 *
 * @class ConsoleTraceExporter
 */
class ConsoleTraceExporter extends BaseTraceExporter {

	/**
	 * Creates an instance of ConsoleTraceExporter.
	 * @param {Object?} opts
	 * @memberof ConsoleTraceExporter
	 */
	constructor(opts) {
		super(opts);

		this.opts = _.defaultsDeep(this.opts, {
			logger: null,
			colors: true,
			width: 100,
			gaugeWidth: 40
		});
		if (!this.opts.colors)
			chalk.level = 0;

		this.spans = {};
	}

	/**
	 * Initialize Trace Exporter.
	 *
	 * @param {Tracer} tracer
	 * @memberof ConsoleTraceExporter
	 */
	init(tracer) {
		super.init(tracer);
	}

	/**
	 * Span is started.
	 *
	 * @param {Span} span
	 * @memberof ConsoleTraceExporter
	 */
	startSpan(span) {
		this.spans[span.id] = {
			span,
			children: []
		};

		if (span.parentID) {
			const parentItem = this.spans[span.parentID];
			if (parentItem)
				parentItem.children.push(span.id);
		}
	}

	/**
	 * Span is finished.
	 *
	 * @param {Span} span
	 * @memberof ConsoleTraceExporter
	 */
	finishSpan(span) {
		//this.log(span);
		if (!this.spans[span.parentID]) {
			this.printRequest(span.id);

			// TODO: remove old printed requests
			this.removeSpanWithChildren(span);
		}
	}

	/**
	 * Remove a finished span with children.
	 *
	 * @param {String} spanID
	 * @memberof ConsoleTraceExporter
	 */
	removeSpanWithChildren(spanID) {
		const span = this.spans[spanID];
		if (span) {
			if (span.children && span.children.length > 0) {
				span.children.forEach(child => this.removeSpanWithChildren(child));
			}
			delete this.spans[spanID];
		}
	}

	drawTableTop() {
		this.log(chalk.grey("┌" + r("─", this.opts.width - 2) + "┐"));
	}

	drawHorizonalLine() {
		this.log(chalk.grey("├" + r("─", this.opts.width - 2) + "┤"));
	}

	drawLine(text) {
		this.log(chalk.grey("│ ") + text + chalk.grey(" │"));
	}

	drawTableBottom() {
		this.log(chalk.grey("└" + r("─", this.opts.width - 2) + "┘"));
	}

	getAlignedTexts(str, space) {
		const len = str.length;

		let left;
		if (len <= space)
			left = str + r(" ", space - len);
		else {
			left = str.slice(0, Math.max(space - 3, 0));
			left += r(".", Math.min(3, space));
		}

		return left;
	}

	drawGauge(gstart, gstop) {
		const gw = this.opts.gaugeWidth;
		const p1 = Math.floor(gw * gstart / 100);
		const p2 = Math.max(Math.floor(gw * gstop / 100) - p1, 1);
		const p3 = Math.max(gw - (p1 + p2), 0);

		return [
			chalk.grey("["),
			chalk.grey(r(".", p1)),
			r("■", p2),
			chalk.grey(r(".", p3)),
			chalk.grey("]")
		].join("");
	}

	getCaption(span) {
		let caption = span.name;

		if (span.tags.fromCache)
			caption += " *";
		if (span.tags.remoteCall)
			caption += " »";
		if (span.error)
			caption += " ×";

		return caption;
	}

	getColor(span) {
		let c = chalk.bold;
		if (span.tags.fromCache)
			c = c.yellow;
		if (span.tags.remoteCall)
			c = c.cyan;
		if (span.duration == null)
			c = c.grey;
		if (span.error)
			c = c.red;

		return c;
	}

	getTraceInfo(main) {
		let depth = 0;
		let total = 0;
		let check = (item, level) => {
			total++;
			if (level > depth)
				depth = level;

			if (item.children.length > 0)
				item.children.forEach(spanID => check(this.spans[spanID], level + 1));
		};

		check(main, 1);

		return { depth, total };
	}

	/**
	 * Print a span row
	 *
	 * @param {Object} span
	 * @param {Object} main
	 */
	printSpanTime(spanItem, mainItem, level) {
		const span = spanItem.span;
		const mainSpan = mainItem.span;
		const margin = 2 * 2;
		const w = (this.opts.width || 80) - margin;
		const gw = this.opts.gaugeWidth || 40;

		const time = span.duration == null ? "?" : humanize(span.duration);
		const caption = r("  ", level - 1) + this.getCaption(span);
		const info = this.getAlignedTexts(caption, w - gw - 3 - time.length - 1) + " " + time;

		const startTime = span.startTime || mainSpan.startTime;
		const finishTime = span.finishTime || mainSpan.finishTime;

		let gstart = (startTime - mainSpan.startTime) / (mainSpan.finishTime - mainSpan.startTime) * 100;
		let gstop = (finishTime - mainSpan.startTime) / (mainSpan.finishTime - mainSpan.startTime) * 100;

		if (_.isNaN(gstart) && _.isNaN(gstop)) {
			gstart = 0;
			gstop = 100;
		}
		if (gstop > 100)
			gstop = 100;

		const c = this.getColor(span);
		this.drawLine(c(info + " " + this.drawGauge(gstart, gstop)));

		if (spanItem.children.length > 0)
			spanItem.children.forEach(spanID => this.printSpanTime(this.spans[spanID], mainItem, level + 1));
	}

	/**
	 * Print request traces
	 *
	 * @param {String} id
	 */
	printRequest(id) {
		const main = this.spans[id];
		const margin = 2 * 2;
		const w = this.opts.width - margin;

		this.drawTableTop();

		const { total, depth } = this.getTraceInfo(main);

		const truncatedID = this.getAlignedTexts(id, w - "ID: ".length - "Depth: ".length - (""+depth).length - "Total: ".length - (""+total).length - 2);
		const line = chalk.grey("ID: ") + chalk.bold(truncatedID) + " " + chalk.grey("Depth: ") + chalk.bold(depth) + " " + chalk.grey("Total: ") + chalk.bold(total);
		this.drawLine(line);

		this.drawHorizonalLine();

		this.printSpanTime(main, main, 1);

		this.drawTableBottom();
	}

	log(...args) {
		if (_.isFunction(this.opts.logger)) {
			return this.opts.logger(...args);
		} else {
			return this.logger.info(...args);
		}
	}
}

module.exports = ConsoleTraceExporter;
