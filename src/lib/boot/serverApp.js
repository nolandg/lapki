import express from 'express';
import { render } from '@jaredpalmer/after';
import { renderToString } from 'react-dom/server';
import { getDataFromTree } from 'react-apollo';
import stringifySafe from 'json-stringify-safe';
import chalk from 'chalk';
import qatch from 'await-to-js';

import createApolloClient from './createApolloClient';
import { Document, getInitialProps, render as documentRender } from './Document';

export { Document, getInitialProps, documentRender as render, createApolloClient };

export const create = (options, server) => {
  if(!server) server = express();
  const defaultOptions = {
    muiTheme: null,
    routes: [],
    razzlePublicDir: '',
    razzleAssetsManifestPath: '',
    apolloClientOptions: {},
    customGetInitialPropsArgs: {},
    isDataTreeErrorFatal: error => false,
    customRenderer: null,
    onError: null,
    overrideDefaultErrorHandler: false,
    disablePoweredByExpress: true,
    disablePoweredByLapki: false,
    appHeaders: {}, // object of form {field1: value1, field2: value2} or a function returning such an object
    document: Document,
  };
  options = { ...defaultOptions, ...options };
  options.apolloClientOptions = { ...options.apolloClientOptions, ssrMode: true };

  const assets = require(options.razzleAssetsManifestPath);

  if(options.disablePoweredByExpress) server.disable('x-powered-by');

  server
    .use(express.static(options.razzlePublicDir))
    .get('/', async (req, res, next) => {
      if(!options.disablePoweredByLapki) res.set('Powered-By', 'Lapki');
      if(typeof options.appHeaders === 'function') res.set(options.appHeaders(req, res));
      else res.set(options.appHeaders);

      const client = createApolloClient(options.apolloClientOptions, req);

      const customRenderer = async (node) => {
        const App = node;

        const [treeError] = await qatch(getDataFromTree(App));
        if(treeError) {
          let errorStr;
          if(treeError instanceof Error) errorStr = treeError.stack;
          else errorStr = stringifySafe(treeError, null, 2);
          console.error(chalk.yellow('------------ Error getting data from tree: -----------------'));
          console.error(chalk.yellow(errorStr));
          console.error(chalk.yellow('------------------------------------------------------------'));

          if(options.isDataTreeErrorFatal(treeError)) throw treeError;
        }

        const initialApolloState = client.extract();
        const html = renderToString(App);
        return { html, initialApolloState, error: treeError };
      };

      try {
        const html = await render({
          req,
          res,
          routes: options.routes,
          assets,
          customRenderer: options.customRenderer || customRenderer,
          document: options.document,
          muiTheme: options.muiTheme,
          apolloClient: client,
          ...options.customGetInitialPropsArgs,
        });
        res.send(html);
      } catch (error) {
        if(options.onError) options.onError(error, res);
        if(options.overrideDefaultErrorHandler) return;

        let errorStr;
        if(error instanceof Error) errorStr = error.stack;
        else errorStr = stringifySafe(error, null, 2);
        console.log(chalk.red('------------------------------ Error server rendering page ------------------------------'));
        console.log(chalk.red(errorStr));
        console.log(chalk.red('-----------------------------------------------------------------------------------------'));
      } finally {
        next();
      }
    });

  return server;
};
