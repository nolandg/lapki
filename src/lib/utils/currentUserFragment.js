import gql from 'graphql-tag';

export default gql`
  fragment PermissionFragment on Permission {
    name
    title
    description
    type
    operation
    ownership
  }

  fragment RoleFragment on Role {
    id
    name
    title
    description
    permissions {
      ...PermissionFragment
    }
  }

  fragment CurrentUserFragment on User{
    id
    name
    email
    isAuthenticated
    isAnnon
    roles {
      ...RoleFragment
      roles {
        ...RoleFragment
        roles {
          ...RoleFragment
          roles {
            ...RoleFragment
          }
        }
      }
    }
  }
`;
