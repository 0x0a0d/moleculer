/*eslint-disable block-scoped-var, no-redeclare, no-control-regex, no-prototype-builtins, no-var, indent*/

"use strict";

var $protobuf = require("protobufjs/minimal");

// Common aliases
var $Reader = $protobuf.Reader, $Writer = $protobuf.Writer, $util = $protobuf.util;

// Exported root namespace
var $root = $protobuf.roots["default"] || ($protobuf.roots["default"] = {});

/* istanbul ignore next */
$root.packets = (function() {

    /**
     * Namespace packets.
     * @exports packets
     * @namespace
     */
    var packets = {};

    packets.PacketEvent = (function() {

        /**
         * Properties of a PacketEvent.
         * @typedef packets.PacketEvent$Properties
         * @type {Object}
         * @property {string} sender PacketEvent sender.
         * @property {string} event PacketEvent event.
         * @property {string} data PacketEvent data.
         */

        /**
         * Constructs a new PacketEvent.
         * @exports packets.PacketEvent
         * @constructor
         * @param {packets.PacketEvent$Properties=} [properties] Properties to set
         */
        function PacketEvent(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PacketEvent sender.
         * @type {string}
         */
        PacketEvent.prototype.sender = "";

        /**
         * PacketEvent event.
         * @type {string}
         */
        PacketEvent.prototype.event = "";

        /**
         * PacketEvent data.
         * @type {string}
         */
        PacketEvent.prototype.data = "";

        /**
         * Creates a new PacketEvent instance using the specified properties.
         * @param {packets.PacketEvent$Properties=} [properties] Properties to set
         * @returns {packets.PacketEvent} PacketEvent instance
         */
        PacketEvent.create = function create(properties) {
            return new PacketEvent(properties);
        };

        /**
         * Encodes the specified PacketEvent message. Does not implicitly {@link packets.PacketEvent.verify|verify} messages.
         * @param {packets.PacketEvent$Properties} message PacketEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PacketEvent.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.sender);
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.event);
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.data);
            return writer;
        };

        /**
         * Encodes the specified PacketEvent message, length delimited. Does not implicitly {@link packets.PacketEvent.verify|verify} messages.
         * @param {packets.PacketEvent$Properties} message PacketEvent message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PacketEvent.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PacketEvent message from the specified reader or buffer.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {packets.PacketEvent} PacketEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PacketEvent.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.packets.PacketEvent();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.sender = reader.string();
                    break;
                case 2:
                    message.event = reader.string();
                    break;
                case 3:
                    message.data = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            if (!message.hasOwnProperty("sender"))
                throw $util.ProtocolError("missing required 'sender'", { instance: message });
            if (!message.hasOwnProperty("event"))
                throw $util.ProtocolError("missing required 'event'", { instance: message });
            if (!message.hasOwnProperty("data"))
                throw $util.ProtocolError("missing required 'data'", { instance: message });
            return message;
        };

        /**
         * Decodes a PacketEvent message from the specified reader or buffer, length delimited.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {packets.PacketEvent} PacketEvent
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PacketEvent.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PacketEvent message.
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {?string} `null` if valid, otherwise the reason why it is not
         */
        PacketEvent.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (!$util.isString(message.sender))
                return "sender: string expected";
            if (!$util.isString(message.event))
                return "event: string expected";
            if (!$util.isString(message.data))
                return "data: string expected";
            return null;
        };

        /**
         * Creates a PacketEvent message from a plain object. Also converts values to their respective internal types.
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.PacketEvent} PacketEvent
         */
        PacketEvent.fromObject = function fromObject(object) {
            if (object instanceof $root.packets.PacketEvent)
                return object;
            var message = new $root.packets.PacketEvent();
            if (object.sender != null)
                message.sender = String(object.sender);
            if (object.event != null)
                message.event = String(object.event);
            if (object.data != null)
                message.data = String(object.data);
            return message;
        };

        /**
         * Creates a PacketEvent message from a plain object. Also converts values to their respective internal types.
         * This is an alias of {@link packets.PacketEvent.fromObject}.
         * @function
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.PacketEvent} PacketEvent
         */
        PacketEvent.from = PacketEvent.fromObject;

        /**
         * Creates a plain object from a PacketEvent message. Also converts values to other types if specified.
         * @param {packets.PacketEvent} message PacketEvent
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PacketEvent.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.sender = "";
                object.event = "";
                object.data = "";
            }
            if (message.sender != null && message.hasOwnProperty("sender"))
                object.sender = message.sender;
            if (message.event != null && message.hasOwnProperty("event"))
                object.event = message.event;
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = message.data;
            return object;
        };

        /**
         * Creates a plain object from this PacketEvent message. Also converts values to other types if specified.
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PacketEvent.prototype.toObject = function toObject(options) {
            return this.constructor.toObject(this, options);
        };

        /**
         * Converts this PacketEvent to JSON.
         * @returns {Object.<string,*>} JSON object
         */
        PacketEvent.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PacketEvent;
    })();

    packets.PacketRequest = (function() {

        /**
         * Properties of a PacketRequest.
         * @typedef packets.PacketRequest$Properties
         * @type {Object}
         * @property {string} sender PacketRequest sender.
         * @property {string} id PacketRequest id.
         * @property {string} action PacketRequest action.
         * @property {string} params PacketRequest params.
         * @property {string} meta PacketRequest meta.
         * @property {number} timeout PacketRequest timeout.
         * @property {number} level PacketRequest level.
         * @property {boolean} metrics PacketRequest metrics.
         * @property {string} [parentID] PacketRequest parentID.
         */

        /**
         * Constructs a new PacketRequest.
         * @exports packets.PacketRequest
         * @constructor
         * @param {packets.PacketRequest$Properties=} [properties] Properties to set
         */
        function PacketRequest(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PacketRequest sender.
         * @type {string}
         */
        PacketRequest.prototype.sender = "";

        /**
         * PacketRequest id.
         * @type {string}
         */
        PacketRequest.prototype.id = "";

        /**
         * PacketRequest action.
         * @type {string}
         */
        PacketRequest.prototype.action = "";

        /**
         * PacketRequest params.
         * @type {string}
         */
        PacketRequest.prototype.params = "";

        /**
         * PacketRequest meta.
         * @type {string}
         */
        PacketRequest.prototype.meta = "";

        /**
         * PacketRequest timeout.
         * @type {number}
         */
        PacketRequest.prototype.timeout = 0;

        /**
         * PacketRequest level.
         * @type {number}
         */
        PacketRequest.prototype.level = 0;

        /**
         * PacketRequest metrics.
         * @type {boolean}
         */
        PacketRequest.prototype.metrics = false;

        /**
         * PacketRequest parentID.
         * @type {string}
         */
        PacketRequest.prototype.parentID = "";

        /**
         * Creates a new PacketRequest instance using the specified properties.
         * @param {packets.PacketRequest$Properties=} [properties] Properties to set
         * @returns {packets.PacketRequest} PacketRequest instance
         */
        PacketRequest.create = function create(properties) {
            return new PacketRequest(properties);
        };

        /**
         * Encodes the specified PacketRequest message. Does not implicitly {@link packets.PacketRequest.verify|verify} messages.
         * @param {packets.PacketRequest$Properties} message PacketRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PacketRequest.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.sender);
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.id);
            writer.uint32(/* id 3, wireType 2 =*/26).string(message.action);
            writer.uint32(/* id 4, wireType 2 =*/34).string(message.params);
            writer.uint32(/* id 5, wireType 2 =*/42).string(message.meta);
            writer.uint32(/* id 6, wireType 0 =*/48).int32(message.timeout);
            writer.uint32(/* id 7, wireType 0 =*/56).int32(message.level);
            writer.uint32(/* id 8, wireType 0 =*/64).bool(message.metrics);
            if (message.parentID != null && message.hasOwnProperty("parentID"))
                writer.uint32(/* id 9, wireType 2 =*/74).string(message.parentID);
            return writer;
        };

        /**
         * Encodes the specified PacketRequest message, length delimited. Does not implicitly {@link packets.PacketRequest.verify|verify} messages.
         * @param {packets.PacketRequest$Properties} message PacketRequest message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PacketRequest.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PacketRequest message from the specified reader or buffer.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {packets.PacketRequest} PacketRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PacketRequest.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.packets.PacketRequest();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.sender = reader.string();
                    break;
                case 2:
                    message.id = reader.string();
                    break;
                case 3:
                    message.action = reader.string();
                    break;
                case 4:
                    message.params = reader.string();
                    break;
                case 5:
                    message.meta = reader.string();
                    break;
                case 6:
                    message.timeout = reader.int32();
                    break;
                case 7:
                    message.level = reader.int32();
                    break;
                case 8:
                    message.metrics = reader.bool();
                    break;
                case 9:
                    message.parentID = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            if (!message.hasOwnProperty("sender"))
                throw $util.ProtocolError("missing required 'sender'", { instance: message });
            if (!message.hasOwnProperty("id"))
                throw $util.ProtocolError("missing required 'id'", { instance: message });
            if (!message.hasOwnProperty("action"))
                throw $util.ProtocolError("missing required 'action'", { instance: message });
            if (!message.hasOwnProperty("params"))
                throw $util.ProtocolError("missing required 'params'", { instance: message });
            if (!message.hasOwnProperty("meta"))
                throw $util.ProtocolError("missing required 'meta'", { instance: message });
            if (!message.hasOwnProperty("timeout"))
                throw $util.ProtocolError("missing required 'timeout'", { instance: message });
            if (!message.hasOwnProperty("level"))
                throw $util.ProtocolError("missing required 'level'", { instance: message });
            if (!message.hasOwnProperty("metrics"))
                throw $util.ProtocolError("missing required 'metrics'", { instance: message });
            return message;
        };

        /**
         * Decodes a PacketRequest message from the specified reader or buffer, length delimited.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {packets.PacketRequest} PacketRequest
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PacketRequest.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PacketRequest message.
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {?string} `null` if valid, otherwise the reason why it is not
         */
        PacketRequest.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (!$util.isString(message.sender))
                return "sender: string expected";
            if (!$util.isString(message.id))
                return "id: string expected";
            if (!$util.isString(message.action))
                return "action: string expected";
            if (!$util.isString(message.params))
                return "params: string expected";
            if (!$util.isString(message.meta))
                return "meta: string expected";
            if (!$util.isInteger(message.timeout))
                return "timeout: integer expected";
            if (!$util.isInteger(message.level))
                return "level: integer expected";
            if (typeof message.metrics !== "boolean")
                return "metrics: boolean expected";
            if (message.parentID != null && message.hasOwnProperty("parentID"))
                if (!$util.isString(message.parentID))
                    return "parentID: string expected";
            return null;
        };

        /**
         * Creates a PacketRequest message from a plain object. Also converts values to their respective internal types.
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.PacketRequest} PacketRequest
         */
        PacketRequest.fromObject = function fromObject(object) {
            if (object instanceof $root.packets.PacketRequest)
                return object;
            var message = new $root.packets.PacketRequest();
            if (object.sender != null)
                message.sender = String(object.sender);
            if (object.id != null)
                message.id = String(object.id);
            if (object.action != null)
                message.action = String(object.action);
            if (object.params != null)
                message.params = String(object.params);
            if (object.meta != null)
                message.meta = String(object.meta);
            if (object.timeout != null)
                message.timeout = object.timeout | 0;
            if (object.level != null)
                message.level = object.level | 0;
            if (object.metrics != null)
                message.metrics = Boolean(object.metrics);
            if (object.parentID != null)
                message.parentID = String(object.parentID);
            return message;
        };

        /**
         * Creates a PacketRequest message from a plain object. Also converts values to their respective internal types.
         * This is an alias of {@link packets.PacketRequest.fromObject}.
         * @function
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.PacketRequest} PacketRequest
         */
        PacketRequest.from = PacketRequest.fromObject;

        /**
         * Creates a plain object from a PacketRequest message. Also converts values to other types if specified.
         * @param {packets.PacketRequest} message PacketRequest
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PacketRequest.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.sender = "";
                object.id = "";
                object.action = "";
                object.params = "";
                object.meta = "";
                object.timeout = 0;
                object.level = 0;
                object.metrics = false;
                object.parentID = "";
            }
            if (message.sender != null && message.hasOwnProperty("sender"))
                object.sender = message.sender;
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.action != null && message.hasOwnProperty("action"))
                object.action = message.action;
            if (message.params != null && message.hasOwnProperty("params"))
                object.params = message.params;
            if (message.meta != null && message.hasOwnProperty("meta"))
                object.meta = message.meta;
            if (message.timeout != null && message.hasOwnProperty("timeout"))
                object.timeout = message.timeout;
            if (message.level != null && message.hasOwnProperty("level"))
                object.level = message.level;
            if (message.metrics != null && message.hasOwnProperty("metrics"))
                object.metrics = message.metrics;
            if (message.parentID != null && message.hasOwnProperty("parentID"))
                object.parentID = message.parentID;
            return object;
        };

        /**
         * Creates a plain object from this PacketRequest message. Also converts values to other types if specified.
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PacketRequest.prototype.toObject = function toObject(options) {
            return this.constructor.toObject(this, options);
        };

        /**
         * Converts this PacketRequest to JSON.
         * @returns {Object.<string,*>} JSON object
         */
        PacketRequest.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PacketRequest;
    })();

    packets.PacketResponse = (function() {

        /**
         * Properties of a PacketResponse.
         * @typedef packets.PacketResponse$Properties
         * @type {Object}
         * @property {string} sender PacketResponse sender.
         * @property {string} id PacketResponse id.
         * @property {boolean} success PacketResponse success.
         * @property {string} [data] PacketResponse data.
         * @property {packets.PacketResponse.Error$Properties} [error] PacketResponse error.
         */

        /**
         * Constructs a new PacketResponse.
         * @exports packets.PacketResponse
         * @constructor
         * @param {packets.PacketResponse$Properties=} [properties] Properties to set
         */
        function PacketResponse(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PacketResponse sender.
         * @type {string}
         */
        PacketResponse.prototype.sender = "";

        /**
         * PacketResponse id.
         * @type {string}
         */
        PacketResponse.prototype.id = "";

        /**
         * PacketResponse success.
         * @type {boolean}
         */
        PacketResponse.prototype.success = false;

        /**
         * PacketResponse data.
         * @type {string}
         */
        PacketResponse.prototype.data = "";

        /**
         * PacketResponse error.
         * @type {(packets.PacketResponse.Error$Properties|null)}
         */
        PacketResponse.prototype.error = null;

        /**
         * Creates a new PacketResponse instance using the specified properties.
         * @param {packets.PacketResponse$Properties=} [properties] Properties to set
         * @returns {packets.PacketResponse} PacketResponse instance
         */
        PacketResponse.create = function create(properties) {
            return new PacketResponse(properties);
        };

        /**
         * Encodes the specified PacketResponse message. Does not implicitly {@link packets.PacketResponse.verify|verify} messages.
         * @param {packets.PacketResponse$Properties} message PacketResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PacketResponse.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.sender);
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.id);
            writer.uint32(/* id 3, wireType 0 =*/24).bool(message.success);
            if (message.data != null && message.hasOwnProperty("data"))
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.data);
            if (message.error != null && message.hasOwnProperty("error"))
                $root.packets.PacketResponse.Error.encode(message.error, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified PacketResponse message, length delimited. Does not implicitly {@link packets.PacketResponse.verify|verify} messages.
         * @param {packets.PacketResponse$Properties} message PacketResponse message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PacketResponse.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PacketResponse message from the specified reader or buffer.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {packets.PacketResponse} PacketResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PacketResponse.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.packets.PacketResponse();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.sender = reader.string();
                    break;
                case 2:
                    message.id = reader.string();
                    break;
                case 3:
                    message.success = reader.bool();
                    break;
                case 4:
                    message.data = reader.string();
                    break;
                case 5:
                    message.error = $root.packets.PacketResponse.Error.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            if (!message.hasOwnProperty("sender"))
                throw $util.ProtocolError("missing required 'sender'", { instance: message });
            if (!message.hasOwnProperty("id"))
                throw $util.ProtocolError("missing required 'id'", { instance: message });
            if (!message.hasOwnProperty("success"))
                throw $util.ProtocolError("missing required 'success'", { instance: message });
            return message;
        };

        /**
         * Decodes a PacketResponse message from the specified reader or buffer, length delimited.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {packets.PacketResponse} PacketResponse
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PacketResponse.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PacketResponse message.
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {?string} `null` if valid, otherwise the reason why it is not
         */
        PacketResponse.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (!$util.isString(message.sender))
                return "sender: string expected";
            if (!$util.isString(message.id))
                return "id: string expected";
            if (typeof message.success !== "boolean")
                return "success: boolean expected";
            if (message.data != null && message.hasOwnProperty("data"))
                if (!$util.isString(message.data))
                    return "data: string expected";
            if (message.error != null && message.hasOwnProperty("error")) {
                var error = $root.packets.PacketResponse.Error.verify(message.error);
                if (error)
                    return "error." + error;
            }
            return null;
        };

        /**
         * Creates a PacketResponse message from a plain object. Also converts values to their respective internal types.
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.PacketResponse} PacketResponse
         */
        PacketResponse.fromObject = function fromObject(object) {
            if (object instanceof $root.packets.PacketResponse)
                return object;
            var message = new $root.packets.PacketResponse();
            if (object.sender != null)
                message.sender = String(object.sender);
            if (object.id != null)
                message.id = String(object.id);
            if (object.success != null)
                message.success = Boolean(object.success);
            if (object.data != null)
                message.data = String(object.data);
            if (object.error != null) {
                if (typeof object.error !== "object")
                    throw TypeError(".packets.PacketResponse.error: object expected");
                message.error = $root.packets.PacketResponse.Error.fromObject(object.error);
            }
            return message;
        };

        /**
         * Creates a PacketResponse message from a plain object. Also converts values to their respective internal types.
         * This is an alias of {@link packets.PacketResponse.fromObject}.
         * @function
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.PacketResponse} PacketResponse
         */
        PacketResponse.from = PacketResponse.fromObject;

        /**
         * Creates a plain object from a PacketResponse message. Also converts values to other types if specified.
         * @param {packets.PacketResponse} message PacketResponse
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PacketResponse.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.sender = "";
                object.id = "";
                object.success = false;
                object.data = "";
                object.error = null;
            }
            if (message.sender != null && message.hasOwnProperty("sender"))
                object.sender = message.sender;
            if (message.id != null && message.hasOwnProperty("id"))
                object.id = message.id;
            if (message.success != null && message.hasOwnProperty("success"))
                object.success = message.success;
            if (message.data != null && message.hasOwnProperty("data"))
                object.data = message.data;
            if (message.error != null && message.hasOwnProperty("error"))
                object.error = $root.packets.PacketResponse.Error.toObject(message.error, options);
            return object;
        };

        /**
         * Creates a plain object from this PacketResponse message. Also converts values to other types if specified.
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PacketResponse.prototype.toObject = function toObject(options) {
            return this.constructor.toObject(this, options);
        };

        /**
         * Converts this PacketResponse to JSON.
         * @returns {Object.<string,*>} JSON object
         */
        PacketResponse.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        PacketResponse.Error = (function() {

            /**
             * Properties of an Error.
             * @typedef packets.PacketResponse.Error$Properties
             * @type {Object}
             * @property {string} name Error name.
             * @property {string} message Error message.
             * @property {number} code Error code.
             * @property {string} type Error type.
             * @property {string} data Error data.
             * @property {string} stack Error stack.
             * @property {string} nodeID Error nodeID.
             */

            /**
             * Constructs a new Error.
             * @exports packets.PacketResponse.Error
             * @constructor
             * @param {packets.PacketResponse.Error$Properties=} [properties] Properties to set
             */
            function Error(properties) {
                if (properties)
                    for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                        if (properties[keys[i]] != null)
                            this[keys[i]] = properties[keys[i]];
            }

            /**
             * Error name.
             * @type {string}
             */
            Error.prototype.name = "";

            /**
             * Error message.
             * @type {string}
             */
            Error.prototype.message = "";

            /**
             * Error code.
             * @type {number}
             */
            Error.prototype.code = 0;

            /**
             * Error type.
             * @type {string}
             */
            Error.prototype.type = "";

            /**
             * Error data.
             * @type {string}
             */
            Error.prototype.data = "";

            /**
             * Error stack.
             * @type {string}
             */
            Error.prototype.stack = "";

            /**
             * Error nodeID.
             * @type {string}
             */
            Error.prototype.nodeID = "";

            /**
             * Creates a new Error instance using the specified properties.
             * @param {packets.PacketResponse.Error$Properties=} [properties] Properties to set
             * @returns {packets.PacketResponse.Error} Error instance
             */
            Error.create = function create(properties) {
                return new Error(properties);
            };

            /**
             * Encodes the specified Error message. Does not implicitly {@link packets.PacketResponse.Error.verify|verify} messages.
             * @param {packets.PacketResponse.Error$Properties} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encode = function encode(message, writer) {
                if (!writer)
                    writer = $Writer.create();
                writer.uint32(/* id 1, wireType 2 =*/10).string(message.name);
                writer.uint32(/* id 2, wireType 2 =*/18).string(message.message);
                writer.uint32(/* id 3, wireType 0 =*/24).int32(message.code);
                writer.uint32(/* id 4, wireType 2 =*/34).string(message.type);
                writer.uint32(/* id 5, wireType 2 =*/42).string(message.data);
                writer.uint32(/* id 6, wireType 2 =*/50).string(message.stack);
                writer.uint32(/* id 7, wireType 2 =*/58).string(message.nodeID);
                return writer;
            };

            /**
             * Encodes the specified Error message, length delimited. Does not implicitly {@link packets.PacketResponse.Error.verify|verify} messages.
             * @param {packets.PacketResponse.Error$Properties} message Error message or plain object to encode
             * @param {$protobuf.Writer} [writer] Writer to encode to
             * @returns {$protobuf.Writer} Writer
             */
            Error.encodeDelimited = function encodeDelimited(message, writer) {
                return this.encode(message, writer).ldelim();
            };

            /**
             * Decodes an Error message from the specified reader or buffer.
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @param {number} [length] Message length if known beforehand
             * @returns {packets.PacketResponse.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decode = function decode(reader, length) {
                if (!(reader instanceof $Reader))
                    reader = $Reader.create(reader);
                var end = length === undefined ? reader.len : reader.pos + length, message = new $root.packets.PacketResponse.Error();
                while (reader.pos < end) {
                    var tag = reader.uint32();
                    switch (tag >>> 3) {
                    case 1:
                        message.name = reader.string();
                        break;
                    case 2:
                        message.message = reader.string();
                        break;
                    case 3:
                        message.code = reader.int32();
                        break;
                    case 4:
                        message.type = reader.string();
                        break;
                    case 5:
                        message.data = reader.string();
                        break;
                    case 6:
                        message.stack = reader.string();
                        break;
                    case 7:
                        message.nodeID = reader.string();
                        break;
                    default:
                        reader.skipType(tag & 7);
                        break;
                    }
                }
                if (!message.hasOwnProperty("name"))
                    throw $util.ProtocolError("missing required 'name'", { instance: message });
                if (!message.hasOwnProperty("message"))
                    throw $util.ProtocolError("missing required 'message'", { instance: message });
                if (!message.hasOwnProperty("code"))
                    throw $util.ProtocolError("missing required 'code'", { instance: message });
                if (!message.hasOwnProperty("type"))
                    throw $util.ProtocolError("missing required 'type'", { instance: message });
                if (!message.hasOwnProperty("data"))
                    throw $util.ProtocolError("missing required 'data'", { instance: message });
                if (!message.hasOwnProperty("stack"))
                    throw $util.ProtocolError("missing required 'stack'", { instance: message });
                if (!message.hasOwnProperty("nodeID"))
                    throw $util.ProtocolError("missing required 'nodeID'", { instance: message });
                return message;
            };

            /**
             * Decodes an Error message from the specified reader or buffer, length delimited.
             * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
             * @returns {packets.PacketResponse.Error} Error
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            Error.decodeDelimited = function decodeDelimited(reader) {
                if (!(reader instanceof $Reader))
                    reader = $Reader(reader);
                return this.decode(reader, reader.uint32());
            };

            /**
             * Verifies an Error message.
             * @param {Object.<string,*>} message Plain object to verify
             * @returns {?string} `null` if valid, otherwise the reason why it is not
             */
            Error.verify = function verify(message) {
                if (typeof message !== "object" || message === null)
                    return "object expected";
                if (!$util.isString(message.name))
                    return "name: string expected";
                if (!$util.isString(message.message))
                    return "message: string expected";
                if (!$util.isInteger(message.code))
                    return "code: integer expected";
                if (!$util.isString(message.type))
                    return "type: string expected";
                if (!$util.isString(message.data))
                    return "data: string expected";
                if (!$util.isString(message.stack))
                    return "stack: string expected";
                if (!$util.isString(message.nodeID))
                    return "nodeID: string expected";
                return null;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * @param {Object.<string,*>} object Plain object
             * @returns {packets.PacketResponse.Error} Error
             */
            Error.fromObject = function fromObject(object) {
                if (object instanceof $root.packets.PacketResponse.Error)
                    return object;
                var message = new $root.packets.PacketResponse.Error();
                if (object.name != null)
                    message.name = String(object.name);
                if (object.message != null)
                    message.message = String(object.message);
                if (object.code != null)
                    message.code = object.code | 0;
                if (object.type != null)
                    message.type = String(object.type);
                if (object.data != null)
                    message.data = String(object.data);
                if (object.stack != null)
                    message.stack = String(object.stack);
                if (object.nodeID != null)
                    message.nodeID = String(object.nodeID);
                return message;
            };

            /**
             * Creates an Error message from a plain object. Also converts values to their respective internal types.
             * This is an alias of {@link packets.PacketResponse.Error.fromObject}.
             * @function
             * @param {Object.<string,*>} object Plain object
             * @returns {packets.PacketResponse.Error} Error
             */
            Error.from = Error.fromObject;

            /**
             * Creates a plain object from an Error message. Also converts values to other types if specified.
             * @param {packets.PacketResponse.Error} message Error
             * @param {$protobuf.ConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.toObject = function toObject(message, options) {
                if (!options)
                    options = {};
                var object = {};
                if (options.defaults) {
                    object.name = "";
                    object.message = "";
                    object.code = 0;
                    object.type = "";
                    object.data = "";
                    object.stack = "";
                    object.nodeID = "";
                }
                if (message.name != null && message.hasOwnProperty("name"))
                    object.name = message.name;
                if (message.message != null && message.hasOwnProperty("message"))
                    object.message = message.message;
                if (message.code != null && message.hasOwnProperty("code"))
                    object.code = message.code;
                if (message.type != null && message.hasOwnProperty("type"))
                    object.type = message.type;
                if (message.data != null && message.hasOwnProperty("data"))
                    object.data = message.data;
                if (message.stack != null && message.hasOwnProperty("stack"))
                    object.stack = message.stack;
                if (message.nodeID != null && message.hasOwnProperty("nodeID"))
                    object.nodeID = message.nodeID;
                return object;
            };

            /**
             * Creates a plain object from this Error message. Also converts values to other types if specified.
             * @param {$protobuf.ConversionOptions} [options] Conversion options
             * @returns {Object.<string,*>} Plain object
             */
            Error.prototype.toObject = function toObject(options) {
                return this.constructor.toObject(this, options);
            };

            /**
             * Converts this Error to JSON.
             * @returns {Object.<string,*>} JSON object
             */
            Error.prototype.toJSON = function toJSON() {
                return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
            };

            return Error;
        })();

        return PacketResponse;
    })();

    packets.PacketDiscover = (function() {

        /**
         * Properties of a PacketDiscover.
         * @typedef packets.PacketDiscover$Properties
         * @type {Object}
         * @property {string} sender PacketDiscover sender.
         */

        /**
         * Constructs a new PacketDiscover.
         * @exports packets.PacketDiscover
         * @constructor
         * @param {packets.PacketDiscover$Properties=} [properties] Properties to set
         */
        function PacketDiscover(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PacketDiscover sender.
         * @type {string}
         */
        PacketDiscover.prototype.sender = "";

        /**
         * Creates a new PacketDiscover instance using the specified properties.
         * @param {packets.PacketDiscover$Properties=} [properties] Properties to set
         * @returns {packets.PacketDiscover} PacketDiscover instance
         */
        PacketDiscover.create = function create(properties) {
            return new PacketDiscover(properties);
        };

        /**
         * Encodes the specified PacketDiscover message. Does not implicitly {@link packets.PacketDiscover.verify|verify} messages.
         * @param {packets.PacketDiscover$Properties} message PacketDiscover message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PacketDiscover.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.sender);
            return writer;
        };

        /**
         * Encodes the specified PacketDiscover message, length delimited. Does not implicitly {@link packets.PacketDiscover.verify|verify} messages.
         * @param {packets.PacketDiscover$Properties} message PacketDiscover message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PacketDiscover.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PacketDiscover message from the specified reader or buffer.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {packets.PacketDiscover} PacketDiscover
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PacketDiscover.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.packets.PacketDiscover();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.sender = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            if (!message.hasOwnProperty("sender"))
                throw $util.ProtocolError("missing required 'sender'", { instance: message });
            return message;
        };

        /**
         * Decodes a PacketDiscover message from the specified reader or buffer, length delimited.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {packets.PacketDiscover} PacketDiscover
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PacketDiscover.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PacketDiscover message.
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {?string} `null` if valid, otherwise the reason why it is not
         */
        PacketDiscover.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (!$util.isString(message.sender))
                return "sender: string expected";
            return null;
        };

        /**
         * Creates a PacketDiscover message from a plain object. Also converts values to their respective internal types.
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.PacketDiscover} PacketDiscover
         */
        PacketDiscover.fromObject = function fromObject(object) {
            if (object instanceof $root.packets.PacketDiscover)
                return object;
            var message = new $root.packets.PacketDiscover();
            if (object.sender != null)
                message.sender = String(object.sender);
            return message;
        };

        /**
         * Creates a PacketDiscover message from a plain object. Also converts values to their respective internal types.
         * This is an alias of {@link packets.PacketDiscover.fromObject}.
         * @function
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.PacketDiscover} PacketDiscover
         */
        PacketDiscover.from = PacketDiscover.fromObject;

        /**
         * Creates a plain object from a PacketDiscover message. Also converts values to other types if specified.
         * @param {packets.PacketDiscover} message PacketDiscover
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PacketDiscover.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.sender = "";
            if (message.sender != null && message.hasOwnProperty("sender"))
                object.sender = message.sender;
            return object;
        };

        /**
         * Creates a plain object from this PacketDiscover message. Also converts values to other types if specified.
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PacketDiscover.prototype.toObject = function toObject(options) {
            return this.constructor.toObject(this, options);
        };

        /**
         * Converts this PacketDiscover to JSON.
         * @returns {Object.<string,*>} JSON object
         */
        PacketDiscover.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PacketDiscover;
    })();

    packets.NodeVersions = (function() {

        /**
         * Properties of a NodeVersions.
         * @typedef packets.NodeVersions$Properties
         * @type {Object}
         * @property {string} node NodeVersions node.
         * @property {string} moleculer NodeVersions moleculer.
         */

        /**
         * Constructs a new NodeVersions.
         * @exports packets.NodeVersions
         * @constructor
         * @param {packets.NodeVersions$Properties=} [properties] Properties to set
         */
        function NodeVersions(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * NodeVersions node.
         * @type {string}
         */
        NodeVersions.prototype.node = "";

        /**
         * NodeVersions moleculer.
         * @type {string}
         */
        NodeVersions.prototype.moleculer = "";

        /**
         * Creates a new NodeVersions instance using the specified properties.
         * @param {packets.NodeVersions$Properties=} [properties] Properties to set
         * @returns {packets.NodeVersions} NodeVersions instance
         */
        NodeVersions.create = function create(properties) {
            return new NodeVersions(properties);
        };

        /**
         * Encodes the specified NodeVersions message. Does not implicitly {@link packets.NodeVersions.verify|verify} messages.
         * @param {packets.NodeVersions$Properties} message NodeVersions message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        NodeVersions.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.node);
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.moleculer);
            return writer;
        };

        /**
         * Encodes the specified NodeVersions message, length delimited. Does not implicitly {@link packets.NodeVersions.verify|verify} messages.
         * @param {packets.NodeVersions$Properties} message NodeVersions message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        NodeVersions.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a NodeVersions message from the specified reader or buffer.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {packets.NodeVersions} NodeVersions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        NodeVersions.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.packets.NodeVersions();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.node = reader.string();
                    break;
                case 2:
                    message.moleculer = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            if (!message.hasOwnProperty("node"))
                throw $util.ProtocolError("missing required 'node'", { instance: message });
            if (!message.hasOwnProperty("moleculer"))
                throw $util.ProtocolError("missing required 'moleculer'", { instance: message });
            return message;
        };

        /**
         * Decodes a NodeVersions message from the specified reader or buffer, length delimited.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {packets.NodeVersions} NodeVersions
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        NodeVersions.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a NodeVersions message.
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {?string} `null` if valid, otherwise the reason why it is not
         */
        NodeVersions.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (!$util.isString(message.node))
                return "node: string expected";
            if (!$util.isString(message.moleculer))
                return "moleculer: string expected";
            return null;
        };

        /**
         * Creates a NodeVersions message from a plain object. Also converts values to their respective internal types.
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.NodeVersions} NodeVersions
         */
        NodeVersions.fromObject = function fromObject(object) {
            if (object instanceof $root.packets.NodeVersions)
                return object;
            var message = new $root.packets.NodeVersions();
            if (object.node != null)
                message.node = String(object.node);
            if (object.moleculer != null)
                message.moleculer = String(object.moleculer);
            return message;
        };

        /**
         * Creates a NodeVersions message from a plain object. Also converts values to their respective internal types.
         * This is an alias of {@link packets.NodeVersions.fromObject}.
         * @function
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.NodeVersions} NodeVersions
         */
        NodeVersions.from = NodeVersions.fromObject;

        /**
         * Creates a plain object from a NodeVersions message. Also converts values to other types if specified.
         * @param {packets.NodeVersions} message NodeVersions
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        NodeVersions.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.node = "";
                object.moleculer = "";
            }
            if (message.node != null && message.hasOwnProperty("node"))
                object.node = message.node;
            if (message.moleculer != null && message.hasOwnProperty("moleculer"))
                object.moleculer = message.moleculer;
            return object;
        };

        /**
         * Creates a plain object from this NodeVersions message. Also converts values to other types if specified.
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        NodeVersions.prototype.toObject = function toObject(options) {
            return this.constructor.toObject(this, options);
        };

        /**
         * Converts this NodeVersions to JSON.
         * @returns {Object.<string,*>} JSON object
         */
        NodeVersions.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return NodeVersions;
    })();

    packets.PacketInfo = (function() {

        /**
         * Properties of a PacketInfo.
         * @typedef packets.PacketInfo$Properties
         * @type {Object}
         * @property {string} sender PacketInfo sender.
         * @property {string} actions PacketInfo actions.
         * @property {number} uptime PacketInfo uptime.
         * @property {Array.<string>} [ipList] PacketInfo ipList.
         * @property {packets.NodeVersions$Properties} versions PacketInfo versions.
         */

        /**
         * Constructs a new PacketInfo.
         * @exports packets.PacketInfo
         * @constructor
         * @param {packets.PacketInfo$Properties=} [properties] Properties to set
         */
        function PacketInfo(properties) {
            this.ipList = [];
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PacketInfo sender.
         * @type {string}
         */
        PacketInfo.prototype.sender = "";

        /**
         * PacketInfo actions.
         * @type {string}
         */
        PacketInfo.prototype.actions = "";

        /**
         * PacketInfo uptime.
         * @type {number}
         */
        PacketInfo.prototype.uptime = 0;

        /**
         * PacketInfo ipList.
         * @type {Array.<string>}
         */
        PacketInfo.prototype.ipList = $util.emptyArray;

        /**
         * PacketInfo versions.
         * @type {packets.NodeVersions$Properties}
         */
        PacketInfo.prototype.versions = null;

        /**
         * Creates a new PacketInfo instance using the specified properties.
         * @param {packets.PacketInfo$Properties=} [properties] Properties to set
         * @returns {packets.PacketInfo} PacketInfo instance
         */
        PacketInfo.create = function create(properties) {
            return new PacketInfo(properties);
        };

        /**
         * Encodes the specified PacketInfo message. Does not implicitly {@link packets.PacketInfo.verify|verify} messages.
         * @param {packets.PacketInfo$Properties} message PacketInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PacketInfo.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.sender);
            writer.uint32(/* id 2, wireType 2 =*/18).string(message.actions);
            writer.uint32(/* id 3, wireType 1 =*/25).double(message.uptime);
            if (message.ipList != null && message.ipList.length)
                for (var i = 0; i < message.ipList.length; ++i)
                    writer.uint32(/* id 4, wireType 2 =*/34).string(message.ipList[i]);
            $root.packets.NodeVersions.encode(message.versions, writer.uint32(/* id 5, wireType 2 =*/42).fork()).ldelim();
            return writer;
        };

        /**
         * Encodes the specified PacketInfo message, length delimited. Does not implicitly {@link packets.PacketInfo.verify|verify} messages.
         * @param {packets.PacketInfo$Properties} message PacketInfo message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PacketInfo.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PacketInfo message from the specified reader or buffer.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {packets.PacketInfo} PacketInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PacketInfo.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.packets.PacketInfo();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.sender = reader.string();
                    break;
                case 2:
                    message.actions = reader.string();
                    break;
                case 3:
                    message.uptime = reader.double();
                    break;
                case 4:
                    if (!(message.ipList && message.ipList.length))
                        message.ipList = [];
                    message.ipList.push(reader.string());
                    break;
                case 5:
                    message.versions = $root.packets.NodeVersions.decode(reader, reader.uint32());
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            if (!message.hasOwnProperty("sender"))
                throw $util.ProtocolError("missing required 'sender'", { instance: message });
            if (!message.hasOwnProperty("actions"))
                throw $util.ProtocolError("missing required 'actions'", { instance: message });
            if (!message.hasOwnProperty("uptime"))
                throw $util.ProtocolError("missing required 'uptime'", { instance: message });
            if (!message.hasOwnProperty("versions"))
                throw $util.ProtocolError("missing required 'versions'", { instance: message });
            return message;
        };

        /**
         * Decodes a PacketInfo message from the specified reader or buffer, length delimited.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {packets.PacketInfo} PacketInfo
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PacketInfo.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PacketInfo message.
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {?string} `null` if valid, otherwise the reason why it is not
         */
        PacketInfo.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (!$util.isString(message.sender))
                return "sender: string expected";
            if (!$util.isString(message.actions))
                return "actions: string expected";
            if (typeof message.uptime !== "number")
                return "uptime: number expected";
            if (message.ipList != null && message.hasOwnProperty("ipList")) {
                if (!Array.isArray(message.ipList))
                    return "ipList: array expected";
                for (var i = 0; i < message.ipList.length; ++i)
                    if (!$util.isString(message.ipList[i]))
                        return "ipList: string[] expected";
            }
            var error = $root.packets.NodeVersions.verify(message.versions);
            if (error)
                return "versions." + error;
            return null;
        };

        /**
         * Creates a PacketInfo message from a plain object. Also converts values to their respective internal types.
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.PacketInfo} PacketInfo
         */
        PacketInfo.fromObject = function fromObject(object) {
            if (object instanceof $root.packets.PacketInfo)
                return object;
            var message = new $root.packets.PacketInfo();
            if (object.sender != null)
                message.sender = String(object.sender);
            if (object.actions != null)
                message.actions = String(object.actions);
            if (object.uptime != null)
                message.uptime = Number(object.uptime);
            if (object.ipList) {
                if (!Array.isArray(object.ipList))
                    throw TypeError(".packets.PacketInfo.ipList: array expected");
                message.ipList = [];
                for (var i = 0; i < object.ipList.length; ++i)
                    message.ipList[i] = String(object.ipList[i]);
            }
            if (object.versions != null) {
                if (typeof object.versions !== "object")
                    throw TypeError(".packets.PacketInfo.versions: object expected");
                message.versions = $root.packets.NodeVersions.fromObject(object.versions);
            }
            return message;
        };

        /**
         * Creates a PacketInfo message from a plain object. Also converts values to their respective internal types.
         * This is an alias of {@link packets.PacketInfo.fromObject}.
         * @function
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.PacketInfo} PacketInfo
         */
        PacketInfo.from = PacketInfo.fromObject;

        /**
         * Creates a plain object from a PacketInfo message. Also converts values to other types if specified.
         * @param {packets.PacketInfo} message PacketInfo
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PacketInfo.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.arrays || options.defaults)
                object.ipList = [];
            if (options.defaults) {
                object.sender = "";
                object.actions = "";
                object.uptime = 0;
                object.versions = null;
            }
            if (message.sender != null && message.hasOwnProperty("sender"))
                object.sender = message.sender;
            if (message.actions != null && message.hasOwnProperty("actions"))
                object.actions = message.actions;
            if (message.uptime != null && message.hasOwnProperty("uptime"))
                object.uptime = message.uptime;
            if (message.ipList && message.ipList.length) {
                object.ipList = [];
                for (var j = 0; j < message.ipList.length; ++j)
                    object.ipList[j] = message.ipList[j];
            }
            if (message.versions != null && message.hasOwnProperty("versions"))
                object.versions = $root.packets.NodeVersions.toObject(message.versions, options);
            return object;
        };

        /**
         * Creates a plain object from this PacketInfo message. Also converts values to other types if specified.
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PacketInfo.prototype.toObject = function toObject(options) {
            return this.constructor.toObject(this, options);
        };

        /**
         * Converts this PacketInfo to JSON.
         * @returns {Object.<string,*>} JSON object
         */
        PacketInfo.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PacketInfo;
    })();

    packets.PacketDisconnect = (function() {

        /**
         * Properties of a PacketDisconnect.
         * @typedef packets.PacketDisconnect$Properties
         * @type {Object}
         * @property {string} sender PacketDisconnect sender.
         */

        /**
         * Constructs a new PacketDisconnect.
         * @exports packets.PacketDisconnect
         * @constructor
         * @param {packets.PacketDisconnect$Properties=} [properties] Properties to set
         */
        function PacketDisconnect(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PacketDisconnect sender.
         * @type {string}
         */
        PacketDisconnect.prototype.sender = "";

        /**
         * Creates a new PacketDisconnect instance using the specified properties.
         * @param {packets.PacketDisconnect$Properties=} [properties] Properties to set
         * @returns {packets.PacketDisconnect} PacketDisconnect instance
         */
        PacketDisconnect.create = function create(properties) {
            return new PacketDisconnect(properties);
        };

        /**
         * Encodes the specified PacketDisconnect message. Does not implicitly {@link packets.PacketDisconnect.verify|verify} messages.
         * @param {packets.PacketDisconnect$Properties} message PacketDisconnect message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PacketDisconnect.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.sender);
            return writer;
        };

        /**
         * Encodes the specified PacketDisconnect message, length delimited. Does not implicitly {@link packets.PacketDisconnect.verify|verify} messages.
         * @param {packets.PacketDisconnect$Properties} message PacketDisconnect message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PacketDisconnect.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PacketDisconnect message from the specified reader or buffer.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {packets.PacketDisconnect} PacketDisconnect
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PacketDisconnect.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.packets.PacketDisconnect();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.sender = reader.string();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            if (!message.hasOwnProperty("sender"))
                throw $util.ProtocolError("missing required 'sender'", { instance: message });
            return message;
        };

        /**
         * Decodes a PacketDisconnect message from the specified reader or buffer, length delimited.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {packets.PacketDisconnect} PacketDisconnect
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PacketDisconnect.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PacketDisconnect message.
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {?string} `null` if valid, otherwise the reason why it is not
         */
        PacketDisconnect.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (!$util.isString(message.sender))
                return "sender: string expected";
            return null;
        };

        /**
         * Creates a PacketDisconnect message from a plain object. Also converts values to their respective internal types.
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.PacketDisconnect} PacketDisconnect
         */
        PacketDisconnect.fromObject = function fromObject(object) {
            if (object instanceof $root.packets.PacketDisconnect)
                return object;
            var message = new $root.packets.PacketDisconnect();
            if (object.sender != null)
                message.sender = String(object.sender);
            return message;
        };

        /**
         * Creates a PacketDisconnect message from a plain object. Also converts values to their respective internal types.
         * This is an alias of {@link packets.PacketDisconnect.fromObject}.
         * @function
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.PacketDisconnect} PacketDisconnect
         */
        PacketDisconnect.from = PacketDisconnect.fromObject;

        /**
         * Creates a plain object from a PacketDisconnect message. Also converts values to other types if specified.
         * @param {packets.PacketDisconnect} message PacketDisconnect
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PacketDisconnect.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults)
                object.sender = "";
            if (message.sender != null && message.hasOwnProperty("sender"))
                object.sender = message.sender;
            return object;
        };

        /**
         * Creates a plain object from this PacketDisconnect message. Also converts values to other types if specified.
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PacketDisconnect.prototype.toObject = function toObject(options) {
            return this.constructor.toObject(this, options);
        };

        /**
         * Converts this PacketDisconnect to JSON.
         * @returns {Object.<string,*>} JSON object
         */
        PacketDisconnect.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PacketDisconnect;
    })();

    packets.PacketHeartbeat = (function() {

        /**
         * Properties of a PacketHeartbeat.
         * @typedef packets.PacketHeartbeat$Properties
         * @type {Object}
         * @property {string} sender PacketHeartbeat sender.
         * @property {number} uptime PacketHeartbeat uptime.
         */

        /**
         * Constructs a new PacketHeartbeat.
         * @exports packets.PacketHeartbeat
         * @constructor
         * @param {packets.PacketHeartbeat$Properties=} [properties] Properties to set
         */
        function PacketHeartbeat(properties) {
            if (properties)
                for (var keys = Object.keys(properties), i = 0; i < keys.length; ++i)
                    if (properties[keys[i]] != null)
                        this[keys[i]] = properties[keys[i]];
        }

        /**
         * PacketHeartbeat sender.
         * @type {string}
         */
        PacketHeartbeat.prototype.sender = "";

        /**
         * PacketHeartbeat uptime.
         * @type {number}
         */
        PacketHeartbeat.prototype.uptime = 0;

        /**
         * Creates a new PacketHeartbeat instance using the specified properties.
         * @param {packets.PacketHeartbeat$Properties=} [properties] Properties to set
         * @returns {packets.PacketHeartbeat} PacketHeartbeat instance
         */
        PacketHeartbeat.create = function create(properties) {
            return new PacketHeartbeat(properties);
        };

        /**
         * Encodes the specified PacketHeartbeat message. Does not implicitly {@link packets.PacketHeartbeat.verify|verify} messages.
         * @param {packets.PacketHeartbeat$Properties} message PacketHeartbeat message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PacketHeartbeat.encode = function encode(message, writer) {
            if (!writer)
                writer = $Writer.create();
            writer.uint32(/* id 1, wireType 2 =*/10).string(message.sender);
            writer.uint32(/* id 2, wireType 1 =*/17).double(message.uptime);
            return writer;
        };

        /**
         * Encodes the specified PacketHeartbeat message, length delimited. Does not implicitly {@link packets.PacketHeartbeat.verify|verify} messages.
         * @param {packets.PacketHeartbeat$Properties} message PacketHeartbeat message or plain object to encode
         * @param {$protobuf.Writer} [writer] Writer to encode to
         * @returns {$protobuf.Writer} Writer
         */
        PacketHeartbeat.encodeDelimited = function encodeDelimited(message, writer) {
            return this.encode(message, writer).ldelim();
        };

        /**
         * Decodes a PacketHeartbeat message from the specified reader or buffer.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @param {number} [length] Message length if known beforehand
         * @returns {packets.PacketHeartbeat} PacketHeartbeat
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PacketHeartbeat.decode = function decode(reader, length) {
            if (!(reader instanceof $Reader))
                reader = $Reader.create(reader);
            var end = length === undefined ? reader.len : reader.pos + length, message = new $root.packets.PacketHeartbeat();
            while (reader.pos < end) {
                var tag = reader.uint32();
                switch (tag >>> 3) {
                case 1:
                    message.sender = reader.string();
                    break;
                case 2:
                    message.uptime = reader.double();
                    break;
                default:
                    reader.skipType(tag & 7);
                    break;
                }
            }
            if (!message.hasOwnProperty("sender"))
                throw $util.ProtocolError("missing required 'sender'", { instance: message });
            if (!message.hasOwnProperty("uptime"))
                throw $util.ProtocolError("missing required 'uptime'", { instance: message });
            return message;
        };

        /**
         * Decodes a PacketHeartbeat message from the specified reader or buffer, length delimited.
         * @param {$protobuf.Reader|Uint8Array} reader Reader or buffer to decode from
         * @returns {packets.PacketHeartbeat} PacketHeartbeat
         * @throws {Error} If the payload is not a reader or valid buffer
         * @throws {$protobuf.util.ProtocolError} If required fields are missing
         */
        PacketHeartbeat.decodeDelimited = function decodeDelimited(reader) {
            if (!(reader instanceof $Reader))
                reader = $Reader(reader);
            return this.decode(reader, reader.uint32());
        };

        /**
         * Verifies a PacketHeartbeat message.
         * @param {Object.<string,*>} message Plain object to verify
         * @returns {?string} `null` if valid, otherwise the reason why it is not
         */
        PacketHeartbeat.verify = function verify(message) {
            if (typeof message !== "object" || message === null)
                return "object expected";
            if (!$util.isString(message.sender))
                return "sender: string expected";
            if (typeof message.uptime !== "number")
                return "uptime: number expected";
            return null;
        };

        /**
         * Creates a PacketHeartbeat message from a plain object. Also converts values to their respective internal types.
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.PacketHeartbeat} PacketHeartbeat
         */
        PacketHeartbeat.fromObject = function fromObject(object) {
            if (object instanceof $root.packets.PacketHeartbeat)
                return object;
            var message = new $root.packets.PacketHeartbeat();
            if (object.sender != null)
                message.sender = String(object.sender);
            if (object.uptime != null)
                message.uptime = Number(object.uptime);
            return message;
        };

        /**
         * Creates a PacketHeartbeat message from a plain object. Also converts values to their respective internal types.
         * This is an alias of {@link packets.PacketHeartbeat.fromObject}.
         * @function
         * @param {Object.<string,*>} object Plain object
         * @returns {packets.PacketHeartbeat} PacketHeartbeat
         */
        PacketHeartbeat.from = PacketHeartbeat.fromObject;

        /**
         * Creates a plain object from a PacketHeartbeat message. Also converts values to other types if specified.
         * @param {packets.PacketHeartbeat} message PacketHeartbeat
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PacketHeartbeat.toObject = function toObject(message, options) {
            if (!options)
                options = {};
            var object = {};
            if (options.defaults) {
                object.sender = "";
                object.uptime = 0;
            }
            if (message.sender != null && message.hasOwnProperty("sender"))
                object.sender = message.sender;
            if (message.uptime != null && message.hasOwnProperty("uptime"))
                object.uptime = message.uptime;
            return object;
        };

        /**
         * Creates a plain object from this PacketHeartbeat message. Also converts values to other types if specified.
         * @param {$protobuf.ConversionOptions} [options] Conversion options
         * @returns {Object.<string,*>} Plain object
         */
        PacketHeartbeat.prototype.toObject = function toObject(options) {
            return this.constructor.toObject(this, options);
        };

        /**
         * Converts this PacketHeartbeat to JSON.
         * @returns {Object.<string,*>} JSON object
         */
        PacketHeartbeat.prototype.toJSON = function toJSON() {
            return this.constructor.toObject(this, $protobuf.util.toJSONOptions);
        };

        return PacketHeartbeat;
    })();

    return packets;
})();

module.exports = $root;
