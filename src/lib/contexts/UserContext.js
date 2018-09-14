import React, { Component } from 'react';
import gql from 'graphql-tag';
import { Query } from 'react-apollo';
import PropTypes from 'prop-types';

import { Mutator } from '../components/Mutator';
// import currentUserFragment from '../utils/currentUserFragment';
import buildAnnonUser from '../utils/buildAnnonUser';
import attachUserAuthMethods from '../utils/attachUserAuthMethods';

const currentUserFragment = gql`
  fragment PermissionFragment on Permission {
    id
    name
    title
  }

  fragment CurrentUserFragment on User{
    id
    name
    email
    isAuthenticated
    isAnnon
    roles {
      id
      name
      title
      permissions {
        ...PermissionFragment
      }
      roles {
        id
        name
        title
        permissions {
          id
          name
          title
        }
      }
    }
  }
`;

const currentUserQuery = gql`
  ${currentUserFragment}

  query CurrentUser_for_UserContext{
    currentUser {
      ...CurrentUserFragment
    }
  }
`;
Mutator.registerQuery('CurrentUser_for_UserContext');

const UserContext = React.createContext();

class UserContextProvider extends Component {
  render() {
    const { children } = this.props;
    console.log('UserContext rendering...');

    return (
      <Query query={currentUserQuery} errorPolicy="all" notifyOnNetworkStatusChange>
        {({ networkStatus, error, data }) => {
          console.log('Query render prop of UserContext rendering...');
          let user;

          if(data && data.currentUser) {
            user = { ...data.currentUser };
          }else{
            user = buildAnnonUser();
          }
          attachUserAuthMethods(user);

          Object.freeze(user);

          const value = {
            loading: networkStatus !== 7,
            error,
            user,
          };

          return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
        }}
      </Query>
    );
  }
}

UserContextProvider.propTypes = {
  children: PropTypes.node.isRequired,
};


export { UserContext, UserContextProvider };
