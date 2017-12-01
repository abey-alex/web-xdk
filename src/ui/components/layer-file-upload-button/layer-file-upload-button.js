/**
 * The Layer file upload button widget allows users to select a File to send.
 *
 * Its assumed that this button will be used within the layer.UI.components.ComposeButtonPanel:
 *
 * ```
 * myConversationPanel.composeButtons = [
 *    document.createElement('layer-file-upload-button')
 * ];
 * ```
 *
 * * Generates a `layer-files-selected` event when files are selected, prior to generating models; you can call `evt.preventDefault()` on this event to prevent further processing
 * * Generates a `layer-model-generated` event after generating models from the selected files. This event is received by
 *   the Compose Bar if this widget is inside of the Compose Bar, and it will handle this event.  You can intercept
 *   this event and call `evt.stopPropgation()` to prevent the Compose Bar from receiving this event.
 *
 * @class layer.UI.components.FileUploadButton
 * @extends Layer.UI.components.Component
 */
import Layer, { MessagePart } from '../../../core';
import Util from '../../../util';
import layerUI from '../../base';
import { registerComponent } from '../component';
import Clickable from '../../mixins/clickable';

registerComponent('layer-file-upload-button', {
  mixins: [Clickable],
  properties: {
    /**
     * Set the `accept` attribute of the file upload widget.
     *
     * For more info, see https://www.w3schools.com/tags/att_input_accept.asp
     *
     * Possible value: `image/*,video/*`
     *
     * @property {String} [accept=*\/*]
     */
    accept: {
      set(newValue) {
        this.nodes.input.accept = newValue;
      },
    },

    /**
     * Allow multiple files to be selected.
     *
     * Note that some older browsers that are supported by this framework do not support `multiple`,
     * see https://caniuse.com/#feat=input-file-multiple
     *
     * @property {Boolean} [multiple=false]
     */
    multiple: {
      type: Boolean,
      set(newValue) {
        this.nodes.input.multiple = newValue;
      }
    },
  },
  methods: {

    /**
     * Constructor.
     *
     * @method onCreate
     * @private
     */
    onCreate() {
      this.nodes.input.id = Util.generateUUID();
      this.nodes.label.setAttribute('for', this.nodes.input.id);
      this.nodes.input.addEventListener('change', this.onChange.bind(this));

      // This causes test to fail by causing the click event to fire twice.
      // but without this, the click event is not received at all.
      this.addClickHandler('button-click', this, (evt) => {
        if (evt.target !== this.nodes.input) this.nodes.input.click();
      });
    },

    /**
     * MIXIN HOOK: When the file input's value has changed, gather the data and trigger an event.
     *
     * If adding a mixin here to change behaviors on selecting a file, you can use `this.nodes.input.files` to access
     * the selected files.
     *
     * @method
     */
    onChange() {
      const files = Array.prototype.slice.call(this.nodes.input.files);

      /**
       * This event is triggered when files are selected, but before Message Type Models are generated for those files.
       *
       * You can prevent any further processing of these files with `evt.preventDefault()`
       *
       * ```
       * document.body.addEventListener('layer-files-selected', function(evt) {
       *    // prevent further processing
       *    evt.preventDefault();
       *
       *    // Generate and send a message from the files
       *    var files = evt.detail.files;
       *    var parts = files.map(file => new layer.Core.MessagePart({ body: file }));
       *    conversation.createMessage({ parts }).send();
       * });
       * ```
       *
       * You can alter the `files` array as needed prior to doing further processing.
       *
       * ```
       * document.body.addEventListener('layer-files-selected', function(evt) {
       *    var files = evt.detail.files;
       *    for (var i = files.length - 1; i >= 0; i--) {
       *        // Remove any file whose size is greater than ~100K
       *        if (files[i].size > 100000) files.splice(i, 1);
       *    }
       * });
       * ```
       *
       * @event layer-files-selected
       * @param {Object} evt
       * @param {Object} evt.detail
       * @param {layer.CardModel[]} evt.detail.models
       */
      if (this.trigger('layer-files-selected', { files })) {
        const imageTypes = ['image/gif', 'image/png', 'image/jpeg', 'image/svg'];
        const ImageModel = Layer.Client.getMessageTypeModelClass('ImageModel');
        const FileModel = Layer.Client.getMessageTypeModelClass('FileModel');

        const models = files.map((file) => {
          const options = { source: file };
          if (files.length > 1 && file.name) {
            options.title = file.name;
          }
          if (imageTypes.indexOf(file.type) !== -1) {
            return new ImageModel(options);
          } else {
            return new FileModel(options);
          }
        });

        /**
         * This widget triggers a `layer-model-generated` event when the user selects files.
         * This event is captured and stopped from propagating by the Layer.UI.components.ComposeBar.
         * If using it outside of the composer, this event can be used to receive the MessageParts generated
         * for the selected files.
         *
         * @event layer-model-generated
         * @param {Object} evt
         * @param {Object} evt.detail
         * @param {Layer.Core.MessageTypeModel[]} evt.detail.models
         */
        this.trigger('layer-model-generated', { models });
      }
    },
  },
});
