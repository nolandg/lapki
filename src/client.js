import 'babel-polyfill';

import common from './lib/common';
import startClientApp from './lib/boot/startClientApp';

module.exports = {
  startClientApp,
  ...common,
};
