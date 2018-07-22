import React from 'react';
import express from 'express';
import { render } from '@jaredpalmer/after';
import { renderToString } from 'react-dom/server';
import { ApolloProvider, getDataFromTree } from 'react-apollo';
import stringifySafe from 'json-stringify-safe';
import chalk from 'chalk';
import qatch from 'await-to-js';
import Youch from 'youch';

import createApolloClient from './createApolloClient';
import Document from './Document';

function configureServerApp(server, options) {
  const defaultOptions = {
    muiTheme: null,
    routes: [],
    razzlePublicDir: '',
    razzleAssetsManifestPath: '',
    apolloClientOptions: {},
    customGetInitialPropsArgs: {},
    isDataTreeErrorFatal: error => false, /* eslint-disable-line no-unused-vars */
    customRenderer: null,
    onError: null,
    overrideDefaultErrorHandler: false,
  };
  options = { ...defaultOptions, ...options };

  const assets = require(options.razzleAssetsManifestPath);

  server
    .use(express.static(options.razzlePublicDir))
    .get('/*', async (req, res) => {
      const client = createApolloClient({ ssrMode: true });

      const customRenderer = async (node) => {
        const App = <ApolloProvider client={client}>{node}</ApolloProvider>;

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
          document: Document,
          muiTheme: options.muiTheme,
          ...options.customGetInitialPropsArgs,
        });
        res.send(html);
      } catch (error) {
        if(options.onError) options.onError(error, res);
        if(options.overrideDefaultErrorHandler) return;

        const youch = new Youch(error, req);

        youch
          .toHTML()
          .then((html) => {
            res.send(html);
          });

        let errorStr;
        if(error instanceof Error) errorStr = error.stack;
        else errorStr = stringifySafe(error, null, 2);
        console.log(chalk.red('------------------------------ Error server rendering page ------------------------------'));
        console.log(chalk.red(errorStr));
        console.log(chalk.red('-----------------------------------------------------------------------------------------'));
      }
    });
}

export default configureServerApp;
