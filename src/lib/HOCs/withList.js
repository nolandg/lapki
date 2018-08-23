/**
 * HOC to provide a reactive query that registers itself with the mutation handler
   and refetches the query when needed.

   Takes query and variables as arguments.


   eg: withReactiveQuery(POSTS_QUERY, { start: 0, limit: 3 })(PostsList);
 */

import React, { Component } from 'react';
import { graphql } from 'react-apollo';
import gql from 'graphql-tag';
import pluralize from 'pluralize';
// import PropTypes from 'prop-types';

import { pascalToCamel } from '../utils/stringUtils';
// import queryManager from '../utils/queryManager';
// import gqlError from '../utils/gqlError';

function withListFactory(collection, options) {
  function withList(WrappedComponent) {
    class withListClass extends Component {
      render() {
        const { ...rest } = this.props;
        return <WrappedComponent {...rest} />;
      }
    }

    options = {
      fragmentName: 'default',
      graphqlOptions: {
        errorPolicy: 'none',
        variables: options && options.variables ? options.variables : {},
        ...(options && options.graphqlOptions ? options.graphqlOptions : {}),
      },
      ...options,
    };
    const { fragmentName, graphqlOptions } = options;
    const queryTitle = `${pluralize.plural(collection.type)}List`;
    const queryName = pluralize.plural(pascalToCamel(collection.type));
    const fragment = collection.fragments[fragmentName];
    const fragmentDefinitionName = fragment.definitions[0].name.value;

    const query = gql`
      ${fragment}

      query ${queryTitle}
      {
        ${queryName}{
          ...${fragmentDefinitionName}
        }
      }
    `;

    return graphql(query, {
      options: graphqlOptions,
    })(withListClass);
  }

  return withList;
}

export { withListFactory };
