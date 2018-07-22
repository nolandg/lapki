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

function configureServerApp(server, {
  muiTheme,
  routes,
  razzlePublicDir,
  razzleAssetsManifestPath,
}) {
  const assets = require(razzleAssetsManifestPath);

  server
    .use(express.static(razzlePublicDir))
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

          // ToDo: Decide if error is fatal
          const fatal = false;
          if(fatal) throw treeError;
        }

        const initialApolloState = client.extract();
        const html = renderToString(App);
        return { html, initialApolloState, error: treeError };
      };

      try {
        const html = await render({
          req,
          res,
          routes,
          assets,
          customRenderer,
          document: Document,
          muiTheme,
        });
        res.send(html);
      } catch (error) {
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
