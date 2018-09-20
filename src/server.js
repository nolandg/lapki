import 'babel-polyfill';

import * as serverApp from './lib/boot/serverApp';
import common from './lib/common';

module.exports = {
  serverApp,
  ...common,
};
