import React from 'react';
import { hydrate } from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { ensureReady, After } from '@jaredpalmer/after';
import { ApolloProvider } from 'react-apollo';
import { MuiThemeProvider, createGenerateClassName } from '@material-ui/core/styles';
import { SheetsRegistry } from 'react-jss/lib/jss';
import { JssProvider } from 'react-jss';

import { UserContextProvider } from '../contexts/UserContext';
import createApolloClient from './createApolloClient';

export default function startClientApp({ routes, muiTheme, apolloClientOptions }) {
  const sheetsRegistry = new SheetsRegistry();
  const sheetsManager = new WeakMap();
  const generateClassName = createGenerateClassName();
  const defaultApolloClientOptions = {
    ssrMode: false,
  };
  const client = createApolloClient({ ...defaultApolloClientOptions, ...apolloClientOptions });

  ensureReady(routes).then(data => hydrate(
    <JssProvider registry={sheetsRegistry} generateClassName={generateClassName}>
      <MuiThemeProvider sheetsManager={sheetsManager} theme={muiTheme}>
        <ApolloProvider client={client}>
          <BrowserRouter>
            <UserContextProvider>
              <After data={data} routes={routes} />
            </UserContextProvider>
          </BrowserRouter>
        </ApolloProvider>
      </MuiThemeProvider>
    </JssProvider>,
    document.getElementById('root'),
  ));
}
