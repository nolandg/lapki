/* eslint-disable no-use-before-define */
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { BatchHttpLink } from 'apollo-link-batch-http';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import fetch from 'isomorphic-fetch';
import { onError } from 'apollo-link-error';
import chalk from 'chalk';

// Create the Apollo Client
function createApolloClient(options) {
  const defaultOptions = {
    ssrMode: false,
    uri: 'http://localhost:4000',
    useBatchHttpLink: true,
    batchMax: 10,
    batchInterval: 10,
    onError: null,
    overrideDefaultErrorHandler: false,
  };
  options = { ...defaultOptions, ...options };

  const httpLinkSettings = {
    uri: options.uri,
    credentials: 'same-origin',
    fetch,
    fetchOptions: {
      batchMax: options.batchMax,
      batchInterval: options.batchInterval,
    },
  };

  const httpLink = options.useBatchHttpLink ? new BatchHttpLink(httpLinkSettings) : createHttpLink(httpLinkSettings);

  // GraphQl error handling
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if(options.onError) options.onGraphqlError({ graphQLErrors, networkError });
    if(options.overrideDefaultErrorHandler) return;

    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        console.error(chalk.red('\n[GraphQL Link Error]'));
        console.error(`${chalk.blue('\tMessage: ')}${message}`);
        console.error(chalk.blue('\tLocations: '));
        locations.forEach(({ line, column }) => {
          console.error(`${chalk.blue('\t\tLine: ')}${line}${chalk.blue(' Column: ')}${column}`);
        });
        console.error(`${chalk.blue('\tPath: ')}${path}`);
      });
    }

    if(networkError) {
      console.error(chalk.red('\n[GraphQL Link Network Error]'));
      console.error(`${chalk.blue('\tMessage: ')}${networkError}`);
    }
  });

  // Compose the http and error links
  const link = ApolloLink.from([
    errorLink,
    httpLink,
  ]);

  return new ApolloClient({
    ssrMode: options.ssrMode,
    link,
    cache: options.ssrMode
      ? new InMemoryCache()
      : new InMemoryCache().restore(window.__APOLLO_STATE__),
  });
}


export default createApolloClient;
