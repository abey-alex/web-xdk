if (global.Layer) throw new Error('You appear to have multiple copies of the Layer Web XDK loaded at the same time');


import Constants from './constants';
import Core from './core';
import Util from './util';
import version from './version';

function init(options) {
  const client = new Core.Client(options);
  return client;
}

module.exports = { Core, Util, Constants, init, version };
if (typeof global !== 'undefined') global.Layer = global.layer = module.exports;