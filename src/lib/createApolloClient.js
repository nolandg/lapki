/* eslint-disable no-use-before-define */
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { BatchHttpLink } from 'apollo-link-batch-http';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import fetch from 'isomorphic-fetch';
import { onError } from 'apollo-link-error';
import chalk from 'chalk';

const USE_BATCH_HTTP_LINK = false;

const httpLinkSettings = {
  uri: 'http://localhost:1337/graphql',
  credentials: 'same-origin',
  fetch,
  fetchOptions: {
    batchMax: 10,
    batchInterval: 10,
  },
};

const httpLink = USE_BATCH_HTTP_LINK ? new BatchHttpLink(httpLinkSettings) : createHttpLink(httpLinkSettings);

// GraphQl error handling
const errorLink = onError(({ graphQLErrors, networkError }) => {
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

// Create the Apollo Client
function createApolloClient({ ssrMode }) {
  return new ApolloClient({
    ssrMode,
    link,
    cache: ssrMode
      ? new InMemoryCache()
      : new InMemoryCache().restore(window.__APOLLO_STATE__),
  });
}


export default createApolloClient;
