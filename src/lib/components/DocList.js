/**
 * HOC to provide a reactive query that registers itself with the mutation handler
   and refetches the query when needed.

   Takes query and variables as arguments.


   eg: withReactiveQuery(POSTS_QUERY, { start: 0, limit: 3 })(PostsList);
 */

import React, { Component } from 'react';
import { Query } from 'react-apollo';
import gql from 'graphql-tag';
import pluralize from 'pluralize';
import PropTypes from 'prop-types';

import { pascalToCamel } from '../utils/stringUtils';
// import queryManager from '../utils/queryManager';
// import gqlError from '../utils/gqlError';

class DocList extends Component {
  buildQuery = (collection, fragmentName) => {
    const queryTitle = `${pluralize.plural(collection.type)}List`;
    const queryName = pluralize.plural(pascalToCamel(collection.type));
    const fragment = collection.fragments[fragmentName];
    const fragmentDefinitionName = fragment.definitions[0].name.value;

    return gql`
      ${fragment}

      query ${queryTitle}
      {
        ${queryName}{
          ...${fragmentDefinitionName}
        }
      }
    `;
  }

  renderLoading = result => <div>Loading...</div>

  renderError = (error, result) => <div>Error: {error.message}</div>

  renderProp = (result) => {
    const { renderDoc, render } = this.props;
    const { data, loading, error } = result;
    result.docs = result.data;
    delete result.data;

    if(render) return render(result);

    const renderError = this.props.renderError || this.renderError;
    const renderLoading = this.props.renderLoading || this.renderLoading;

    if(error) {
      renderError(error, result);
    }
    if(loading) {
      renderLoading(result);
    }

    if(renderLoaded) return(renderLoaded(docs, result));
    if(renderDoc) {
      return (
        <div>{}</div>
      );
    }

    throw new Error('Must pass one of render, renderLoaded, or renderDoc to <DocList>.');
  }

  render() {
    const { collection, fragmentName, variables, errorPolicy, ...rest } = this.props;
    const query = this.buildQuery(collection, fragmentName);

    return <Query query={query} variables={variables} errorPolicy={errorPolicy} {...rest} children={this.renderProp} />;
  }
}

DocList.propTypes = {
  collection: PropTypes.object.isRequired,
  fragmentName: PropTypes.string,
  variables: PropTypes.object,
  errorPolicy: PropTypes.string,
};
DocList.defaultProps = {
  fragmentName: 'default',
  variables: {},
  errorPolicy: 'none',
};


export { DocList };
