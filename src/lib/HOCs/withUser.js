import React from 'react';
import { withApollo } from 'react-apollo';
import PropTypes from 'prop-types';

import { UserContextConsumer } from '../contexts/UserContext';

const deleteAuthCookie = () => {
  document.cookie = 'lapki_auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
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
        <UserContextConsumer>
          { (value) => {
            const { user, loading, error } = value;

            return (
              <WrappedComponent
                isAuthenticated={user && user.isAuthenticated}
                currentUser={user}
                currentUserLoading={loading}
                currentUserError={error}
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
