import gql from 'graphql-tag';

export default gql`
  fragment CurrentUserFragment on User{
    id
    name
    email
    lastLogin
    roles {
      id
      name
      title
      description
      permissions {
        id
        name
        title
        description
      }
      roles {
        id
        name
        title
        description
        permissions {
          id
          name
          title
          description
        }
        roles {
          id
          name
          title
          description
          permissions {
            id
            name
            title
            description
          }
          roles {
            id
            name
            title
            description
            permissions {
              id
              name
              title
              description
            }
            roles {
              id
              name
              title
              description
              permissions {
                id
                name
                title
                description
              }
            }
          }
        }
      }
    }
  }
`;
