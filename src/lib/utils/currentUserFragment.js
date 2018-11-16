import gql from 'graphql-tag';

export default gql`
  fragment RoleFragment on Role {
    id
    name
    title
    description
    permissions
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
