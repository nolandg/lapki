import React, { Component } from 'react';
import PropTypes from 'prop-types';


const RequestContext = React.createContext();
const RequestContextConsumer = RequestContext.Consumer;

class RequestContextProvider extends Component {
  render() {
    const { children, request } = this.props;

    const value = {
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : request ? request.get('User-Agent') : '',
    };

    return <RequestContext.Provider value={value}>{children}</RequestContext.Provider>;
  }
}

RequestContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
  request: PropTypes.object,
};
RequestContextProvider.defaultProps = {
  request: null,
};

export { RequestContext, RequestContextProvider, RequestContextConsumer };
