/* eslint-disable camelcase */
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { BatchHttpLink } from 'apollo-link-batch-http';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { onError } from 'apollo-link-error';
import chalk from 'chalk';
import { withClientState } from 'apollo-link-state';


// Create the Apollo Client
function createApolloClient(options, request) {
  const defaultOptions = {
    ssrMode: false,
    uri: 'http://localhost:4000/graphql',
    useBatchHttpLink: true,
    batchMax: 10,
    batchInterval: 100,
    onError: null,
    overrideDefaultErrorHandler: false,
    tokenExchangeScheme: 'cookie',
  };
  options = { ...defaultOptions, ...options };
  if(!options.target) {
    throw new Error('You must pass target (client or server) to createApolloClient options arg.');
  }

  const isServer = options.target === 'server';
  const cookie = isServer ? require('cookie') : undefined;
  // const cookie = require('cookie');
  const fetch = isServer ? require('node-fetch') : undefined;
  // const fetch = require('node-fetch');


  const cache = options.ssrMode
    ? new InMemoryCache()
    : new InMemoryCache().restore(window.__APOLLO_STATE__);

  //* ************** HTTP Link ***************
  const httpLinkSettings = {
    uri: options.uri,
    credentials: 'include',
    fetch,
  };

  const antiCsrfHeaders = { 'x-requested-with': 'XmlHttpRequest' };

  if(isServer) {
    // Server/Node
    const cookiesReceived = cookie.parse(request.headers.cookie || '');
    const { lapki_auth_token, lapki_auth_token_insecure } = cookiesReceived;
    let cookieStr = '';
    if(lapki_auth_token) {
      cookieStr += `${cookie.serialize('lapki_auth_token', lapki_auth_token)}; `;
    }
    if(lapki_auth_token_insecure) {
      cookieStr += `${cookie.serialize('lapki_auth_token_insecure', lapki_auth_token_insecure)}; `;
    }

    httpLinkSettings.headers = {
      cookie: cookieStr,
      ...antiCsrfHeaders,
    };
  }else{
    // Client/Browser
    httpLinkSettings.headers = {
      ...antiCsrfHeaders,
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

  //* ************** Local state link ***************
  const stateLinkDefaults = {};
  const stateLink = withClientState({
    cache,
    defaults: stateLinkDefaults,
  });

  //* ************** Build composed link **************
  const links = [stateLink, errorLink, httpLink];
  const link = ApolloLink.from(links);

  const apolloClientOptions = {
    ssrMode: options.ssrMode,
    link,
    cache,
  };

  return new ApolloClient(apolloClientOptions);
}


export default createApolloClient;
