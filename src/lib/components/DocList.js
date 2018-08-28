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
import _ from 'lodash';

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

  renderNoResults = result => <div>No results to show :-(</div>

  renderFields = (doc) => {
    const fields = [];
    _.forOwn(doc, (fieldValue, fieldName) => {
      fields.push((
        <div key={fieldValue} className="field">
          <span className="field-name">{fieldName}:&nbsp;</span>
          <span className="field-value">{JSON.stringify(fieldValue)}</span>
        </div>
      ));
    });
    return fields;
  }

  renderDoc = doc => (
    <div className="doc" key={doc.id}>
      {this.renderFields(doc)}
    </div>
  )

  renderPaginationControls = (location, result) => <div>Pagination Controls Here</div>

  renderWhereControls = (location, result) => <div>Where Controls Here</div>

  renderOrderByControls = (location, result) => <div>Order By Controls Here</div>

  renderControls = (location, { renderPaginationControls, renderWhereControls, renderOrderByControls }, result) => {
    const controlsAtLocation = this.props.locations[location];

    const showPagination = controlsAtLocation.includes('pagination');
    const showWhere = controlsAtLocation.includes('where');
    const showOrderBy = controlsAtLocation.includes('order-by');

    return (
      <div className="doc-list-controls">
        {showPagination ? renderPaginationControls(location, result) : null}
        {showWhere ? renderWhereControls(location, result) : null}
        {showOrderBy ? renderOrderByControls(location, result) : null}
      </div>
    );
  }

  renderProp = (result) => {
    const { renderLoaded, render, collection } = this.props;
    const { data, loading, error } = result;

    // Normalize the result a bit
    const docsPropName = pascalToCamel(pluralize.plural(collection.type));
    result.docs = data[docsPropName];

    if(render) {
      // Parent handles rendering everything in all cases
      return render(result);
    }

    // Parents wants us to handle error and loading branching
    const renderFuncs = {
      renderDoc: this.props.renderDoc || this.renderDoc,
      renderError: this.props.renderError || this.renderError,
      renderLoading: this.props.renderLoading || this.renderLoading,
      renderControls: this.props.renderControls || this.renderControls,
      renderPaginationControls: this.props.renderPaginationControls || this.renderPaginationControls,
      renderWhereControls: this.props.renderWhereControls || this.renderWhereControls,
      renderOrderByControls: this.props.renderOrderByControls || this.renderOrderByControls,
      renderNoResults: this.props.renderNoResults || this.renderNoResults,
    };

    if(error) {
      renderFuncs.renderError(error, result);
    }
    if(loading) {
      renderFuncs.renderLoading(result);
    }

    if(renderLoaded) {
      // Parent will render everything after docs are loaded
      return(renderLoaded(result.docs, result));
    }

    // We will render individual docs using our or parent-supplied doc render function
    return (
      <div className="doc-list">
        {renderFuncs.renderControls('top', renderFuncs, result)}
        <div className="list">
          {result.docs.length
            ? result.docs.map(renderFuncs.renderDoc)
            : renderFuncs.renderNoResults(result)
          }
        </div>
        {renderFuncs.renderControls('bottom', renderFuncs, result)}
      </div>
    );
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
  renderDoc: PropTypes.func,
  renderError: PropTypes.func,
  renderLoaded: PropTypes.func,
  render: PropTypes.func,
  renderLoading: PropTypes.func,
  renderControls: PropTypes.func,
  renderPaginationControls: PropTypes.func,
  renderWhereControls: PropTypes.func,
  renderOrderByControls: PropTypes.func,
  renderNoResults: PropTypes.func,
  locations: PropTypes.object,
};
DocList.defaultProps = {
  fragmentName: 'default',
  variables: {},
  errorPolicy: 'none',
  renderDoc: null,
  renderError: null,
  renderLoaded: null,
  render: null,
  renderLoading: null,
  renderControls: null,
  renderPaginationControls: null,
  renderWhereControls: null,
  renderOrderByControls: null,
  renderNoResults: null,
  locations: {
    top: ['pagination', 'where', 'order-by'],
    bottom: ['pagination'],
  },
};


export { DocList };
