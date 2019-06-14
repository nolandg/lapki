import React from 'react';
import { withApollo } from 'react-apollo';
import PropTypes from 'prop-types';

import { UserContextConsumer } from '../contexts';

const deleteAuthCookie = () => {
  document.cookie = 'lapki_auth_token2=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.powellriver.ca';
  document.cookie = 'lapki_auth_token2=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=api.powellriver.ca';
};

const logout = (apolloClient) => {
  deleteAuthCookie();
  apolloClient.resetStore();
};

function withUser(WrappedComponent) {
  class withUserClass extends React.Component {
    render() {
      const { client } = this.props;

      return (
        <UserContextConsumer>
          {(value) => {
            const { user, loading, error, allPermissions } = value;

            return (
              <WrappedComponent
                isAuthenticated={user && user.isAuthenticated}
                currentUser={user}
                currentUserLoading={loading}
                currentUserError={error}
                allPermissions={allPermissions}
                logout={() => logout(client)}
                {...this.props}
              />
            );
          }}
        </UserContextConsumer>
      );
    }
  }

  withUserClass.propTypes = {
    client: PropTypes.object.isRequired,
  };

  return withApollo(withUserClass);
}


export { withUser };
