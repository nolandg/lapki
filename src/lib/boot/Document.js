/* eslint-disable no-shadow */
import * as React from 'react';
import { AfterRoot, AfterData } from '@jaredpalmer/after';
import { ApolloProvider } from 'react-apollo';
import qatch from 'await-to-js';
import PropTypes from 'prop-types';
import { JssProvider } from 'react-jss';
import { SheetsRegistry } from 'react-jss/lib/jss';
import { MuiThemeProvider, createGenerateClassName, jssPreset } from '@material-ui/core/styles';
import { create as createJss } from 'jss';
import jssExpand from 'jss-expand';

import { UserContextProvider } from '../contexts/UserContext';
import { RequestContextProvider } from '../contexts/RequestContext';

const jss = createJss({ plugins: [...jssPreset().plugins, jssExpand()] });

/**
 * The problem is After wraps our Document in ReactRouter's StaticRouter which seems to render our Document
   once with an empty this.context and then again with this.context.router. This causes JssProvider
   to run all components through the name generator twice thus royaly fucking things up.
   So we prevent this by restarting the name generator and (maybe redundantly)
   passing a flag to tell JssProvider to skip name generation.
 */
class RerenderGuard extends React.Component {
  render() {
    const { sheetsRegistry, children } = this.props;
    const sheetsManager = new WeakMap();
    const generateClassName = createGenerateClassName();

    const disableStylesGeneration = !!(this.context && this.context.router);

    sheetsRegistry.reset();

    return children({ generateClassName, sheetsManager, disableStylesGeneration });
  }
}
RerenderGuard.propTypes = {
  children: PropTypes.func.isRequired,
  sheetsRegistry: PropTypes.object.isRequired,
};
RerenderGuard.defaultProps = {
};

export const getInitialProps = async ({ assets, data, renderPage, muiTheme, apolloClient, production, req }) => {
  const sheetsRegistry = new SheetsRegistry();
  const [error, page] = await qatch(renderPage(After => props => (
    <RerenderGuard sheetsRegistry={sheetsRegistry}>
      {({ sheetsManager, generateClassName, disableStylesGeneration }) => (
        <JssProvider
          registry={sheetsRegistry}
          generateClassName={generateClassName}
          jss={jss}
          disableStylesGeneration={disableStylesGeneration}
        >
          <MuiThemeProvider sheetsManager={sheetsManager} theme={muiTheme}>
            <ApolloProvider client={apolloClient}>
              <RequestContextProvider request={req}>
                <UserContextProvider>
                  <After {...props} />
                </UserContextProvider>
              </RequestContextProvider>
            </ApolloProvider>
          </MuiThemeProvider>
        </JssProvider>
      )}
    </RerenderGuard>
  )));

  if(error) {
    // ToDo: decide if error is fatal?
    const fatal = true;
    if(fatal) {
      throw error;
    }
  }
  return { assets, data, error, sheetsRegistry, ...page };
};

// eslint-disable-next-line react/prop-types
export const render = ({ helmet, assets, data, initialApolloState, sheetsRegistry }) => {
  // get attributes from React Helmet
  const htmlAttrs = helmet.htmlAttributes.toComponent();
  const bodyAttrs = helmet.bodyAttributes.toComponent();
  const css = sheetsRegistry.toString();

  return (
    <html {...htmlAttrs} lang="en">
      <head>
        <meta name="Made With Love By: " content="Noland Germain" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#000000" />
        {helmet.title.toComponent()}
        {helmet.meta.toComponent()}
        {helmet.link.toComponent()}
        {assets.client.css && (
          <link rel="stylesheet" href={assets.client.css} />
        )}
        <style type="text/css" id="jss-server-side" dangerouslySetInnerHTML={{ __html: css }} />
      </head>
      <body {...bodyAttrs}>
        <AfterRoot />
        <AfterData data={data} />
        <script dangerouslySetInnerHTML={{ __html: `window.__APOLLO_STATE__=${JSON.stringify(initialApolloState).replace(/</g, '\\u003c')};` }} />
        <script type="text/javascript" src={assets.client.js} defer crossOrigin="anonymous" />
      </body>
    </html>
  );
};

export class Document extends React.Component {
  static async getInitialProps(args) {
    return getInitialProps(args);
  }

  render() {
    const { helmet, assets, data, initialApolloState, sheetsRegistry, error } = this.props;
    return render({ helmet, assets, data, initialApolloState, sheetsRegistry, error });
  }
}

Document.propTypes = {
  helmet: PropTypes.object.isRequired,
  assets: PropTypes.object.isRequired,
  data: PropTypes.object,
  initialApolloState: PropTypes.object.isRequired,
  error: PropTypes.object,
  sheetsRegistry: PropTypes.any.isRequired,
};
Document.defaultProps = {
  data: null,
  error: null,
};
