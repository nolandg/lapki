import React from 'react';
import { withApollo } from 'react-apollo';
import PropTypes from 'prop-types';

import { UserContext } from '../contexts/UserContext';

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
        <UserContext.Consumer>
          { (value) => {
            console.log('@@@@@ Consumer value: ', value);
            console.log('UserContext: ', UserContext);
            console.log('UserContext.Consumer: ', UserContext.Consumer);
            // const { user, loading, error } = value;
            const user = null;
            const error = null;
            const loading = false;

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
