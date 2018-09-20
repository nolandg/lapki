import 'babel-polyfill';

import startClientApp from './lib/boot/startClientApp';
import common from './lib/common';

module.exports = {
  startClientApp,
  ...common,
};
