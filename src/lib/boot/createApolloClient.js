/* eslint-disable no-use-before-define */
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { BatchHttpLink } from 'apollo-link-batch-http';
import { createHttpLink } from 'apollo-link-http';
import { setContext } from 'apollo-link-context';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { onError } from 'apollo-link-error';
import chalk from 'chalk';
import { isBrowser } from 'browser-or-node';
import { withClientState } from 'apollo-link-state';
import fetch from 'node-fetch';

// Create the Apollo Client
function createApolloClient(options, request) {
  const defaultOptions = {
    ssrMode: false,
    uri: 'http://localhost:4000/graphql',
    useBatchHttpLink: false,
    batchMax: 10,
    batchInterval: 100,
    onError: null,
    overrideDefaultErrorHandler: false,
  };
  options = { ...defaultOptions, ...options };

  const cache = options.ssrMode
    ? new InMemoryCache()
    : new InMemoryCache().restore(window.__APOLLO_STATE__);

  //* ************** HTTP Link ***************
  const httpLinkSettings = {
    uri: options.uri,
    credentials: 'include',
    fetch: !isBrowser ? fetch : undefined,
  };

  if(!isBrowser) {
    httpLinkSettings.headers = {
      cookie: request.headers.cookie,
    };
  }

  const httpLink = options.useBatchHttpLink ? new BatchHttpLink(httpLinkSettings) : createHttpLink(httpLinkSettings);

  //* ************** Error Link ***************
  const errorLink = onError(({ graphQLErrors, networkError }) => {
    if(options.onError) options.onGraphqlError({ graphQLErrors, networkError });
    if(options.overrideDefaultErrorHandler) return;

    if (graphQLErrors) {
      graphQLErrors.forEach(({ message, locations, path }) => {
        console.error(chalk.red('\n[GraphQL Link Error]'));
        console.error(`${chalk.blue('\tMessage: ')}${message}`);
        console.error(chalk.blue('\tLocations: '));
        if(locations) {
          locations.forEach(({ line, column }) => {
            console.error(`${chalk.blue('\t\tLine: ')}${line}${chalk.blue(' Column: ')}${column}`);
          });
        }
        console.error(`${chalk.blue('\tPath: ')}${path}`);
      });
    }

    if(networkError) {
      console.error(chalk.red('\n[GraphQL Link Network Error]'));
      console.error(`${chalk.blue('\tMessage: ')}${networkError}`);
    }
  });

  //* ************** Context link for auth ***************
  // Add the auth token to the headers with context link only if we're on the browser
  // Compose the http and error links
  const authLink = setContext((dunno, ctx) => {
    let { headers } = ctx;

    if(isBrowser) {
      // get the authentication token from local storage and add to headers
      const token = window.localStorage.getItem('lapki_auth_token');
      if(token) headers = { ...headers, Authorization: `Bearer ${token}` };
    }

    // add the CSRF header
    headers = { ...headers, 'x-requested-with': 'XmlHttpRequest' };

    return { headers };
  });

  //* ************** Local state link ***************
  const stateLinkDefaults = {};
  const stateLink = withClientState({
    cache,
    defaults: stateLinkDefaults,
  });

  //* ************** Build composed link **************
  const links = [authLink, stateLink, errorLink, httpLink];
  const link = ApolloLink.from(links);

  return new ApolloClient({
    ssrMode: options.ssrMode,
    link,
    cache,
  });
}


export default createApolloClient;
