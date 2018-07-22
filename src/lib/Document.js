/* eslint-disable no-shadow */
import * as React from 'react';
import { AfterRoot, AfterData } from '@jaredpalmer/after';
import qatch from 'await-to-js';
import PropTypes from 'prop-types';
import { JssProvider } from 'react-jss';
import { SheetsRegistry } from 'react-jss/lib/jss';
import { MuiThemeProvider, createGenerateClassName } from '@material-ui/core/styles';
// import { MuiThemeProvider, createGenerateClassName, createMuiTheme } from '@material-ui/core/styles';

const sheetsRegistry = new SheetsRegistry();
const sheetsManager = new WeakMap();
const generateClassName = createGenerateClassName();

class Document extends React.Component {
  static async getInitialProps({ assets, data, renderPage, muiTheme }) {
    const [error, page] = await qatch(renderPage(After => props => (
      <JssProvider registry={sheetsRegistry} generateClassName={generateClassName}>
        <MuiThemeProvider sheetsManager={sheetsManager} theme={muiTheme}>
          <After {...props} />
        </MuiThemeProvider>
      </JssProvider>
    )));

    if(error) {
      // ToDo: decide if error is fatal
      const fatal = true;
      if(fatal) {
        throw error;
      }
    }
    return { assets, data, error, sheetsRegistry, ...page };
  }

  render() {
    const { helmet, assets, data, initialApolloState, sheetsRegistry } = this.props;

    // get attributes from React Helmet
    const htmlAttrs = helmet.htmlAttributes.toComponent();
    const bodyAttrs = helmet.bodyAttributes.toComponent();
    return (
      <html {...htmlAttrs} lang="ene">
        <head>
          <meta name="Made With Love By: " content="Noland" />
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
          <meta charSet="utf-8" />
          <title>After with Apollo !</title>
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
          <style type="text/css" id="jss-server-side">{sheetsRegistry.toString()}</style>
        </head>
        <body {...bodyAttrs}>
          <AfterRoot />
          <AfterData data={data} />
          <script dangerouslySetInnerHTML={{ __html: `window.__APOLLO_STATE__=${JSON.stringify(initialApolloState).replace(/</g, '\\u003c')};` }} />
          <script type="text/javascript" src={assets.client.js} defer crossOrigin="anonymous" />
        </body>
      </html>
    );
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

export default Document;
