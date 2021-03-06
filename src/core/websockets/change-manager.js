/**
 * @class  Layer.Core.Websockets.ChangeManager
 * @private
 *
 * This class listens for `change` events from the websocket server,
 * and processes them.
 */
import { client as Client } from '../../settings';
import Core from '../namespace';
import Util, { logger } from '../../utils';
import Message from '../models/message';
import Container from '../models/container';


class WebsocketChangeManager {
  /**
   * Create a new websocket change manager
   *
   *      var websocketChangeManager = new Layer.Core.Websockets.ChangeManager({
   *          socketManager: client.Websockets.SocketManager
   *      });
   *
   * @method
   * @param  {Object} options
   * @param {Layer.Core.Websockets.SocketManager} socketManager
   * @returns {Layer.Core.Websockets.ChangeManager}
   */
  constructor(options) {
    options.socketManager.on('message', this._handleChange, this);
  }

  /**
   * Handles a Change packet from the server.
   *
   * @method _handleChange
   * @private
   * @param  {Layer.Core.LayerEvent} evt
   */
  _handleChange(evt) {
    if (evt.data.type === 'change') {
      this._processChange(evt.data.body);
    } else if (evt.data.type === 'operation') {
      Client.trigger('websocket:operation', { data: evt.data.body });
    }
  }

  /**
   * Process changes from a change packet.
   *
   * Called both by _handleChange, and by the requestManager on getting a changes array.
   *
   * @method _processChanage
   * @private
   * @param {Object} msg
   */
  _processChange(msg) {
    switch (msg.operation) {
      case 'create':
        logger.info(`Websocket Change Event: Create ${msg.object.type} ${msg.object.id}`);
        logger.debug(msg.data);
        this._handleCreate(msg);
        break;
      case 'delete':
        logger.info(`Websocket Change Event: Delete ${msg.object.type} ${msg.object.id}`);
        logger.debug(msg.data);
        this._handleDelete(msg);
        break;
      case 'update':
        logger.info(`Websocket Change Event: Patch ${msg.object.type} ${msg.object.id}: ${msg.data.map(op => op.property).join(', ')}`);
        logger.debug(msg.data);
        this._handlePatch(msg);
        break;
    }
  }

  /**
   * Process a create object message from the server
   *
   * @method _handleCreate
   * @private
   * @param  {Object} msg
   */
  _handleCreate(msg) {
    msg.data.fromWebsocket = true;
    const obj = Client._createObject(msg.data);
    if (obj) obj._loadType = 'websocket';
  }

  /**
   * Handles delete object messages from the server.
   * All objects that can be deleted from the server should
   * provide a _deleted() method to be called prior to destroy().
   *
   * @method _handleDelete
   * @private
   * @param  {Object} msg
   */
  _handleDelete(msg) {
    const entity = this.getObject(msg);
    if (entity) {
      entity._handleWebsocketDelete(msg.data);
    }
  }

  /**
   * On receiving an update/patch message from the server
   * run the LayerParser on the data.
   *
   * @method _handlePatch
   * @private
   * @param  {Object} msg
   */
  _handlePatch(msg) {
    // Can only patch a cached object
    const entity = this.getObject(msg);
    if (entity) {
      try {
        entity._inLayerParser = true;
        Util.layerParse({
          object: entity,
          type: msg.object.type,
          operations: msg.data,
        });
        entity._inLayerParser = false;
      } catch (err) {
        logger.error('websocket-manager: Failed to handle event', msg.data);
      }
    } else {
      switch (Util.typeFromID(msg.object.id)) {
        case 'channels':
        case 'conversations':
          if (Container._loadResourceForPatch(msg.data)) Client.getObject(msg.object.id, true);
          break;

        case 'messages':
          if (Message._loadResourceForPatch(msg.data)) Client.getMessage(msg.object.id, true);
          break;
        case 'announcements':
          break;
      }
    }
  }

  /**
   * Get the object specified by the `object` property of the websocket packet.
   *
   * @method getObject
   * @private
   * @param  {Object} msg
   * @return {Layer.Core.Root}
   */
  getObject(msg) {
    return Client.getObject(msg.object.id);
  }

  /**
   * Not required, but destroy is best practice
   * @method destroy
   */
  destroy() {
  }
}

/**
 * The Client that owns this.
 * @property {Layer.Core.Client}
 */
WebsocketChangeManager.prototype.client = null;

module.exports = Core.Websockets.ChangeManager = WebsocketChangeManager;
