/**
 * The File Message is used to share files such as PDF or other documents.
 *
 * A basic File Message can be created with:
 *
 * ```
 * FileModel = Layer.Core.Client.getMessageTypeModelClass('FileModel')
 * model = new FileModel({
 *    sourceUrl: "http://l7.alamy.com/zooms/e33f19042cbe4ec1807bba7f3720ba62/executive-in-a-strait-jacket-aakafp.jpg",
 *    title: "My new jacket",
 *    author: "Anonymous"
 * });
 * model.generateMessage(conversation, message => message.send());
 * ```
 *
 *
 * A File Model can also be created with a message from your local file system using the
 * Layer.UI.messages.FileMessageModel.source property:
 *
 * ```
 * FileModel = Layer.Core.Client.getMessageTypeModelClass('FileModel')
 * model = new FileModel({
 *    source: FileBlob
 * });
 * model.generateMessage(conversation, message => message.send());
 * ```
 *
 * ### Importing
 *
 * Not included with the standard build. Import using either:
 *
 * ```
 * import '@layerhq/web-xdk/ui/messages/file/layer-file-message-view';
 * import '@layerhq/web-xdk/ui/messages/file/layer-file-message-model';
 * ```
 *
 * @class Layer.UI.messages.FileMessageModel
 * @extends Layer.Core.MessageTypeModel
 */


import Core, { MessagePart, MessageTypeModel, Root } from '../../../core';


class FileModel extends MessageTypeModel {

  /**
   * Generate the Message Parts representing this model so that the File Message can be sent.
   *
   * @method _generateParts
   * @protected
   * @param {Function} callback
   * @param {Layer.Core.MessagePart[]} callback.parts
   */
  _generateParts(callback) {
    const source = this.source;
    let sourcePart;

    // Intialize metadata from the Blob
    if (source) {
      if (!this.title && source.name) this.title = source.name;
      if (!this.size) this.size = source.size;
      if (!this.mimeType) this.mimeType = source.type;
      this.size = source.size;
    }

    // Setup the MessagePart
    const body = this._initBodyWithMetadata(['sourceUrl', 'author', 'size', 'title', 'mimeType']);
    this.part = new MessagePart({
      mimeType: this.constructor.MIMEType,
      body: JSON.stringify(body),
    });

    // Create the source Message Part
    if (source) {
      sourcePart = new MessagePart(this.source);
      sourcePart.mimeAttributes.role = 'source';
      sourcePart.mimeAttributes['parent-node-id'] = this.part.nodeId;
      this.childParts.push(sourcePart);
    }

    callback(this.source ? [this.part, sourcePart] : [this.part]);
  }

  /**
   * Given a Layer.Core.Message, initialize this File Model.
   *
   * `_parseMessage` is called for intialization, and is also recalled
   * whenever the Message itself is modified.
   *
   * @method _parseMessage
   * @protected
   * @param {Object} payload    Metadata describing the File Message
   */
  _parseMessage(payload) {
    super._parseMessage(payload);

    // setup this.source and any other roles that should be saved as properties
    this.childParts.forEach(part => (this[part.mimeAttributes.role] = part));

    // Initialize the mimeType property if available
    if (!this.mimeType && this.source) this.mimeType = this.source.mimeType;
  }

  /**
   * Get the sourceUrl to use for fetching the File.
   *
   * ```
   * fileModel.getSourceUrl(url => window.open(url));
   * ```
   *
   * @method getSourceUrl
   * @param {Function} callback
   * @param {String} callback.url
   */
  getSourceUrl(callback) {
    if (this.sourceUrl) {
      callback(this.sourceUrl);
    } else if (this.source) {
      if (this.source.url) {
        callback(this.source.url);
      } else {
        this.source.fetchStream(url => callback(url));
      }
    } else {
      callback('');
    }
  }

  // See title property below
  __getTitle() {
    if (this.__title) return this.__title;
    //if (this.source && this.source.mimeAttributes.name) return this.source.mimeAttributes.name;
    if (this.__sourceUrl) return this._sourceUrl.replace(/.*\/(.*)$/, '$1');
    return '';
  }

  // Used by Layer.UI.messages.StandardMessageViewContainer
  getTitle() { return this.title.replace(/\..{2,5}$/, ''); }
  getDescription() { return this.author; }
  getFooter() {
    if (!this.size) return '';
    return (Math.floor(this.size / 1000)).toLocaleString() + 'K';
  }
}

/**
 * MessagePart with the file to be shared.
 *
 * The File Model may instead use `sourceUrl`; use the `getSourceUrl()` method
 * to abstract these concepts.
 *
 * @property {Layer.Core.MessagePart} source
 */
FileModel.prototype.source = null;

/**
 * URL to the file to be shared
 *
 * The File Model may instead use `source`; use the `getSourceUrl()` method
 * to abstract these concepts.
 *
 * @property {String} sourceUrl
 */
FileModel.prototype.sourceUrl = '';

/**
 * Author of the file; typically shown as the Message description.
 *
 * @property {String} author
 */
FileModel.prototype.author = '';

/**
 * Title/file-name of the file; typically shown as the Message Title.
 *
 * @property {String} title
 */
FileModel.prototype.title = '';

/**
 * Size of the file in bytes
 *
 * @property {Number} size
 */
FileModel.prototype.size = '';

/**
 * MIME Type of the file.
 *
 * @property {String} mimeType
 */
FileModel.prototype.mimeType = '';

/**
 * Textual label representing all instances of File Message.
 *
 * @static
 * @property {String} [Label=File]
 */
FileModel.Label = 'File';

/**
 * The default action when selecting this Message is to trigger an `open-file` and view the File.
 *
 * @static
 * @property {String} [defaultAction=open-file]
 */
FileModel.defaultAction = 'open-file';

/**
 * The MIME Type recognized by and used by the File Model.
 *
 * @static
 * @property {String} [MIMEType=application/vnd.layer.file+json]
 */
FileModel.MIMEType = 'application/vnd.layer.file+json';

/**
 * The UI Component to render the File Model.
 *
 * @static
 * @property {String} [messageRenderer=layer-file-message-view]
 */
FileModel.messageRenderer = 'layer-file-message-view';

// Init the class
Root.initClass.apply(FileModel, [FileModel, 'FileModel']);

// Register the Message Model Class with the Client
Core.Client.registerMessageTypeModelClass(FileModel, 'FileModel');

module.exports = FileModel;
