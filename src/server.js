import 'babel-polyfill';

import createApolloClient from './lib/createApolloClient.js';
import Document from './lib/Document.js';
import queryManager from './lib/queryManager';
import withReactiveQuery from './lib/withReactiveQuery';

module.exports = {
  createApolloClient,
  Document,
  withReactiveQuery,
  queryManager,
};
