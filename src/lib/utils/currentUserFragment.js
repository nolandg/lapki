import gql from 'graphql-tag';

export default gql`
  fragment PermissionFragment on Permission{
    id
    name
    title
    description
  }

  fragment RoleFragment on Role{
    id
    name
    title
    description
    permissions{
      ...PermissionFragment
    }
  }

  fragment CurrentUserFragment on User{
    id
    name
    email
    isAuthenticated
    isAnnon
    lastLogin
    roles {
      ...RoleFragment
      roles{
        ...RoleFragment
      }
    }
  }
`;
