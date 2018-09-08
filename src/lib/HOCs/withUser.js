import React from 'react';
import { withApollo } from 'react-apollo';
import PropTypes from 'prop-types';

import { UserContext } from '../contexts/UserContext';

const deleteAuthCookie = () => {
  document.cookie = 'lapki_auth_token_insecure=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
};

const logout = (apolloClient) => {
  apolloClient.resetStore();
  deleteAuthCookie();
};

function withUser(WrappedComponent) {
  class withUserClass extends React.Component {
    render() {
      const { client } = this.props;

      return (
        <UserContext.Consumer>
          { user => (
            <WrappedComponent currentUser={user} {...this.props} logout={() => logout(client)} />
          )}
        </UserContext.Consumer>
      );
    }
  }

  withUserClass.propTypes = {
    client: PropTypes.object.isRequired,
  };

  return withApollo(withUserClass);
}


export { withUser };
