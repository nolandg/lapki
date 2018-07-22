import 'babel-polyfill';
import createApolloClient from './lib/createApolloClient.js';
import Document from './lib/Document.js';
import queryManager from './lib/queryManager';
import withReactiveQuery from './lib/withReactiveQuery';
import configureServerApp from './lib/configureServerApp';


module.exports = {
  createApolloClient,
  Document,
  withReactiveQuery,
  queryManager,
  configureServerApp,
};
